import { Meeting } from "../models/meeting.model.js";
import { Transcript } from "../models/transcript.model.js";

export const MeetingService = {
    async getUserHistory(userId) {
        const meetings = await Meeting.find({ user_id: userId }).sort({ date: -1 });
        return meetings.map(m => {
            const meetingObj = m.toObject();
            meetingObj.meetingId = meetingObj.meetingCode;
            meetingObj.userId = meetingObj.user_id ? meetingObj.user_id.toString() : null;
            return meetingObj;
        });
    },

    async addMeetingToHistory(userId, meetingData) {
        let { meeting_code, meetingCode, meetingId, participants, summary, transcript } = meetingData;

        if (!meeting_code && meetingCode) meeting_code = meetingCode;
        if (!meeting_code && meetingId)   meeting_code = meetingId;

        if (!meeting_code) {
            throw new Error("MISSING_CODE");
        }

        const code = meeting_code.trim();

        if (!transcript || !transcript.trim()) {
            const transcriptDocs = await Transcript.find({ meetingCode: code }).sort({ timestamp: 1 });
            if (transcriptDocs.length > 0) {
                transcript = transcriptDocs
                    .map(t => `${t.speakerName || "Unknown"}: ${t.text}`)
                    .join("\n");
            }
        }

        if (!summary || !summary.trim()) {
            const existing = await Meeting.findOne({ meetingCode: code, summary: { $ne: "" } }).sort({ date: -1 });
            if (existing) {
                summary = existing.summary;
            }
        }

        const newMeeting = new Meeting({
            user_id:      userId,
            meetingCode:  code,
            participants: participants || [],
            transcript:   transcript || "",
            summary:      summary || "",
        });

        await newMeeting.save();
        return newMeeting;
    },

    async getMeetingByCode(userId, meetingCode) {
        const code = meetingCode.trim();

        let meeting = await Meeting.findOne({
            user_id:     userId,
            meetingCode: code,
        }).sort({ date: -1 });

        if (!meeting || !meeting.summary) {
            const richer = await Meeting.findOne({
                meetingCode: code,
                summary:     { $ne: "" },
            }).sort({ date: -1 });
            
            if (richer) {
                if (meeting) {
                    meeting.summary = richer.summary;
                    if (!meeting.transcript) meeting.transcript = richer.transcript;
                } else {
                    meeting = richer;
                }
            }
        }

        if (!meeting) {
            throw new Error("NOT_FOUND");
        }

        const meetingObj = meeting.toObject();
        meetingObj.meetingId = meetingObj.meetingCode;
        return meetingObj;
    },

    async deleteSingleMeeting(userId, meetingId) {
        const result = await Meeting.findOneAndDelete({ _id: meetingId, user_id: userId });
        if (!result) {
            throw new Error("NOT_FOUND");
        }
        return result;
    },

    async deleteMultipleMeetings(userId, ids) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error("BAD_REQUEST");
        }
        const result = await Meeting.deleteMany({ _id: { $in: ids }, user_id: userId });
        return result.deletedCount;
    }
};
