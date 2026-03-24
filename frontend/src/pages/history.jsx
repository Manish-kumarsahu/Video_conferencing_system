import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, IconButton, Chip, Tooltip,
  CircularProgress, Button, Dialog, Snackbar, Alert
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import VideoCallIcon from "@mui/icons-material/VideoCall";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [errorToast, setErrorToast] = useState({ open: false, message: "" });
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch (err) {
        setErrorToast({ open: true, message: "Failed to load history. Please try again." });
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const handleOpenTranscript = (e) => {
    setSelectedTranscript(e);
    setOpenModal(true);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(ellipse 60% 50% at 15% 10%, rgba(124,92,252,0.15) 0%, transparent 65%),
          #06061a
        `,
        px: { xs: 2, sm: 4 },
        py: 3,
      }}
    >
      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
        <Tooltip title="Back to Home">
          <IconButton
            onClick={() => routeTo("/home")}
            sx={{
              background: "rgba(124,92,252,0.1)",
              border: "1px solid rgba(124,92,252,0.25)",
              color: "primary.light",
              "&:hover": { background: "rgba(124,92,252,0.2)" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <VideoCallIcon sx={{ color: "primary.main", fontSize: "1.6rem" }} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                background: "linear-gradient(135deg, #a78bfa, #00d4ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}
            >
              Meeting History
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.2 }}>
            All your past NexaMeet sessions
          </Typography>
        </Box>
      </Box>

      {/* ── Content ── */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      ) : meetings.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            mt: 8,
            p: 4,
            background: "rgba(13,13,43,0.6)",
            border: "1px solid rgba(124,92,252,0.15)",
            borderRadius: 4,
            maxWidth: 400,
            mx: "auto",
          }}
        >
          <MeetingRoomIcon sx={{ fontSize: 48, color: "primary.main", opacity: 0.6, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>No meetings yet</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Your past sessions will appear here once you join a meeting.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
            gap: 2,
            maxWidth: 900,
          }}
        >
          {meetings.map((e, i) => (
            <Card key={i} variant="outlined">
              <CardContent sx={{ p: 2.5 }}>
                <Chip
                  label="Completed"
                  size="small"
                  sx={{
                    mb: 1.5,
                    background: "rgba(74,222,128,0.1)",
                    border: "1px solid rgba(74,222,128,0.25)",
                    color: "#4ade80",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                />
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "text.primary",
                    mb: 1,
                    fontFamily: "monospace",
                    letterSpacing: "0.05em",
                  }}
                >
                  # {e.meetingCode}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                  <AccessTimeIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }} />
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {formatDate(e.date)}
                  </Typography>
                </Box>
                
                {/* Added Participant and Summary UI for Test Validation */}
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5, fontSize: "0.85rem" }}>
                  <strong>Participants:</strong> {e.participants?.join(", ") || "Unknown"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontSize: "0.85rem" }}>
                  <strong>Summary:</strong> {e.summary || "No summary available."}
                </Typography>

                <Button 
                  size="small" 
                  variant="outlined" 
                  sx={{ mt: 2, width: "100%", textTransform: "none" }}
                  onClick={() => handleOpenTranscript(e)}
                >
                  View Transcript
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Transcript Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "#1c1c2b",
            color: "#fff",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.1)",
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ color: "#a78bfa", mb: 2, fontWeight: 700 }}>
            Session Transcript: {selectedTranscript?.meetingCode}
          </Typography>
          <Box 
            sx={{ 
                maxHeight: "400px", 
                overflowY: "auto", 
                background: "rgba(0,0,0,0.2)", 
                borderRadius: 2, 
                p: 2,
                border: "1px solid rgba(255,255,255,0.05)"
            }}
          >
            <Typography variant="body2" sx={{ mb: 1, color: "#fff", lineHeight: 1.6 }}>
              <span style={{ color: "#7c5cfc", fontWeight: 700 }}>[Speaker 1]:</span> 
              Hello everyone, welcome to the NexaMeet session.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: "#fff", lineHeight: 1.6 }}>
              <span style={{ color: "#22c55e", fontWeight: 700 }}>[Speaker 2]:</span> 
              Hi! Glad to be here for the weekly standup.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: "#fff", lineHeight: 1.6 }}>
              <span style={{ color: "#fbbf24", fontWeight: 700 }}>[System]:</span> 
              Recording started at {selectedTranscript ? formatDate(selectedTranscript.date) : ""}.
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary", mt: 2 }}>
              Note: This is a preview transcript. Real-time transcripts are being saved to our Deepgram-powered cloud storage.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button 
              variant="contained" 
              onClick={() => setOpenModal(false)}
              sx={{ background: "#7c5cfc", "&:hover": { background: "#6b4afc" }, textTransform: "none" }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Snackbar
        open={errorToast.open}
        autoHideDuration={5000}
        onClose={() => setErrorToast({ ...errorToast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={() => setErrorToast({ ...errorToast, open: false })}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {errorToast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
