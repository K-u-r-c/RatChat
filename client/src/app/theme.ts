import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#5865f2",
    },
    background: {
      default: "#27262C",
      paper: "rgba(19,19,22,0.85)",
    },
    divider: "rgba(255,255,255,0.12)",
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(19,19,22,0.65)",
          border: "1px solid rgba(255,255,255,0.08)",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(19,19,22,0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(19,19,22,0.95)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#1f2125",
          borderRadius: 8,
        },
        notchedOutline: {
          borderColor: "transparent",
        },
        input: {
          color: "#fff",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(19,19,22,1)",
        },
      },
    },
  },
});

export default theme;
