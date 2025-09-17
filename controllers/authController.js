const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendOtp = require("../utils/sendOtp");

// OTP Generator
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ========================
// Register Controller
// ========================
// ========================
// Login Controller
// ========================
const login = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  const user = await User.findOne({ mobile });

  if (!user) {
    return res
      .status(404)
      .json({ message: "User not found. Please register." });
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  console.log(`Saved OTP for ${mobile}: ${otp}, expires at ${otpExpiry}`);

  // Handle Test Mode vs Real SMS
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

  console.log(`Saved OTP for ${mobile}: ${otp}, expires at ${otpExpiry}`);

  // Handle Test Mode vs Real SMS
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
  console.log(`Verify OTP attempt: mobile=${mobile}, otp=${otp}`);

  const user = await User.findOne({ mobile });
  if (!user) {
    console.log("User not found");
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  console.log(`User OTP: ${user.otp}, Expiry: ${user.otpExpiry}`);

  // Trim OTP strings to avoid whitespace issues
  if ((user.otp?.trim() || "") !== (otp?.trim() || "")) {
    console.log("OTP does not match");
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    console.log("OTP expired");
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // Clear OTP and expiry after successful verification
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
const updateUserDetails = async (req, res) => {
  try {
    const { mobile, name, state, district, village } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    // Find user by mobile number
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only provided fields
    if (name) user.name = name;
    if (state) user.state = state;
    if (district) user.district = district;
    if (village) user.village = village;

    // Handle image from req.file (Cloudinary + Multer must be set up)
    if (req.file && req.file.path) {
      user.imageUrl = req.file.path;
    }

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        state: user.state,
        district: user.district,
        village: user.village,
        imageUrl: user.imageUrl || null,
      },
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { register, verifyOtp, login, updateUserDetails };
