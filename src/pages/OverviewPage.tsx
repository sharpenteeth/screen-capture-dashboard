import { Alert, Box, Card, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, currentUser, readCache } from "../api";
import { AuthImage } from "../components/AuthImage";
import { activityPercent, formatDuration } from "../activity";
import { formatWhen, statusLabel } from "../format";
import type { DashboardData, ImageRequest, Person } from "../types";

export function OverviewPage() {
  const navigate = useNavigate();
  const role = currentUser()?.role;
  const [data, setData] = useState<DashboardData | null>(() => readCache<DashboardData>("/api/dashboard"));
  const [requests, setRequests] = useState<ImageRequest[]>(() => readCache<ImageRequest[]>("/api/requests") ?? []);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const requestsPath = role && role !== "employee";
        const [dashboard, rows] = await Promise.all([
          api<DashboardData>("/api/dashboard"),
          requestsPath ? api<ImageRequest[]>("/api/requests") : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setData(dashboard);
        if (requestsPath) setRequests(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the desk");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [role]);

  const people = data?.people ?? [];
  const percents = people
    .map((person) => activityPercent(person.activeSeconds ?? 0, person.awaySeconds ?? 0))
    .filter((value): value is number => value !== null);
  const average = percents.length ? Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length) : null;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Who is at their desk</Typography>
        <Typography color="text.secondary">
          Each capture counts as the interval. It is active when the mouse or keyboard was used during that interval.
        </Typography>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
        <Stat label="Online computers" value={data?.onlineDevices ?? "–"} />
        <Stat label="Active, last 24 hours" value={average === null ? "–" : `${average}%`} />
        <Stat label="Open full-image requests" value={data?.openRequests ?? "–"} />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 280px" }, gap: 2, alignItems: "start" }}>
        <Card>
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6">Activity</Typography>
          </Box>
          {data && people.length === 0 && (
            <Alert severity="info" sx={{ m: 2 }}>
              No employees are assigned to this account yet.
            </Alert>
          )}
          {people.map((person) => {
            const percent = activityPercent(person.activeSeconds ?? 0, person.awaySeconds ?? 0);
            return (
              <Box
                key={person.userId}
                onClick={() => navigate(`/users/${person.userId}`)}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1.4fr 120px 1fr 88px" },
                  gap: 1.5,
                  alignItems: "center",
                  px: 2,
                  py: 1.5,
                  cursor: "pointer",
                  borderTop: "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: person.online ? "success.main" : "#b7aea2",
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="subtitle2" noWrap>
                      {person.fullName}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                    {person.activityState === "active"
                      ? "Active at last capture"
                      : person.activityState === "idle"
                        ? "Inactive at last capture"
                        : "No activity on captures yet"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                    {percent === null ? "–" : `${percent}%`}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={percent ?? 0}
                    sx={{ mt: 0.75, height: 6, borderRadius: 99 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {activityTimes(person)}
                </Typography>
                <AuthImage path={person.lastThumbnailUrl} alt={`${person.fullName} latest thumbnail`} height={48} />
              </Box>
            );
          })}
        </Card>
        {role !== "employee" && (
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Recent requests
            </Typography>
            <Stack spacing={1.2}>
              {requests.length === 0 && <Typography color="text.secondary">None yet.</Typography>}
              {requests.slice(0, 8).map((row) => (
                <Box
                  key={row.id}
                  onClick={() => navigate(`/requests/${row.id}`)}
                  sx={{ cursor: "pointer", borderTop: "1px solid", borderColor: "divider", pt: 1 }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {row.userName}
                    </Typography>
                    <Chip size="small" label={statusLabel(row.status)} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {formatWhen(row.startTime)} – {formatWhen(row.endTime)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        )}
      </Box>
    </Stack>
  );
}

function activityTimes(person: Person): string {
  const active = person.activeSeconds ?? 0;
  const away = person.awaySeconds ?? 0;
  if (active + away <= 0) return "No activity yet";
  return `${formatDuration(active)} active · ${formatDuration(away)} inactive`;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4">{value}</Typography>
    </Card>
  );
}
