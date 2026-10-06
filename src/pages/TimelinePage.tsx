import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, currentUser, readCache } from "../api";
import { AuthImage, useAuthImage } from "../components/AuthImage";
import { activityPercent, activityTotals, captureActivity, formatDuration } from "../activity";
import { dayBounds, formatClock, formatDay, formatWhen, shiftRange } from "../format";
import type { ActivityEvent, ImageRequest, Shot } from "../types";

type Preset = "point" | "10" | "30";

export function TimelinePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const viewer = currentUser();
  const [day, setDay] = useState(() => new Date());
  const [shots, setShots] = useState<Shot[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [slotMinutes, setSlotMinutes] = useState(20);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Shot | null>(null);
  const [zoomed, setZoomed] = useState<Shot | null>(null);
  const [scale, setScale] = useState(1);
  const [preset, setPreset] = useState<Preset>("10");
  const [busy, setBusy] = useState(false);
  const canRequest = viewer?.role === "admin" || viewer?.role === "manager";

  useEffect(() => {
    let cancelled = false;
    const bounds = dayBounds(day);
    const path = `/api/users/${userId}/screenshots?from=${encodeURIComponent(bounds.from)}&to=${encodeURIComponent(bounds.to)}`;
    const activityPath = `/api/users/${userId}/activity?from=${encodeURIComponent(bounds.from)}&to=${encodeURIComponent(bounds.to)}`;
    const cached = readCache<Shot[]>(path);
    const cachedActivity = readCache<ActivityEvent[]>(activityPath);
    if (cached) setShots(cached);
    if (cachedActivity) setActivity(cachedActivity);
    Promise.all([api<Shot[]>(path), api<{ captureIntervalMinutes: number }>("/api/settings")])
      .then(async ([rows, settings]) => {
        if (cancelled) return;
        setShots(rows);
        setSlotMinutes(settings.captureIntervalMinutes);
        try {
          const events = await api<ActivityEvent[]>(activityPath);
          if (!cancelled) setActivity(events);
        } catch {
          if (!cancelled) setActivity([]);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the day");
      });
    return () => {
      cancelled = true;
    };
  }, [userId, day]);

  const name = shots[0] ? `Device ${shots[0].deviceHostname || shots[0].deviceId}` : "Timeline";
  const captureTotals = captureActivity(shots, slotMinutes);
  const percent = activityPercent(captureTotals.active, captureTotals.idle);
  const totals = activityTotals(activity, new Date());

  async function requestRange() {
    if (!selected) return;
    setBusy(true);
    setError("");
    const minutes = preset === "point" ? 0 : preset === "10" ? 10 : 30;
    const startTime = preset === "point" ? selected.captureTime : shiftRange(selected.captureTime, -minutes);
    const endTime = preset === "point" ? selected.captureTime : shiftRange(selected.captureTime, minutes);
    try {
      const created = await api<ImageRequest>("/api/screenshots/request", {
        method: "POST",
        body: JSON.stringify({
          userId: Number(userId),
          deviceId: selected.deviceId,
          startTime,
          endTime,
        }),
      });
      navigate(`/requests/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setBusy(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <IconButton onClick={() => navigate("/")} aria-label="Back to overview">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">{name}</Typography>
          <Typography color="text.secondary">Screenshots on a schedule. Activity shows the app, window, and idle time.</Typography>
        </Box>
        <IconButton onClick={() => setDay(new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1))} aria-label="Previous day">
          <ChevronLeftIcon />
        </IconButton>
        <Typography sx={{ minWidth: 180, textAlign: "center" }}>{formatDay(day)}</Typography>
        <IconButton onClick={() => setDay(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1))} aria-label="Next day">
          <ChevronRightIcon />
        </IconButton>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {shots.length === 0 && activity.length === 0 && (
        <Alert severity="info">No screenshots or activity for this day.</Alert>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" }, gap: 2, alignItems: "start" }}>
      <Card sx={{ p: 2 }}>
        <Typography variant="h6">Activity</Typography>
        {percent === null ? (
          <Typography color="text.secondary" sx={{ mt: 1, mb: 1 }}>
            No activity recorded for this day.
          </Typography>
        ) : (
          <Box sx={{ mt: 1, mb: 1.5 }}>
            <Typography variant="h4">{percent}%</Typography>
            <Typography variant="body2">Active {formatDuration(captureTotals.active)}</Typography>
            <Typography variant="body2" color="text.secondary">
              Inactive {formatDuration(captureTotals.idle)}
            </Typography>
          </Box>
        )}
        {totals.apps.length > 0 && <AppShare apps={totals.apps} />}
      </Card>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 2 }}>
        {shots.map((shot) => (
          <Card key={shot.id} sx={{ p: 1.5 }}>
            <Box
              onClick={() => {
                setScale(1);
                setZoomed(shot);
              }}
              sx={{ cursor: "zoom-in" }}
            >
              <AuthImage path={shot.thumbnailUrl} alt={`Screenshot at ${formatWhen(shot.captureTime)}`} />
            </Box>
            <Stack direction="row" sx={{ mt: 1, alignItems: "center" }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {formatClock(shot.captureTime)}
              </Typography>
              {shot.duplicate && <Chip size="small" label="Unchanged" />}
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
              {shot.inputActive === true ? "Active" : shot.inputActive === false ? "Inactive" : "Activity not recorded"}
            </Typography>
            {canRequest && (
              <Button size="small" sx={{ mt: 1 }} onClick={() => { setSelected(shot); setPreset("10"); }}>
                Request originals
              </Button>
            )}
          </Card>
        ))}
      </Box>
      </Box>
      <ZoomDialog
        shot={zoomed}
        scale={scale}
        onScale={setScale}
        onClose={() => setZoomed(null)}
      />
      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="xs">
        <DialogTitle>Request original screenshots</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            The agent decrypts this range on the employee computer and uploads it. Around {selected ? formatWhen(selected.captureTime) : ""}.
          </Typography>
          <ToggleButtonGroup exclusive value={preset} onChange={(_event, value: Preset | null) => value && setPreset(value)}>
            <ToggleButton value="point">This frame</ToggleButton>
            <ToggleButton value="10">± 10 min</ToggleButton>
            <ToggleButton value="30">± 30 min</ToggleButton>
          </ToggleButtonGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Cancel</Button>
          <Button variant="contained" disabled={busy} onClick={() => void requestRange()}>
            Upload this range
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

const TOP_APPS = 10;
const SLICE_COLORS = [
  "#9a3412",
  "#1f4b3a",
  "#c2410c",
  "#3f6b4a",
  "#b45309",
  "#57534e",
  "#0f766e",
  "#a16207",
  "#7c2d12",
  "#44403c",
  "#d6d3d1",
];

function AppShare({ apps }: { apps: { name: string; seconds: number }[] }) {
  const top = apps.slice(0, TOP_APPS);
  const otherSeconds = apps.slice(TOP_APPS).reduce((sum, app) => sum + app.seconds, 0);
  const slices = otherSeconds > 0 ? [...top, { name: "Other", seconds: otherSeconds }] : top;
  const total = slices.reduce((sum, app) => sum + app.seconds, 0);
  const size = 168;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;

  return (
    <Stack spacing={1.25} sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Top 10 apps">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#e4dccf" strokeWidth={stroke} />
          {slices.map((app, index) => {
            const fraction = total > 0 ? app.seconds / total : 0;
            const length = fraction * circumference;
            const rotation = (cursor / circumference) * 360 - 90;
            cursor += length;
            const gap = Math.max(0, circumference - length);
            return (
              <circle
                key={app.name}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={SLICE_COLORS[index % SLICE_COLORS.length]}
                strokeWidth={stroke}
                strokeDasharray={gap < 1 ? undefined : `${length} ${gap}`}
                transform={`rotate(${rotation} ${center} ${center})`}
              >
                <title>{`${app.name} ${formatDuration(app.seconds)}`}</title>
              </circle>
            );
          })}
        </svg>
      </Box>
      {slices.map((app, index) => (
        <Stack key={app.name} direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: SLICE_COLORS[index % SLICE_COLORS.length],
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
            {app.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDuration(app.seconds)}
          </Typography>
          <Typography variant="caption" sx={{ minWidth: 36, textAlign: "right" }}>
            {total > 0 ? `${Math.round((app.seconds / total) * 100)}%` : ""}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function ZoomDialog({
  shot,
  scale,
  onScale,
  onClose,
}: {
  shot: Shot | null;
  scale: number;
  onScale: (scale: number) => void;
  onClose: () => void;
}) {
  const url = useAuthImage(shot?.thumbnailUrl ?? null);
  const frame = useRef<HTMLDivElement>(null);
  const zoomBy = (delta: number) => onScale(Math.min(6, Math.max(1, Number((scale + delta).toFixed(2)))));

  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomBy(event.deltaY < 0 ? 0.25 : -0.25);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [scale, shot]);

  return (
    <Dialog open={Boolean(shot)} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flexGrow: 1 }}>{shot ? formatWhen(shot.captureTime) : "Screenshot"}</Box>
        <Button size="small" onClick={() => zoomBy(-0.5)} disabled={scale <= 1}>
          Zoom out
        </Button>
        <Button size="small" onClick={() => zoomBy(0.5)} disabled={scale >= 6}>
          Zoom in
        </Button>
        <Button size="small" onClick={onClose}>
          Close
        </Button>
      </DialogTitle>
      <DialogContent ref={frame} sx={{ bgcolor: "#111", overflow: "auto", p: 0 }}>
        {url && (
          <img
            src={url}
            alt={shot ? `Screenshot at ${formatWhen(shot.captureTime)}` : ""}
            style={{ width: `${scale * 100}%`, maxWidth: "none", display: "block" }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
