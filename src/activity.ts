import type { ActivityEvent } from "./types";

const SPAN_CAP_SECONDS = 6 * 60;

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${total}s`;
}

export function captureActivity(shots: { inputActive?: boolean | null }[], slotMinutes: number): { active: number; idle: number } {
  let activeCount = 0;
  let inactiveCount = 0;
  for (const shot of shots) {
    if (shot.inputActive === true) activeCount += 1;
    else if (shot.inputActive === false) inactiveCount += 1;
  }
  const slot = Math.max(1, slotMinutes) * 60;
  return { active: activeCount * slot, idle: inactiveCount * slot };
}

export function activityPercent(activeSeconds: number, awaySeconds: number): number | null {
  const total = activeSeconds + awaySeconds;
  if (total <= 0) return null;
  return Math.round((activeSeconds / total) * 100);
}

export function activityTotals(events: ActivityEvent[], until: Date): { active: number; idle: number; apps: { name: string; seconds: number }[] } {
  const untilMs = until.getTime();
  const apps = new Map<string, number>();
  let active = 0;
  let idle = 0;
  events.forEach((event, index) => {
    const start = new Date(event.recordedAt).getTime();
    if (start > untilMs) return;
    const next = index + 1 < events.length ? new Date(events[index + 1].recordedAt).getTime() : untilMs;
    const end = Math.min(next, untilMs);
    if (end < start) return;
    const span = Math.min((end - start) / 1000, SPAN_CAP_SECONDS);
    if (event.state === "idle") {
      idle += span;
      return;
    }
    active += span;
    const name = event.appName || "Desktop";
    apps.set(name, (apps.get(name) ?? 0) + span);
  });
  const ranked = [...apps.entries()]
    .map(([name, seconds]) => ({ name, seconds }))
    .sort((left, right) => right.seconds - left.seconds);
  return { active, idle, apps: ranked };
}
