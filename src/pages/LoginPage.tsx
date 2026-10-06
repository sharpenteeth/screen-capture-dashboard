import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import { LiveBackdrop } from "../components/LiveBackdrop";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("manager");
  const [password, setPassword] = useState("manager123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username.trim(), password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2 }}>
      <LiveBackdrop />
      <Paper className="live-rise" sx={{ position: "relative", zIndex: 1, width: "min(440px, 100%)", p: 4 }}>
        <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.14em" }}>
          Screen Capture
        </Typography>
        <Typography variant="h4" sx={{ mt: 1, mb: 1 }}>
          Sign in
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Thumbnails arrive on their own. Original screenshots stay on the employee computer until you ask for a time range.
        </Typography>
        <Stack component="form" spacing={2} onSubmit={submit}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Username" value={username} onChange={(event) => setUsername(event.target.value)} autoFocus />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" variant="contained" size="large" disabled={busy}>
            {busy ? "Signing in" : "Enter the desk"}
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 3 }}>
          Demo accounts: manager / manager123, admin / admin123, john / employee123
        </Typography>
      </Paper>
    </Box>
  );
}
