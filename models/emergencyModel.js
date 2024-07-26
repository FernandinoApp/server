const mongoose = require("mongoose");
const Counter = require("./counterModel");

// schema
const emergencySchema = new mongoose.Schema(
  {
    emergencyId: {
      type: String,
      unique: true,
    },
    category: {
      type: String,
      required: [true, "please select incident category"],
    },
    fullName: {
      type: String,
      required: true,
    },
    barangay: {
      type: String,
      required: [true, "please select barangay"],
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
      required: [true, "please upload a photo"],
    },
    postedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    responded: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

emergencySchema.pre('save', async function(next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { id: 'emergencyId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.emergencyId = counter.seq.toString().padStart(3, '0');
  }
  next();
});

const Emergency = mongoose.model('Emergency', emergencySchema);

module.exports = Emergency;
