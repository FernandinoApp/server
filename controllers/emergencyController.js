const emergencyModel = require("../models/emergencyModel");
const cloudinary = require("../utils/cloudinary");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");

// multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// create emergency report
const createEmergencyController = async (req, res) => {
  try {
    const { name, comment,category, location } = req.body;
    let imageUrl = null;

    // validate
    if(!name || !comment || !category || !location) {
      return res.status(500).send({
        success: false,
        message: "Please Provide All Fields",
      });
    }

    // upload image to cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "emergency_reports", resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const emergency = await emergencyModel({
      category,
      name,
      location,
      comment,
      image: imageUrl,
      postedBy: req.auth._id,
    }).save();

    // set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // create email options
    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `New Emergency Report: ${category}`,
      text: `A new emergency report has been submitted.

Category: ${category}
Name: ${name}
Location: ${location}
Comment: ${comment}
Image: ${imageUrl}

Please check the admin panel for more details.`,
      html: `
        <p>A new emergency report has been submitted.</p>
        <ul>
          <li><strong>Category:</strong> ${category}</li>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Location:</strong> ${location}</li>
          <li><strong>Comment:</strong> ${comment}</li>
        </ul>
        ${imageUrl ? `<p><img src="${imageUrl}" alt="Emergency Image" width="400"/></p>` : ''}
        <p>Please check the admin panel for more details.</p>
      `,
    };

    // send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(`Email sent: ${info.response}`);
      }
    });

    res.status(201).send({
      success: true,
      message: "Your emergency report is submitted successfully!",
      emergency,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Create Post API",
      error,
    });
  }
};

// GET ALL POSTS
const getAllEmergenciesController = async (req, res) => {
  try {
    const emergencies = await emergencyModel.find().populate("postedBy", "userId name").sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      message: "All Posts Data",
      emergencies,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in GETALLPOST API",
      error,
    });
  }
};

module.exports = { createEmergencyController, getAllEmergenciesController, upload };
