const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendOtp = require("../utils/sendOtp");
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// const sendOtp = require("../utils/sendOtp"); // add this

const register = async (req, res) => {
  const { name, mobile } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ message: "Name and mobile are required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  let user = await User.findOne({ mobile });

  if (!user) {
    user = await User.create({ name, mobile, otp, otpExpiry });
  } else {
    user.name = name;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
  }

  // 👇 Only send real OTP if USE_SMS=true
  if (process.env.USE_SMS === "true") {
    const sent = await sendOtpViaSMS(mobile, otp);
    if (!sent) {
      return res.status(500).json({ message: "Failed to send OTP" });
    }
  } else {
    console.log(`🔁 [Test Mode] OTP for ${mobile} is ${otp}`);
  }

  return res
    .status(200)
    .json({ message: "OTP sent (or printed in test mode)" });
};

const verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  const user = await User.findOne({ mobile });

  if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.status(200).json({ message: "Login successful", token });
};

module.exports = { register, verifyOtp };
