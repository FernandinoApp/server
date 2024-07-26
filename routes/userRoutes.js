const express = require("express");
const {
  registerController,
  loginController,
  updateUserController,
  requireSignIn,
  forgotPasswordController,
  resetPasswordController,
  updatePasswordController,
  getAllUsersController,
  deleteUserController,
  acceptUserController,
  rejectUserController,
  upload
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", upload.fields([{ name: 'imageid' }, { name: 'imageclearance' }]), registerController);

router.post("/login", loginController);

router.post("/forgot-password", forgotPasswordController);

router.post("/reset-password", resetPasswordController);

router.post("/update-password", requireSignIn, updatePasswordController);

router.put("/update-user", requireSignIn, updateUserController);

router.get("/get-all-users", getAllUsersController);

router.put("/accept-user/:id", acceptUserController);

router.put("/reject-user/:id", rejectUserController);

module.exports = router;
