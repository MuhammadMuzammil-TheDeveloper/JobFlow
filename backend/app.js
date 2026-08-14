import express from "express";
const PORT = process.env.PORT || 5000;
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { emailVerificationTemplate} from "./template.js"
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
    const body = request.body;
    const { email, fullName, password, confirmPassword, role } = body;

    if (!email || !password || !fullName || !confirmPassword || !role) {
      return response.json({
        message: "required values are missing",
        status: false,
      });
    }

    // check user email
    const user = await UserModel.findOne({ email });
    if (user) {
      return response.json({
        message: "email address already exist",
        status: false,
      });
    }

    if (password !== confirmPassword) {
      return response.json({
        message: "PAssword && confirm Password are not Match",
        status: false,
      });
    }
    const hashPassword = await bcrypt.hash(password, 10);

    const userObj = {
      email,
      fullName,
      role,
      password: hashPassword,
    };

    await UserModel.create(userObj);
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "muzans786@gmail.com",
        pass: "qebx suqz lxll obqm",
      },
    });
    let mailOptions = {
      from: "muzans786@gmail.com",
      to: "muzammil.muhammad7782@gmail.com",
      subject: "Sending Email using Node.js",
      html: emailVerificationTemplate(userobj),
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    response.json({
      message: "user signUp successfully",
      status: true,
    });
  } catch (error) {
    response.json({
      message: error.message || "something went wrong",
      status: false,
    });
  }
});

app.listen(PORT, () => console.log(`Server is Running on :${PORT}`));
