const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendOtp = require("../utils/sendOtp");

// OTP Generator
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ========================
// Register Controller
// ========================
const register = async (req, res) => {
  const { name, mobile, state, district, village } = req.body;

  if (!name || !mobile || !state || !district || !village) {
    return res.status(400).json({
      message:
        "All fields are required: name, mobile, state, district, village",
    });
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

  let user = await User.findOne({ mobile });

  if (!user) {
    user = await User.create({
      name,
      mobile,
      state,
      district,
      village,
      otp,
      otpExpiry,
    });
  } else {
    // Update OTP and user details
    user.name = name;
    user.state = state;
    user.district = district;
    user.village = village;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
  }

  // ✅ NEW: Handle Test Mode vs Real SMS
  if (process.env.USE_SMS === "true") {
    const sent = await sendOtp(mobile, otp);
    if (!sent) {
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    return res.status(200).json({ message: "OTP sent successfully" });
  } else {
    // In test mode, return the OTP in the response
    console.log(`🔁 [Test Mode] OTP for ${mobile}: ${otp}`);
    return res.status(200).json({
      message: "OTP (test mode)",
      otp, // ⚠️ Only return in test mode
    });
  }
};

// ========================
// Verify OTP Controller
// ========================
const verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  const user = await User.findOne({ mobile });

  if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // OTP is correct
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      state: user.state,
      district: user.district,
      village: user.village,
    },
  });
};

module.exports = { register, verifyOtp };
