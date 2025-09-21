const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    otp: { type: String },
    otpExpiry: { type: Date },
    state: { type: String },
    district: { type: String },
    village: { type: String },
    landType: { type: String }, // Added
    farmSize: { type: String }, // Added
    prevCrops: { type: String }, // Added
    presentCrop: { type: String }, // Added
    latitude: { type: String }, // Added
    longitude: { type: String }, // Added
    imageUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
