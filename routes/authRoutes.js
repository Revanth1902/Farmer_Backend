const express = require("express");
const router = express.Router();
const {
  register,
  verifyOtp,
  login,
  updateProfileDetails,
  updateProfileImage,
} = require("../controllers/authController");

const parser = require("../middlewares/upload");
const authenticate = require("../middlewares/auth"); // your JWT auth middleware

router.post("/register", register);
router.post("/verify", verifyOtp);
router.post("/login", login); // ✅ New login route

module.exports = router;

// In routes/auth.js
router.put(
  "/update-profile", // JWT middleware to set req.userId
  updateProfileDetails
);
router.put(
  "/update-image",
  parser.single("image"), // multer middleware
  updateProfileImage
);

module.exports = router;
