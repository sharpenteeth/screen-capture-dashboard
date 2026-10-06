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
    MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { backgroundImage: "none", border: "1px solid #e4dccf" } } },
  },
});

export default theme;
