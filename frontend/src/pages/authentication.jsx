import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Container, Box, Paper, Typography, TextField, Button,
  IconButton, InputAdornment, CircularProgress, Snackbar, Alert,
  LinearProgress, Tabs, Tab, Stepper, Step, StepLabel, Fade,
  CssBaseline
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ThemeProvider, createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#06061a',
      paper: '#0d0d2b',
    },
    primary: {
      main: '#7c5cfc',
    },
    secondary: {
      main: '#00d4ff',
    },
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
    },
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#22c55e',
    }
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(124, 92, 252, 0.2)',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 12,
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7c5cfc',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(124, 92, 252, 0.05)',
            }
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
        },
        contained: {
          background: 'linear-gradient(135deg, #7c5cfc 0%, #00d4ff 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #6b4de3 0%, #00b9e6 100%)',
            boxShadow: '0 4px 20px rgba(124, 92, 252, 0.4)',
          }
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
          fontSize: '1rem',
          minHeight: 48,
        }
      }
    }
  }
});

/* ─── Password strength calculator ───────────────────── */
const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "inherit" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (pwd.length >= 12) score++;

  const map = [
    { label: "Very Weak", color: "error" },
    { label: "Weak", color: "error" },
    { label: "Fair", color: "warning" },
    { label: "Good", color: "success" },
    { label: "Strong", color: "success" },
    { label: "Very Strong", color: "success" },
  ];
  return { score, label: map[score].label, color: map[score].color, value: Math.max(10, score * 20) };
};

/* ─── OTP Countdown hook ──────────────────────────────── */
const OTP_TTL = 5 * 60; // 5 minutes in seconds

