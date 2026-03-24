import mongoose, { Schema } from "mongoose";


const meetingSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        meetingCode: { type: String, required: true },
        participants: { type: [String], default: [] },
        summary: { type: String, default: "" },
        date: { type: Date, default: Date.now, required: true }
    }
)

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };