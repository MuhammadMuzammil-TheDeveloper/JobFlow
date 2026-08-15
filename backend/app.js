import express from "express";
const PORT = process.env.PORT || 5000;
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { emailVerificationTemplate } from "./template.js";
import mongoose from "mongoose";
import UserModel from "./model/userSchema.js";
import bcrypt from "bcryptjs";
import { setServers } from "node:dns/promises";
setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const URI = process.env.MONGODB_URI;
mongoose
  .connect(URI)
  .then(() => console.log(`mongoDB Connected!`))
  .catch((err) => console.log(`MongoDb error: ${err.message}`));

app.post("/api/signup", async (request, response) => {
  try {
    const { email, fullName, password, confirmPassword, role } = request.body;

    // 1. Validate required fields
    if (!email || !password || !fullName || !confirmPassword || !role) {
      return response.status(400).json({
        message: "Required values are missing",
        status: false,
      });
    }

    // 2. Check password confirmation
    if (password !== confirmPassword) {
      return response.status(400).json({
        message: "Password and confirm password do not match",
        status: false,
      });
    }

    // 3. Check if email already exists
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return response.status(409).json({
        message: "Email address already exists",
        status: false,
      });
    }

    // 4. Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // 5. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 6. OTP expires after 10 minutes
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // 7. Create user object
    const userObj = {
      email,
      fullName,
      role,
      password: hashPassword,

      // Email verification
      isEmailVerified: false,
      emailVerificationOTP: otp,
      emailVerificationOTPExpires: otpExpires,
    };

    // 8. Save user in MongoDB
    const newUser = await UserModel.create(userObj);

    // 9. Create email transporter
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 10. Email options
    const mailOptions = {
      from: `"CareerFlow" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify your CareerFlow account",
      html: emailVerificationTemplate(newUser, otp),
    };

    // 11. Send email
    await transporter.sendMail(mailOptions);

    // 12. Response
    return response.status(201).json({
      message: "Account created successfully. OTP sent to your email.",
      status: true,
    });
  } catch (error) {
    console.error("Signup Error:", error);

    return response.status(500).json({
      message: error.message || "Something went wrong",
      status: false,
    });
  }
});
app.listen(PORT, () => console.log(`Server is Running on :${PORT}`));
