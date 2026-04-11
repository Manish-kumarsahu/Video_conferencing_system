import * as React from "react";
import { useLocation } from "react-router-dom";
import {
  Avatar, Button, TextField, Box, Typography,
  Tabs, Tab, Snackbar, Alert, InputAdornment, IconButton as MuiIconButton,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { AuthContext } from "../contexts/AuthContext";

export default function Authentication() {
  const location = useLocation();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(location.state?.mode === "register" ? 1 : 0);
  const [open, setOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      } else {
        const result = await handleRegister(name, username, password);
        setUsername("");
        setPassword("");
        setName("");
        setMessage(result);
        setOpen(true);
        setFormState(0);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAuth();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `
          radial-gradient(ellipse 70% 60% at 20% 20%, rgba(124,92,252,0.2) 0%, transparent 65%),
          radial-gradient(ellipse 55% 45% at 80% 80%, rgba(0,212,255,0.12) 0%, transparent 65%),
          #06061a
        `,
        px: 2,
      }}
    >
      {/* Card */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          background: "rgba(13, 13, 43, 0.75)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(124, 92, 252, 0.2)",
          borderRadius: 4,
          p: { xs: 3, sm: 5 },
          boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,92,252,0.1)",
          animation: "fadeUp 0.5s ease both",
          "@keyframes fadeUp": {
            from: { opacity: 0, transform: "translateY(24px)" },
            to:   { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              mb: 1.5,
              background: "linear-gradient(135deg, #7c5cfc, #00d4ff)",
              boxShadow: "0 4px 20px rgba(124,92,252,0.5)",
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: "1.5rem" }} />
          </Avatar>
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
            NexaMeet
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {formState === 0 ? "Sign in to your account" : "Create your account"}
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={formState}
          onChange={(_, v) => { setFormState(v); setError(""); }}
          variant="fullWidth"
          sx={{
            mb: 3,
            "& .MuiTabs-indicator": {
              background: "linear-gradient(90deg, #7c5cfc, #00d4ff)",
              height: 3,
              borderRadius: 2,
            },
            "& .MuiTab-root": {
              fontWeight: 600,
              color: "text.secondary",
              "&.Mui-selected": { color: "primary.light" },
            },
          }}
        >
          <Tab label="Sign In" id="tab-signin" />
          <Tab label="Sign Up" id="tab-signup" />
        </Tabs>

        {/* Fields */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {formState === 1 && (
            <TextField
              fullWidth
              label="Full Name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon sx={{ color: "text.secondary", fontSize: "1.2rem" }} />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <TextField
            fullWidth
            label="Username"
            value={username}
            autoFocus={formState === 0}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ color: "text.secondary", fontSize: "1.2rem" }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <MuiIconButton
                    size="small"
                    onClick={() => setShowPassword((p) => !p)}
                    edge="end"
                    sx={{ color: "text.secondary" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </MuiIconButton>
                </InputAdornment>
              ),
            }}
          />

          {error && (
            <Box
              sx={{
                px: 2,
                py: 1.2,
                borderRadius: 2,
                background: "rgba(255,107,107,0.1)",
                border: "1px solid rgba(255,107,107,0.3)",
              }}
            >
              <Typography sx={{ color: "#ff6b6b", fontSize: "0.85rem" }}>
                {error}
              </Typography>
            </Box>
          )}

          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            onClick={handleAuth}
            disabled={loading}
            sx={{
              mt: 1,
              height: 52,
              fontSize: "1rem",
              letterSpacing: "0.02em",
            }}
          >
            {loading ? "Please wait…" : formState === 0 ? "Sign In" : "Create Account"}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity="success"
          sx={{
            background: "rgba(13,13,43,0.95)",
            border: "1px solid rgba(74,222,128,0.3)",
            color: "#4ade80",
          }}
        >
          {message} — You can now sign in!
        </Alert>
      </Snackbar>
    </Box>
  );
}
