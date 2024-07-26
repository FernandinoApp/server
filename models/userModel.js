const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    lastname: {
      type: String,
      required: [true, "please add last name"],
      trim: true,
    },
    firstname: {
      type: String,
      required: [true, "please add first name"],
      trim: true,
    },
    middlename: {
      type: String,
      required: [true, "please add middle name"],
      trim: true,
    },
    suffix: {
      type: String,
      trim: true,
    },
    houseno: {
      type: String,
      required: [true, "please add house number"],
      trim: true,
    },
    barangay: {
      type: String,
      required: [true, "please add barangay"],
      trim: true,
    },
    birthday: {
      type: Date,
      required: [true, "please add birthday"],
    },
    gender: {
      type: String,
      required: [true, "please add gender"],
      trim: true,
    },
    number: {
      type: String,
      required: [true, "please add mobile number"],
      trim: true,
      minlength: [11, "Mobile number must be 11 digits"],
      maxlength: [11, "Mobile number must be 11 digits"],
    },
    email: {
      type: String,
      required: [true, "please add email"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "please add password"],
      minlength: [6, "Password must be at least 6 characters"],
      maxlength: [64, "Password cannot be more than 64 characters"],
    },
    imageid: {
      type: String,
      required: [true, "please add valid id"],
    },
    certification: {
      type: String,
      required: [true, "please agree to the terms and conditions"],
    },
    imageclearance: {
      type: String,
    },
    role: {
      type: String,
      default: "user",
    },
    userId: {
      type: String,
      unique: true,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    accepted: {
      type: Boolean,
      default: false,
    },
    rejected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
