export function formatWhen(iso: string | null): string {
  if (!iso) return "No captures yet";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDay(day: Date): string {
  return day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export function dayBounds(day: Date): { from: string; to: string } {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(start.getTime() + 86_400_000);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function shiftRange(iso: string, minutes: number): string {
  const next = new Date(new Date(iso).getTime() + minutes * 60_000);
  return next.toISOString().slice(0, 19) + "Z";
}

export function statusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Waiting for the computer";
    case "accepted":
      return "Agent accepted";
    case "uploading":
      return "Uploading originals";
    case "ready":
      return "Ready";
    case "unavailable":
      return "Not retained on the computer";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}
