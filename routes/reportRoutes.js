const express = require("express");
const { requireSignIn } = require("../controllers/userController");
const { createReportController, getAllReportsController, upload } = require("../controllers/reportController");

//router object
const router = express.Router();

// CREATE POST || POST
router.post("/create-report", requireSignIn, upload.single('image'), createReportController);

// GET ALL POSTS
router.get("/get-all-report", getAllReportsController);

//export
module.exports = router;
