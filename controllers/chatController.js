// controllers/chatController.js
const axios = require("axios");
const { GEMINI_API_URL } = require("../models/geminiModel");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Detect Malayalam by Unicode range
const detectLanguage = (text) => {
  return /[\u0D00-\u0D7F]/.test(text) ? "ml" : "en";
};

exports.sendMessage = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const language = detectLanguage(message);

  const systemPrompt =
    language === "ml"
      ? "കർഷകരുടെ കൃഷിയുമായി ബന്ധപ്പെട്ട ചോദ്യങ്ങൾക്ക് മലയാളത്തിൽ ഉപദേശം നൽകുക."
      : "Provide farming advice in English for the user's question.";

  const payload = {
    contents: [
      {
        parts: [{ text: `${systemPrompt}\nUser: ${message}` }],
      },
    ],
  };

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const geminiReply =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No reply from Gemini.";

    res.status(200).json({ reply: geminiReply, language });
  } catch (err) {
    console.error("Gemini error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Gemini API error", details: err.message });
  }
};
