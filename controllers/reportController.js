const Report = require("../models/reportModel");
const cloudinary = require("../utils/cloudinary");
const nodemailer = require("nodemailer");
const multer = require("multer");

// multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

const createReportController = async (req, res) => {
  const { fullName, barangay, location, comment, category, reportType } = req.body;
  let imageUrl = null;

  try {
    if (!barangay || !location || !comment || !category || !reportType) {
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
      fullName,
      barangay,
      location,
      comment,
      image: imageUrl,
      postedBy: req.auth._id,
    });

    await newReport.save();

    req.app.get("io").emit("new-report", newReport);

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
      subject: `New Incident Report: ${category} (${newReport.reportId})`,
      text: `A new incident report has been submitted.

Category: ${category}
Report ID: ${newReport.reportId}
Name: ${fullName}
Location: ${barangay}, ${location}
Comment: ${comment}
Image: ${imageUrl}

Please check the admin panel for more details.`,
      html: `
        <p>A new incident report has been submitted.</p>
        <ul>
          <li><strong>Category:</strong> ${category}</li>
          <li><strong>Report ID:</strong> ${newReport.reportId}</li>
          <li><strong>Name:</strong> ${fullName}</li>
          <li><strong>Location:</strong> ${barangay}, ${location}</li>
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
    console.error('Error in createReportController:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all reports
const getAllReportsController = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("postedBy", "userId fullName")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      message: "All Reports Data",
      reports: reports.map(report => ({
        reportId: report.reportId,
        reportType: report.reportType,
        category: report.category,
        fullName: report.fullName,
        barangay: report.barangay,
        location: report.location,
        comment: report.comment,
        image: report.image,
        postedBy: report.postedBy,
        responded: report.responded,
        archived: report.archived,
        createdAt: report.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error in getAllReportsController:', error);
    res.status(500).send({
      success: false,
      message: "Error in get all reports API",
      error,
    });
  }
};

const deleteReportController = async (req, res) => {
  try {
    const { id } = req.params;
    await Report.findByIdAndDelete(id);
    res.status(200).send({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error('Error in deleteReportController:', error);
    res.status(500).send({
      success: false,
      message: "Error in deleting report",
      error,
    });
  }
};

const getRespondedReportsController = async (req, res) => {
  try {
    const respondedReports = await Report.find({ responded: true });
    res.status(200).send({
      success: true,
      message: "All Responded Reports",
      respondedReports,
    });
  } catch (error) {
    console.error('Error in getRespondedReportsController:', error);
    res.status(500).send({
      success: false,
      message: "Error in get responded reports API",
      error,
    });
  }
};

const archiveReportController = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findOneAndUpdate({ reportId: id }, { archived: true }, { new: true });
    if (report) {
      res.status(200).send({
        success: true,
        message: "Report archived successfully",
        report,
      });
    } else {
      res.status(404).send({
        success: false,
        message: "Report not found",
      });
    }
  } catch (error) {
    console.error('Error in archiveReportController:', error);
    res.status(500).send({
      success: false,
      message: "Error in archiving report",
      error,
    });
  }
};

const markReportAsRespondedController = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findOneAndUpdate({ reportId: id }, { responded: true }, { new: true });
    if (report) {
      res.status(200).send({
        success: true,
        message: "Report marked as responded",
        report,
      });
    } else {
      res.status(404).send({
        success: false,
        message: "Report not found",
      });
    }
  } catch (error) {
    console.error('Error in markReportAsRespondedController:', error);
    res.status(500).send({
      success: false,
      message: "Error in marking report as responded",
      error,
    });
  }
};
const getUserReportsController = async (req, res) => {
  try {
    const reports = await Report.find({ postedBy: req.auth._id });
    res.status(200).send({
      success: true,
      message: "User Reports Data",
      reports,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in fetching user's reports",
      error,
    });
  }
};


module.exports = { 
  createReportController, 
  getAllReportsController, 
  deleteReportController, 
  markReportAsRespondedController,
  archiveReportController, 
  getRespondedReportsController,
  getUserReportsController, 
  upload 
};
