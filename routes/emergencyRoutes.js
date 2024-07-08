const express = require("express");
const { requireSignIn } = require("../controllers/userController");
const { createEmergencyController, getAllEmergenciesController, upload } = require("../controllers/emergencyController");

//router object
const router = express.Router();

// CREATE POST || POST
router.post("/create-emergency", requireSignIn, upload.single('image'), createEmergencyController);

// GET ALL POSTS
router.get("/get-all-emergency", getAllEmergenciesController);


module.exports = router;
