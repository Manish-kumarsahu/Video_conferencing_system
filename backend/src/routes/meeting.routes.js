import { Router } from "express";
import { summarizeMeeting } from "../controllers/meeting.controller.js";

const router = Router();

// POST /api/summarize-meeting
// Body: { meetingCode }
// Fetches transcript from DB → generates AI summary via Gemini → saves to meetings collection
router.post("/summarize-meeting", summarizeMeeting);

export default router;
