const express = require("express");
const router = express.Router();
const {
  register,
  verifyOtp,
  login,
  updateUserDetails,
} = require("../controllers/authController");

const parser = require("../middlewares/upload");
const authenticate = require("../middlewares/auth"); // your JWT auth middleware

router.post("/register", register);
router.post("/verify", verifyOtp);
router.post("/login", login); // ✅ New login route

module.exports = router;

router.put(
  "/update",
  parser.single("image"), // multer middleware to parse 'image' file from form-data
  updateUserDetails
);

module.exports = router;
