import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Alert, Box, Button, Card, Chip, IconButton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, fetchBlob } from "../api";
import { AuthImage } from "../components/AuthImage";
import { formatWhen, statusLabel } from "../format";
import type { ImageRequest } from "../types";

const DONE = new Set(["ready", "failed", "unavailable"]);

export function RequestPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<ImageRequest | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const load = async () => {
      try {
        const next = await api<ImageRequest>(`/api/requests/${requestId}`);
        if (cancelled) return;
        setRow(next);
        if (!DONE.has(next.status)) timer = window.setTimeout(() => void load(), 2000);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the request");
      }
    };
    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [requestId]);

  async function download() {
    if (!row) return;
    const blob = await fetchBlob(`/api/requests/${row.id}/package`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `screenshots-${row.id}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <IconButton onClick={() => navigate(-1)} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">{row?.userName || "Full screenshots"}</Typography>
          <Typography color="text.secondary">
            {row ? `${formatWhen(row.startTime)} – ${formatWhen(row.endTime)}` : "Loading"}
          </Typography>
        </Box>
        {row && <Chip label={statusLabel(row.status)} color={row.status === "ready" ? "success" : "default"} />}
        {row?.status === "ready" && (
          <Button variant="contained" onClick={() => void download()}>
            Download package
          </Button>
        )}
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {row?.error && <Alert severity="warning">{row.error}</Alert>}
      {row && !DONE.has(row.status) && (
        <Alert severity="info">The employee computer is decrypting this range and sending it up.</Alert>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 2 }}>
        {(row?.images ?? []).map((image) => (
          <Card key={image.id} sx={{ p: 1.5 }}>
            <AuthImage path={image.url} alt={`Original at ${formatWhen(image.captureTime)}`} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {formatWhen(image.captureTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {image.width}×{image.height}
            </Typography>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
