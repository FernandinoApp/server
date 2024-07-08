const mongoose = require("mongoose");

//schema
const reportSchema = new mongoose.Schema(
  {
    reportType: {
    type: String,
    required: true,
    enum: ['Traffic', 'Waste Management', 'Engineering', 'Animals'],
  },
    category: {
      type: String,
      required: [true, "please select incident category"],
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
      required: [true, "please add comment"],
    },
    image: {
      type: String,
    },
    
    postedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;