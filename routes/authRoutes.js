const express = require("express");
const router = express.Router();
const { register, verifyOtp } = require("../controllers/authController");

router.post("/register", register);
router.post("/verify", verifyOtp);

module.exports = router;
