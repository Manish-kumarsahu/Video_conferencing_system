import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,   // one pending OTP per email at a time
    },
    otp: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        required: true,
        // TTL index — MongoDB auto-deletes the document after this timestamp
        index: { expireAfterSeconds: 0 },
    },
});

const OtpModel = mongoose.model("Otp", otpSchema);

export { OtpModel };
