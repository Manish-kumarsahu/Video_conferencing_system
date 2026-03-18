import mongoose, { Schema } from "mongoose";


const meetingSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        meetingCode: { type: String, required: true },
        date: { type: Date, default: Date.now, required: true }
    }
)

// Compound index to speed up history queries (sorted by newest first per user)
meetingSchema.index({ user_id: 1, date: -1 });

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };