import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        name: { type: String, default: "" },
        password: { type: String, default: "" },
        isVerified: { type: Boolean, default: false },
        otp: { type: String, default: null },
        otpExpiry: { type: Date, default: null },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export { User };