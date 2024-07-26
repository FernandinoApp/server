const express = require("express");
const { requireSignIn } = require("../controllers/userController");
const { createEmergencyController, getAllEmergenciesController, deleteEmergencyController, markEmergencyAsRespondedController, getRespondedEmergenciesController, archiveEmergencyController,   getUserEmergenciesController,
upload } = require("../controllers/emergencyController");

//router object
const router = express.Router();

// CREATE POST || POST
router.post("/create-emergency", requireSignIn, upload.single('image'), createEmergencyController);

// GET ALL POSTS
router.get("/get-all-emergency", getAllEmergenciesController);

// DELETE EMERGENCY
router.delete("/delete-emergency/:id", deleteEmergencyController);

// MARK EMERGENCY AS RESPONDED
router.post("/respond-emergency/:id", markEmergencyAsRespondedController);

// GET RESPONDED EMERGENCIES
router.get("/get-responded-emergencies", getRespondedEmergenciesController);

// ARCHIVE EMERGENCY
router.post("/archive-emergency/:id", archiveEmergencyController);

router.get("/get-user-emergencies", requireSignIn, getUserEmergenciesController); // Add this route


module.exports = router;
