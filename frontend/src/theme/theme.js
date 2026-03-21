import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7c5cfc',
      light: '#a78bfa',
      dark: '#5b3fd4',
    },
    secondary: {
      main: '#00d4ff',
      light: '#67e8f9',
      dark: '#0891b2',
    },
    background: {
      default: '#06061a',
      paper: '#0d0d2b',
    },
    text: {
      primary: '#f0f0ff',
      secondary: '#9ca3af',
    },
    error: {
      main: '#ff6b6b',
    },
    success: {
      main: '#4ade80',
    },
    divider: 'rgba(124, 92, 252, 0.2)',
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9rem',
          transition: 'all 0.2s ease',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #7c5cfc 0%, #5b3fd4 100%)',
          boxShadow: '0 4px 20px rgba(124, 92, 252, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #8b6dfd 0%, #6a50e4 100%)',
            boxShadow: '0 6px 28px rgba(124, 92, 252, 0.55)',
            transform: 'translateY(-1px)',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(124, 92, 252, 0.5)',
          '&:hover': {
            borderColor: '#7c5cfc',
            background: 'rgba(124, 92, 252, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            '& fieldset': {
              borderColor: 'rgba(124, 92, 252, 0.25)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(124, 92, 252, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7c5cfc',
              boxShadow: '0 0 0 3px rgba(124, 92, 252, 0.15)',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(13, 13, 43, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(124, 92, 252, 0.18)',
          borderRadius: 16,
          transition: 'all 0.25s ease',
          '&:hover': {
            border: '1px solid rgba(124, 92, 252, 0.4)',
            boxShadow: '0 8px 32px rgba(124, 92, 252, 0.2)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s ease',
          '&:hover': {
            background: 'rgba(124, 92, 252, 0.12)',
          },
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            background: 'linear-gradient(135deg, #0d0d2b, #1a1a4a)',
            border: '1px solid rgba(124, 92, 252, 0.3)',
            borderRadius: 10,
          },
        },
      },
    },
  },
});

export default theme;
