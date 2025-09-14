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
});

export default theme;
