const mongoose = require("mongoose");

//schema
const emergencySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "please add emergency category"],
    },
    name: {
      type: String,
      required: [true, "please add reporter name"],
    },
    location: {
      type: String,
      required: [true, "please add location"],
    },
    comment: {
      type: String,
      required: [true, "please add emergency comment"],
    },
    image: {
      type: String,
      
    },
    postedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Emergency", emergencySchema);
