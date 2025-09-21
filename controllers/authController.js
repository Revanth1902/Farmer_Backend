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
  const {
    name,
    mobile,
    state,
    district,
    village,
    landType,
    farmSize,
    prevCrops,
    presentCrop,
    latitude,
    longitude,
  } = req.body;

  if (
    !name ||
    !mobile ||
    !state ||
    !district ||
    !village ||
    !landType ||
    !farmSize ||
    !prevCrops ||
    !presentCrop ||
    !latitude ||
    !longitude
  ) {
    return res.status(400).json({
      message:
        "All fields are required: name, mobile, state, district, village, landType, farmSize, prevCrops, presentCrop, latitude, longitude",
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
      landType,
      farmSize,
      prevCrops,
      presentCrop,
      latitude,
      longitude,
      otp,
      otpExpiry,
    });
  } else {
    // Update OTP and user details
    user.name = name;
    user.state = state;
    user.district = district;
    user.village = village;
    user.landType = landType;
    user.farmSize = farmSize;
    user.prevCrops = prevCrops;
    user.presentCrop = presentCrop;
    user.latitude = latitude;
    user.longitude = longitude;
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

  if (process.env.USE_SMS === "true") {
    const sent = await sendOtp(mobile, otp);
    if (!sent) {
      return res.status(500).json({ message: "Failed to send OTP" });
    }
    return res.status(200).json({ message: "OTP sent successfully" });
  } else {
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
      landType: user.landType,
      farmSize: user.farmSize,
      prevCrops: user.prevCrops,
      presentCrop: user.presentCrop,
      latitude: user.latitude,
      longitude: user.longitude,
      imageUrl: user.imageUrl,
    },
  });
};

// ========================
// Update User Details Controller
// ========================
const updateUserDetails = async (req, res) => {
  try {
    const userId = req.userId; // from JWT middleware
    const {
      name,
      state,
      district,
      village,
      landType,
      farmSize,
      prevCrops,
      presentCrop,
      latitude,
      longitude,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update all fields except mobile
    if (name) user.name = name;
    if (state) user.state = state;
    if (district) user.district = district;
    if (village) user.village = village;
    if (landType) user.landType = landType;
    if (farmSize) user.farmSize = farmSize;
    if (prevCrops) user.prevCrops = prevCrops;
    if (presentCrop) user.presentCrop = presentCrop;
    if (latitude) user.latitude = latitude;
    if (longitude) user.longitude = longitude;

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
        landType: user.landType,
        farmSize: user.farmSize,
        prevCrops: user.prevCrops,
        presentCrop: user.presentCrop,
        latitude: user.latitude,
        longitude: user.longitude,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { register, verifyOtp, login, updateUserDetails };
