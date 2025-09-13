const axios = require("axios");

const sendOtp = async (mobile, otp) => {
  try {
    const response = await axios.post(
      "https://your-whatsapp-api.com/send", // ⬅️ Replace with your API endpoint
      {
        to: `+91${mobile}`, // or just `mobile`, depending on your API
        message: `Your OTP is: ${otp}`,
        // other required fields based on your API
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`, // or your required auth
          "Content-Type": "application/json",
        },
      }
    );

    // Adjust condition based on your API's response
    if (response.data.success) {
      console.log("✅ OTP sent via WhatsApp to", mobile);
      return true;
    } else {
      console.error("❌ Failed to send WhatsApp OTP:", response.data.message);
      return false;
    }
  } catch (error) {
    console.error(
      "❌ WhatsApp OTP API error:",
      error.response?.data || error.message
    );
    return false;
  }
};

module.exports = sendOtp;