const useCountdown = (active) => {
  const [seconds, setSeconds] = useState(OTP_TTL);
  const intervalRef = useRef(null);

  const reset = useCallback(() => setSeconds(OTP_TTL), []);

  useEffect(() => {
    if (!active) return;
    setSeconds(OTP_TTL);
    intervalRef.current = setInterval(
      () => setSeconds((s) => (s > 0 ? s - 1 : 0)),
      1000
    );
    return () => clearInterval(intervalRef.current);
  }, [active]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return { display: `${mm}:${ss}`, expired: seconds === 0, reset };
};


export default function Authentication() {
  const [mode, setMode] = useState(0); // 0 = login, 1 = signup
  const [step, setStep] = useState(0); // 0 = email, 1 = otp, 2 = details

  /* shared */
  const [email, setEmail] = useState("");

  /* login */
  const [loginPwd, setLoginPwd] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  /* otp */
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = Array.from({ length: 6 }, () => useRef(null));

  /* registration */
  const [regName, setRegName] = useState("");
  const [regPwd, setRegPwd] = useState("");
  const [regPwdConfirm, setRegPwdConfirm] = useState("");
  const [showRegPwd, setShowRegPwd] = useState(false);

  /* ui state */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", severity: "success" });

  const { sendOTP, verifyOTP, handleRegister, handleLogin } = useAuth();

  const strength = getPasswordStrength(regPwd);
  const otpActive = mode === 1 && step === 1;
  const countdown = useCountdown(otpActive);

  const showToast = (message, severity = "success") => {
    setToast({ show: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const clearError = () => setError("");

  const handleTabChange = (event, newValue) => {
    setMode(newValue);
    setStep(0);
    setError("");
    setEmail("");
    setLoginPwd("");
    setOtpDigits(["", "", "", "", "", ""]);
    setRegName("");
    setRegPwd("");
    setRegPwdConfirm("");
  };

  /* ───── OTP ────────────────────────── */
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    clearError();
    if (digit && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs[index - 1].current?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(""));
      otpRefs[5].current?.focus();
    }
  };

  /* ───── Actions ───────────────────────────────────── */
  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !loginPwd) { setError("Email and password are required"); return; }
    setLoading(true); clearError();
    try {
      await handleLogin(email.trim(), loginPwd);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e?.preventDefault();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true); clearError();
    try {
      await sendOTP(email.trim());
      showToast("OTP sent! Check your inbox.");
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!countdown.expired) return;
    setLoading(true); clearError(); setOtpDigits(["", "", "", "", "", ""]);
    try {
      await sendOTP(email.trim());
      countdown.reset();
      showToast("New OTP sent!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true); clearError();
    try {
      await verifyOTP(email.trim(), otp);
      showToast("Email verified! Complete your profile.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    if (!regName.trim()) { setError("Full name is required"); return; }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,}$/.test(regPwd)) {
      setError("Password must be at least 8 characters long and include uppercase, lowercase, and a number");
      return;
    }
    if (regPwd !== regPwdConfirm) { setError("Passwords do not match"); return; }
    setLoading(true); clearError();
    try {
      await handleRegister(email.trim(), regName.trim(), regPwd);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
        px: 2
      }}>
        {/* Decorative Blobs */}
        <Box sx={{
          position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500,
          borderRadius: '50%', background: 'radial-gradient(circle, #7c5cfc, transparent 70%)',
          filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none'
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400,
          borderRadius: '50%', background: 'radial-gradient(circle, #00d4ff, transparent 70%)',
          filter: 'blur(80px)', opacity: 0.1, pointerEvents: 'none'
        }} />

        <Snackbar
          open={toast.show}
          autoHideDuration={4000}
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        </Snackbar>

        <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56, borderRadius: 3, mb: 2,
              background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
              boxShadow: '0 8px 24px rgba(124, 92, 252, 0.4)'
            }}>
              <svg style={{ width: 28, height: 28, color: '#fff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </Box>
            <Typography variant="h4" component="h1" fontWeight="800" sx={{
              background: 'linear-gradient(135deg, #a78bfa, #00d4ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              NexaMeet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {mode === 0 ? "Sign in to your account" :
                step === 0 ? "Create your account to get started" :
                  step === 1 ? "Verify your email address" : "Complete your profile details"}
            </Typography>
          </Box>

          <Fade in={true} timeout={600}>
            <Paper elevation={24} sx={{ p: { xs: 3, sm: 4 }, backdropFilter: 'blur(20px)', backgroundColor: 'rgba(13, 13, 43, 0.8)' }}>

              <Tabs
                value={mode}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Sign In" />
                <Tab label="Register" />
              </Tabs>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {/* ── LOGIN ── */}
              {mode === 0 && (
                <Box component="form" onSubmit={handleLoginSubmit} noValidate>
                  <TextField
                    fullWidth
                    label="Email Address"
                    variant="outlined"
                    margin="normal"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    autoComplete="email"
                    autoFocus
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    variant="outlined"
                    margin="normal"
                    type={showLoginPwd ? 'text' : 'password'}
                    value={loginPwd}
                    onChange={(e) => { setLoginPwd(e.target.value); clearError(); }}
                    autoComplete="current-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowLoginPwd(!showLoginPwd)} edge="end" sx={{ color: 'text.secondary' }}>
                            {showLoginPwd ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ mt: 3, mb: 1 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
                  </Button>
                </Box>
              )}

              {/* ── SIGNUP ── */}
              {mode === 1 && (
                <Box>
                  <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
                    {['Email', 'Verify', 'Profile'].map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  {/* Step 0: Email */}
                  {step === 0 && (
                    <Box component="form" onSubmit={handleSendOTP} noValidate>
                      <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        margin="normal"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearError(); }}
                        autoComplete="email"
                        autoFocus
                        helperText="We'll send a verification code to this email."
                      />
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading || !email}
                        sx={{ mt: 3 }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Send Verification Code"}
                      </Button>
                    </Box>
                  )}

                  {/* Step 1: OTP */}
                  {step === 1 && (
                    <Box component="form" onSubmit={handleVerifyOTP} noValidate>
                      <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
                        Sent to <Box component="span" fontWeight="bold" color="secondary.main">{email}</Box>
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', my: 3 }} onPaste={handleOtpPaste}>
                        {otpDigits.map((digit, i) => (
                          <TextField
                            key={i}
                            inputRef={otpRefs[i]}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            inputProps={{
                              maxLength: 1,
                              style: { textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', padding: '14px 0' }
                            }}
                            sx={{ width: 50 }}
                          />
                        ))}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
                        <Typography variant="caption" color={countdown.expired ? 'error' : 'text.secondary'} fontFamily="monospace">
                          {countdown.expired ? "Code expired" : `Expires in ${countdown.display}`}
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          onClick={handleResendOTP}
                          disabled={!countdown.expired || loading}
                          sx={{ textTransform: 'none' }}
                        >
                          Resend Code
                        </Button>
                      </Box>

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading || otpDigits.join("").length !== 6}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Verify Code"}
                      </Button>

                      <Button fullWidth variant="text" size="small" onClick={() => setStep(0)} sx={{ mt: 2, color: 'text.secondary' }}>
                        Change email address
                      </Button>
                    </Box>
                  )}

                  {/* Step 2: Details */}
                  {step === 2 && (
                    <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
                      <TextField
                        fullWidth
                        label="Full Name"
                        variant="outlined"
                        margin="normal"
                        value={regName}
                        onChange={(e) => { setRegName(e.target.value); clearError(); }}
                        autoComplete="name"
                        autoFocus
                      />

                      <TextField
                        fullWidth
                        label="Password"
                        variant="outlined"
                        margin="normal"
                        type={showRegPwd ? 'text' : 'password'}
                        value={regPwd}
                        onChange={(e) => { setRegPwd(e.target.value); clearError(); }}
                        autoComplete="new-password"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowRegPwd(!showRegPwd)} edge="end" sx={{ color: 'text.secondary' }}>
                                {showRegPwd ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />

                      {regPwd && (
                        <Box sx={{ mt: 1, mb: 2, px: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={strength.value}
                            color={strength.color}
                            sx={{ height: 6, borderRadius: 3, mb: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                          />
                          <Typography variant="caption" color={`${strength.color}.main`}>
                            {strength.label}
                          </Typography>
                        </Box>
                      )}

                      <TextField
                        fullWidth
                        label="Confirm Password"
                        variant="outlined"
                        margin="normal"
                        type="password"
                        value={regPwdConfirm}
                        error={Boolean(regPwdConfirm && regPwd !== regPwdConfirm)}
                        helperText={regPwdConfirm && regPwd !== regPwdConfirm ? "Passwords do not match" : ""}
                        onChange={(e) => { setRegPwdConfirm(e.target.value); clearError(); }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3 }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Complete Registration"}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Fade>

          <Typography variant="caption" display="block" align="center" color="text.secondary" sx={{ mt: 4 }}>
            Secure • Private • Built with ❤️ for NexaMeet
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
