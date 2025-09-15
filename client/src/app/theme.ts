import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#5865f2ff",
    },
    background: {
      default: "#24262bff",
      paper: "#1e1f24",
    },
    divider: "rgba(255,255,255,0.12)",
  },
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
          backgroundColor: "rgba(19,19,22)",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(19,19,22,0.95)",
          border: "1px solid #ffffff14",
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
