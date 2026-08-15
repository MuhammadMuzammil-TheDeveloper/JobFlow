import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["candidate", "recruiter", "admin"],
      default: "candidate",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationOTP: {
      type: String,
      default: null,
    },

    emailVerificationOTPExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
