const express = require("express");
const {
  registerController,
  loginController,
  updateUserController,
  requireSignIn,
  forgotPasswordController,
  resetPasswordController,
  updatePasswordController,
} = require("../controllers/userController");

// router object
const router = express.Router();

// routes
// REGISTER || POST
router.post("/register", registerController);

// LOGIN || POST
router.post("/login", loginController);

// FORGOT PASSWORD || POST
router.post("/forgot-password", forgotPasswordController);

// RESET PASSWORD || POST
router.post("/reset-password", resetPasswordController);

// update password
router.post("/update-password", requireSignIn, updatePasswordController);

// UPDATE || PUT
router.put("/update-user", requireSignIn, updateUserController);

// export
module.exports = router;
