import express from "express";
const PORT = process.env.PORT || 5000;
import nodemailer from "nodemailer";
import cors from "cors";
import jwt from "jsonwebtoken";
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
app.use(cors());

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

app.post("/api/verify-email", async (request, response) => {
  const { email, otp } = request.body;

  if (!email || !otp) {
    return response.status(400).json({
      message: "Email and OTP are required",
      status: false,
    });
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    return response.status(404).json({
      message: "User not found",
      status: false,
    });
  }
  if (user.isEmailVerified) {
    return response.status(400).json({
      message: "Email is already verified",
      status: false,
    });
  }
  if (!user.emailVerificationOTP) {
    return response.status(400).json({
      message: "No OTP found. Please request a new OTP.",
      status: false,
    });
  }
  if (
    !user.emailVerificationOTPExpires ||
    user.emailVerificationOTPExpires < new Date()
  ) {
    return response.status(400).json({
      message: "OTP has expired. Please request a new OTP.",
      status: false,
    });
  }

  if (user.emailVerificationOTP !== otp) {
    return response.status(400).json({
      message: "Invalid OTP",
      status: false,
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationOTP = null;
  user.emailVerificationOTPExpires = null;

  await user.save();
  return response.status(200).json({
    message: "Email verified successfully",
    status: true,
  });
});

app.post("/api/resend-otp", async (request, response) => {
  try {
    const { email } = request.body;

    // 1. Validate email
    if (!email) {
      return response.status(400).json({
        message: "Email is required",
        status: false,
      });
    }

    // 2. Find user
    const user = await UserModel.findOne({ email });

    if (!user) {
      return response.status(404).json({
        message: "User not found",
        status: false,
      });
    }

    // 3. Check if already verified
    if (user.isEmailVerified) {
      return response.status(400).json({
        message: "Email is already verified",
        status: false,
      });
    }

    // 4. Generate new OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. Set new expiry (10 minutes)
    const newOTPExpires = new Date(Date.now() + 10 * 60 * 1000);

    // 6. Update user
    user.emailVerificationOTP = newOTP;
    user.emailVerificationOTPExpires = newOTPExpires;

    await user.save();

    // 7. Create transporter
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 8. Email
    const mailOptions = {
      from: `"CareerFlow" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your new CareerFlow verification code",
      html: emailVerificationTemplate(user, newOTP),
    };

    // 9. Send email
    await transporter.sendMail(mailOptions);

    // 10. Response
    return response.status(200).json({
      message: "New OTP has been sent to your email",
      status: true,
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);

    return response.status(500).json({
      message: error.message || "Something went wrong",
      status: false,
    });
  }
});

app.post("/api/login", async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({
        message: "Email and password are required",
        status: false,
      });
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return response.status(401).json({
        message: "Invalid email or password",
        status: false,
      });
    }

    if (!user.isEmailVerified) {
      return response.status(403).json({
        message: "plase verify your email before logging in",
        status: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return response.status(401).json({
        message: "Invalid email or password",
        status: false,
      });
    }
    const token = jwt.sign(
      {
        userID: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
    );
    return response.status(200).json({
      message: "Login successful",
      status: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return response.status(500).json({
      message: error.message || "Something went wrong",
      status: false,
    });
  }
});

app.listen(PORT, () => console.log(`Server is Running on :${PORT}`));
