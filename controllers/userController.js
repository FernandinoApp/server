const JWT = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../helpers/authHelper");
const { createCustomID } = require("../helpers/idHelper");
const userModel = require("../models/userModel");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
var { expressjwt: jwt } = require("express-jwt");

// middleware
const requireSignIn = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

// register
const registerController = async (req, res) => {
  try {
    const { lastname, firstname, middlename, suffix, houseno, barangay, birthday, gender, number, email, password, imageid, imageclearance } = req.body;
    // validation
    if (!lastname) {
      return res.status(400).send({
        success: false,
        message: "last name is required",
      });
    }
    if (!firstname) {
      return res.status(400).send({
        success: false,
        message: "first name is required",
      });
    }
    if (!middlename) {
      return res.status(400).send({
        success: false,
        message: "middle name is required",
      });
    }
    if (!houseno) {
      return res.status(400).send({
        success: false,
        message: "house number is required",
      });
    }
    if (!barangay) {
      return res.status(400).send({
        success: false,
        message: "barangay is required",
      });
    }
    if (!birthday) {
      return res.status(400).send({
        success: false,
        message: "birthday is required",
      });
    }
    if (!gender) {
      return res.status(400).send({
        success: false,
        message: "gender is required",
      });
    }
    if (!number) {
      return res.status(400).send({
        success: false,
        message: "mobile number is required",
      });
    }
    if (!email) {
      return res.status(400).send({
        success: false,
        message: "email is required",
      });
    }
    if (!password || password.length < 6) {
      return res.status(400).send({
        success: false,
        message: "password is required and 6 characters long",
      });
    }
    if (!imageid) {
      return res.status(400).send({
        success: false,
        message: "image is required",
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
      imageid,
      imageclearance,
    }).save();

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
    const users = await userModel.find();
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

module.exports = { 
  requireSignIn, 
  registerController, 
  loginController,
  forgotPasswordController,
  resetPasswordController, 
  updateUserController,
  updatePasswordController,
  getAllUsersController
};
