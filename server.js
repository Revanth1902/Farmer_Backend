const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors"); // ✅ import cors

dotenv.config();

const authRoutes = require("./routes/authRoutes");

const app = express();

// ✅ Enable CORS
app.use(
  cors({
    origin: "https://kerala-farmers.vercel.app" || "http://localhost:3000", // Replace with your frontend URL
    credentials: true, // Allow cookies or authorization headers
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
