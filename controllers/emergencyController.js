const Emergency = require("../models/emergencyModel");
const cloudinary = require("../utils/cloudinary");
const nodemailer = require("nodemailer");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const createEmergencyController = async (req, res) => {
  try {
    const { fullName, comment, category, barangay, location } = req.body;
    let imageUrl = null;

    if (!comment || !category || !barangay || !location) {
      return res.status(400).send({
        success: false,
        message: "Please Provide All Fields",
      });
    }

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

    const emergency = await Emergency({
      category,
      fullName,
      barangay,
      location,
      comment,
      image: imageUrl,
      postedBy: req.auth._id,
    }).save();

    req.app.get("io").emit("new-emergency", emergency);

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `New Emergency Report: ${category} (${emergency.emergencyId})`,
      text: `A new emergency report has been submitted.

Category: ${category}
Emergency ID: ${emergency.emergencyId}
Name: ${fullName}
Location: ${barangay},${location}
Comment: ${comment}
Image: ${imageUrl}

Please check the admin panel for more details.`,
      html: `
        <p>A new emergency report has been submitted.</p>
        <ul>
          <li><strong>Category:</strong> ${category}</li>
          <li><strong>Emergency ID:</strong> ${emergency.emergencyId}</li>
          <li><strong>Name:</strong> ${fullName}</li>
          <li><strong>Location:</strong> ${barangay}, ${location}</li>
          <li><strong>Comment:</strong> ${comment}</li>
        </ul>
        ${imageUrl ? `<p><img src="${imageUrl}" alt="Emergency Image" width="400"/></p>` : ''}
        <p>Please check the admin panel for more details.</p>
      `,
    };

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
    console.error('Error in createEmergencyController:', error);
    res.status(500).send({
      success: false,
      message: "Error in Create Emergency Report API",
      error,
    });
  }
};

const getAllEmergenciesController = async (req, res) => {
  try {
    const emergencies = await Emergency.find()
      .populate("postedBy", "userId fullName")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      message: "All Emergencies Data",
      emergencies: emergencies.map(emergency => ({
        emergencyId: emergency.emergencyId,
        category: emergency.category,
        fullName: emergency.fullName,
        barangay: emergency.barangay,
        location: emergency.location,
        comment: emergency.comment,
        image: emergency.image,
        postedBy: emergency.postedBy,
        responded: emergency.responded,
        archived: emergency.archived,
        createdAt: emergency.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error in getAllEmergenciesController:', error);
    res.status(500).send({
      success: false,
      message: "Error in GET ALL EMERGENCIES API",
      error,
    });
  }
};

const deleteEmergencyController = async (req, res) => {
  try {
    const { id } = req.params;
    await Emergency.findByIdAndDelete(id);
    res.status(200).send({
      success: true,
      message: "Emergency deleted successfully",
    });
  } catch (error) {
    console.error('Error in deleteEmergencyController:', error);
    res.status(500).send({
      success: false,
      message: "Error in deleting emergency",
      error,
    });
  }
};

const markEmergencyAsRespondedController = async (req, res) => {
  try {
    const { id } = req.params;
    const emergency = await Emergency.findOneAndUpdate({ emergencyId: id }, { responded: true }, { new: true });
    if (emergency) {
      res.status(200).send({
        success: true,
        message: "Emergency marked as responded",
        emergency,
      });
    } else {
      res.status(404).send({
        success: false,
        message: "Emergency not found",
      });
    }
  } catch (error) {
    console.error('Error in markEmergencyAsRespondedController:', error);
    res.status(500).send({
      success: false,
      message: "Error in marking emergency as responded",
      error,
    });
  }
};

const archiveEmergencyController = async (req, res) => {
  try {
    const { id } = req.params;
    const emergency = await Emergency.findOneAndUpdate({ emergencyId: id }, { archived: true }, { new: true });
    if (emergency) {
      res.status(200).send({
        success: true,
        message: "Emergency archived successfully",
        emergency,
      });
    } else {
      res.status(404).send({
        success: false,
        message: "Emergency not found",
      });
    }
  } catch (error) {
    console.error('Error in archiveEmergencyController:', error);
    res.status(500).send({
      success: false,
      message: "Error in archiving emergency",
      error,
    });
  }
};

const getRespondedEmergenciesController = async (req, res) => {
  try {
    const respondedEmergencies = await Emergency.find({ responded: true });
    res.status(200).send({
      success: true,
      message: "All Responded Emergencies",
      respondedEmergencies,
    });
  } catch (error) {
    console.error('Error in getRespondedEmergenciesController:', error);
    res.status(500).send({
      success: false,
      message: "Error in get responded emergencies API",
      error,
    });
  }
};
const getUserEmergenciesController = async (req, res) => {
  try {
    const emergencies = await Emergency.find({ postedBy: req.auth._id });
    res.status(200).send({
      success: true,
      message: "User Emergencies Data",
      emergencies,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in fetching user's emergencies",
      error,
    });
  }
};

module.exports = { 
  createEmergencyController, 
  getAllEmergenciesController,  
  deleteEmergencyController, 
  markEmergencyAsRespondedController,
  getRespondedEmergenciesController, 
  archiveEmergencyController,
  getUserEmergenciesController, // Added the new controller

  upload 
};
