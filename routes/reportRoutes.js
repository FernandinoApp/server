const express = require("express");
const { requireSignIn } = require("../controllers/userController");
const {
  createReportController,
  getAllReportsController,
  deleteReportController,
  markReportAsRespondedController,
  getRespondedReportsController,
  archiveReportController,
  getUserReportsController,  // Import the new controller
  upload,
} = require("../controllers/reportController");

// router object
const router = express.Router();

// CREATE POST || POST
router.post("/create-report", requireSignIn, upload.single('image'), createReportController);

// GET ALL POSTS
router.get("/get-all-report", getAllReportsController);

// DELETE REPORT
router.delete("/delete-report/:id", deleteReportController);

// MARK REPORT AS RESPONDED
router.post("/respond-report/:id", markReportAsRespondedController);

// GET RESPONDED REPORTS
router.get("/get-responded-reports", getRespondedReportsController);

// ARCHIVE REPORT
router.post("/archive-report/:id", archiveReportController);

// GET USER'S REPORTS
router.get("/get-user-reports", requireSignIn, getUserReportsController);  // Add this route

// export
module.exports = router;
