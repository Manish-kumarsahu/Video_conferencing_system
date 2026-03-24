import mongoose, { Schema } from "mongoose";

const transcriptSchema = new Schema({
    meetingCode: { type: String, required: true, index: true },
    socketId: { type: String, required: true },
    speakerName: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const Transcript = mongoose.model("Transcript", transcriptSchema);

export { Transcript };
