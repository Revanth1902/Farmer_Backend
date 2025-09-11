const axios = require("axios");

const sendOtp = async (mobile, otp) => {
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        variables_values: otp,
        route: "otp",
        numbers: mobile,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.return) {
      console.log("✅ OTP sent to", mobile);
      return true;
    } else {
      console.error("❌ Failed to send OTP:", response.data.message);
      return false;
    }
  } catch (error) {
    console.error(
      "❌ Fast2SMS API error:",
      error.response?.data || error.message
    );
    return false;
  }
};

module.exports = sendOtp;
