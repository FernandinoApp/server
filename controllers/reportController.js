const Report = require("../models/reportModel");
const cloudinary = require("../utils/cloudinary");
const nodemailer = require("nodemailer");
const multer = require("multer");

// multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

const createReportController = async (req, res) => {
  const { name, location, comment, category, reportType } = req.body;
  let imageUrl = null;

  try {
    if (!name || !location || !comment || !category || !reportType) {
      return res.status(500).send({
        success: false,
        message: "Please Provide All Fields",
      });
    }

    // upload image to cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "incident_reports", resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const newReport = new Report({
      reportType,
      category,
      name,
      location,
      comment,
      image: imageUrl,
      postedBy: req.auth._id,
    });

    await newReport.save();

    // nodemailer transporter
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
      subject: `New Incident Report: ${category}`,
      text: `A new incident report has been submitted.

Category: ${category}
Name: ${name}
Location: ${location}
Comment: ${comment}
Image: ${imageUrl}

Please check the admin panel for more details.`,
      html: `
        <p>A new incident report has been submitted.</p>
        <ul>
          <li><strong>Category:</strong> ${category}</li>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Location:</strong> ${location}</li>
          <li><strong>Comment:</strong> ${comment}</li>
        </ul>
        ${imageUrl ? `<p><img src="${imageUrl}" alt="Incident Image" width="400"/></p>` : ''}
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

    res.status(201).json({ message: 'Your report is submitted successfully!', report: newReport });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all posts
const getAllReportsController = async (req, res) => {
  try {
    const reports = await Report.find().populate("postedBy", "userId name").sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      message: "All Reports Data",
      reports,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get all reports API",
      error,
    });
  }
};

module.exports = { createReportController, getAllReportsController, upload };