const JWT = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../helpers/authHelper");
const { createCustomID } = require("../helpers/idHelper");
const userModel = require("../models/userModel");
const cloudinary = require("../utils/cloudinary");
const multer = require("multer");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
var { expressjwt: jwt } = require("express-jwt");

// multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// middleware
const requireSignIn = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

// helper function to upload images to cloudinary
const uploadImageToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// register
const registerController = async (req, res) => {
  try {
    const { lastname, firstname, middlename, suffix, houseno, barangay, birthday, gender, number, email, password, certification } = req.body;
    // validation
    if (!lastname || !firstname || !middlename || !houseno || !barangay || !birthday || !gender || !number || !email || !password || !certification) {
      return res.status(400).send({
        success: false,
        message: "Please Provide All Fields",
      });
    }

    // existing user  
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(500).send({
        success: false,
        message: "User Already Registered with this Email Address",
      });
    }

    // hashed password
    const hashedPassword = await hashPassword(password);

    // generate custom user ID
    const userId = await createCustomID();

    // upload images to cloudinary
    let imageidUrl = null;
    let imageclearanceUrl = null;

    if (req.files.imageid) {
      try {
        const result = await uploadImageToCloudinary(req.files.imageid[0].buffer, "user_id_images");
        imageidUrl = result.secure_url;
      } catch (error) {
        console.error("Error uploading image ID to Cloudinary:", error);
        return res.status(500).send({
          success: false,
          message: "Error uploading image ID",
        });
      }
    }

    if (req.files.imageclearance) {
      try {
        const result = await uploadImageToCloudinary(req.files.imageclearance[0].buffer, "user_clearance_images");
        imageclearanceUrl = result.secure_url;
      } catch (error) {
        console.error("Error uploading image clearance to Cloudinary:", error);
        return res.status(500).send({
          success: false,
          message: "Error uploading image clearance",
        });
      }
    }

    // save user
    const user = await new userModel({
      userId,
      lastname,
      firstname,
      middlename,
      suffix,
      houseno,
      barangay,
      birthday,
      gender,
      number,
      email,
      password: hashedPassword,
      imageid: imageidUrl,
      imageclearance: imageclearanceUrl,
      certification,
    }).save();

    // Emit new user event
    const io = req.app.get("io");
    io.emit("new-user", user);

    return res.status(201).send({
      success: true,
      message: "Registration Successful, Please Login",
      user,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in Register API",
      error,
    });
  }
};

// login
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    // validation
    if (!email || !password) {
      return res.status(500).send({
        success: false,
        message: "Please Provide Email or Password",
      });
    }
    // find user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "User Not Found",
      });
    }
    // match password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(500).send({
        success: false,
        message: "Invalid Email or Password",
      });
    }
    // TOKEN JWT
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
    });

    // undefined password
    user.password = undefined;
    res.status(200).send({
      success: true,
      message: "Login Successfully",
      token,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in Login API",
      error,
    });
  }
};
// forgot password
const forgotPasswordController = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).send({
        success: false,
        message: 'User with this email does not exist',
      });
    }

    const resetToken = crypto.randomBytes(3).toString('hex');
    const resetTokenExpiration = Date.now() + 1800000 // 30 minutes

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiration;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL,
      subject: 'Password Reset',
      text: `You are receiving this because you requested a password reset for your account. Please use this verification code to reset your password within the next 30 minutes: ${resetToken}`,
      html: `
        <p>You are receiving this because you requested a password reset for your account.<br>
        Please use this verification code to reset your password within the next 30 minutes: <strong>${resetToken}</strong></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.send({
      success: true,
      message: 'An email has been sent to your email address',
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Error in sending email',
      error,
    });
  }
};

// reset password
const resetPasswordController = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).send({
        success: false,
        message: 'Password reset token is invalid or has expired',
      });
    }

    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.send({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Error in resetting password',
      error,
    });
  }
};

// update password
const updatePasswordController = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await userModel.findById(req.user._id);

    // verify current password
    const match = await comparePassword(currentPassword, user.password);
    if (!match) {
      return res.status(400).send({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // update password
    user.password = await hashPassword(newPassword);
    await user.save();

    user.password = undefined;
    res.status(200).send({
      success: true,
      message: "Password updated successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in updating password",
      error,
    });
  }
};

// update user
const updateUserController = async (req, res) => {
  try {
    const { name, password, email } = req.body;
    // user find
    const user = await userModel.findOne({ email });
    // password validate
    if (password && password.length < 6) {
      return res.status(400).send({
        success: false,
        message: "Password is required and should be 6 characters long",
      });
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;
    // updated user
    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      {
        name: name || user.name,
        password: hashedPassword || user.password,
      },
      { new: true }
    );
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "Profile Updated Please Login",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In User Update API",
      error,
    });
  }
};

// In userController.js
const getAllUsersController = async (req, res) => {
  try {
    const users = await userModel.find({}, 'userId lastname middlename firstname houseno number barangay birthday gender email imageid imageclearance accepted rejected');
    res.status(200).send({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting users",
      error,
    });
  }
};

// delete user
const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    await userModel.findByIdAndDelete(id);
    res.status(200).send({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in deleting user",
      error,
    });
  }
};

const acceptUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: 'User not found',
      });
    }
    user.accepted = true;
    await user.save();
    res.status(200).send({
      success: true,
      message: 'User accepted successfully',
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'Error in accepting user',
      error,
    });
  }
};

const rejectUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: 'User not found',
      });
    }
    user.rejected = true;
    await user.save();
    res.status(200).send({
      success: true,
      message: 'User rejected successfully',
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'Error in rejecting user',
      error,
    });
  }
};

module.exports = {
  requireSignIn,
  registerController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  updateUserController,
  updatePasswordController,
  getAllUsersController,
  deleteUserController,
  acceptUserController,
  rejectUserController,
  upload,
};
