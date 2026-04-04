import { useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, IconButton, TextField, Tooltip, Chip } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import LogoutIcon from "@mui/icons-material/Logout";
import VideoCallIcon from "@mui/icons-material/VideoCall";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  // addToUserHistory removed — history is saved in VideoMeet on meeting end

  const handleJoinVideoCall = () => {
    if (!meetingCode.trim()) return;
    navigate(`/${meetingCode}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleJoinVideoCall();
  };

  return (
    <>
      {/* ── Navbar ── */}
      <div className="navBar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <VideoCallIcon sx={{ color: "primary.main", fontSize: "1.8rem" }} />
          <h2>NexaMeet</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Tooltip title="Meeting History">
            <IconButton
              onClick={() => navigate("/history")}
              sx={{ color: "text.secondary" }}
            >
              <RestoreIcon />
            </IconButton>
          </Tooltip>
          <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>History</span>

          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
            sx={{
              ml: 1,
              borderRadius: "10px",
              borderColor: "rgba(255,107,107,0.35)",
              color: "#ff6b6b",
              "&:hover": {
                background: "rgba(255,107,107,0.1)",
                borderColor: "#ff6b6b",
              },
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="meetContainer">
        <div className="leftPanel">
          <div>
            <Chip
              label="✦ Ready to connect"
              size="small"
              sx={{
                mb: 2,
                background: "rgba(124, 92, 252, 0.15)",
                border: "1px solid rgba(124, 92, 252, 0.3)",
                color: "#a78bfa",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
            <h2>
              Quality video calls, <br />
              <span style={{
                background: "linear-gradient(135deg, #a78bfa, #00d4ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                anywhere you are.
              </span>
            </h2>

            <div className="joinGroup" style={{ marginTop: "2rem" }}>
              <TextField
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                onKeyDown={handleKeyDown}
                id="meeting-code-input"
                label="Enter Meeting Code"
                variant="outlined"
                size="medium"
                sx={{ minWidth: 220 }}
              />
              <Button
                onClick={handleJoinVideoCall}
                variant="contained"
                color="primary"
                disabled={!meetingCode.trim()}
                sx={{ height: 56 }}
              >
                Join Now
              </Button>
            </div>
          </div>
        </div>

        <div className="rightPanel">
          <img src="/logo3.png" alt="NexaMeet illustration" />
        </div>
      </div>
    </>
  );
}

export default withAuth(HomeComponent);
