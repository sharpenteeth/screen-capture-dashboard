import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#9a3412" },
    secondary: { main: "#1f4b3a" },
    background: { default: "#f3efe6", paper: "#fffdf8" },
    text: { primary: "#1c1915", secondary: "#5c564c" },
    success: { main: "#3f6b4a" },
    divider: "#e4dccf",
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
    h4: { fontWeight: 600, letterSpacing: "-0.03em" },
    h5: { fontWeight: 600, letterSpacing: "-0.02em" },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, transition: "transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease" },
        contained: { "&:hover": { transform: "translateY(-1px)" } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(255, 253, 248, 0.9)",
          border: "1px solid rgba(228, 220, 207, 0.95)",
          backdropFilter: "blur(10px)",
          transition: "transform 240ms ease, box-shadow 240ms ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 16px 34px rgba(28, 25, 21, 0.08)",
          },
          "&.live-still:hover": { transform: "none", boxShadow: "none" },
        },
      },
    },
  },
});

export default theme;
