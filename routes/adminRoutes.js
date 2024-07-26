const express = require("express");
const {
  getAllAdmins,
  registerAdminController,
  loginAdminController,
} = require("../controllers/adminController");

//router object
const router = express.Router();

// GET ALL USERS || GET
router.get("/all-admins", getAllAdmins);

// CREATE USER || POST
router.post("/register", registerAdminController);

//LOGIN || POST
router.post("/login", loginAdminController);

module.exports = router;