const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendOtpViaWhatsApp = async (mobile, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: "whatsapp:+14155238886", // Twilio Sandbox WhatsApp number
      to: `whatsapp:+91${mobile}`,
    });

    console.log("✅ WhatsApp OTP sent:", message.sid);
    return true;
  } catch (error) {
    console.error("❌ WhatsApp OTP error:", error.message);
    return false;
  }
};

module.exports = sendOtpViaWhatsApp;
