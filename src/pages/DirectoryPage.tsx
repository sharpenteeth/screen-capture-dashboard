import {
  Alert,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import { api, currentUser, dropCache } from "../api";
import type { Assignment, DirectoryUser, Role } from "../types";

type UserDraft = {
  id: number | null;
  fullName: string;
  username: string;
  role: Role;
  password: string;
  isActive: boolean;
};

const emptyDraft: UserDraft = {
  id: null,
  fullName: "",
  username: "",
  role: "employee",
  password: "",
  isActive: true,
};

export function DirectoryPage() {
  const viewer = currentUser();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState("");
  const [managerId, setManagerId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState("20");
  const [draft, setDraft] = useState<UserDraft | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  function rememberUser(saved: DirectoryUser) {
    setUsers((current) => {
      const next = current.some((user) => user.id === saved.id)
        ? current.map((user) => (user.id === saved.id ? saved : user))
        : [...current, saved];
      return next.sort((a, b) => a.fullName.localeCompare(b.fullName));
    });
  }

  async function reload() {
    dropCache("/api/users");
    dropCache("/api/assignments");
    dropCache("/api/dashboard");
    const [people, links, settings] = await Promise.all([
      api<DirectoryUser[]>("/api/users"),
      api<Assignment[]>("/api/assignments"),
      api<{ captureIntervalMinutes: number }>("/api/settings"),
    ]);
    setUsers(people);
    setAssignments(links);
    setIntervalMinutes(String(settings.captureIntervalMinutes));
  }

  useEffect(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load directory"));
  }, []);

  async function saveInterval(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const saved = await api<{ captureIntervalMinutes: number }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ captureIntervalMinutes: Number(intervalMinutes) }),
      });
      setIntervalMinutes(String(saved.captureIntervalMinutes));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the interval");
    }
  }

  async function saveUser(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSavingUser(true);
    setError("");
    try {
      const saved = draft.id
        ? await api<DirectoryUser>(`/api/users/${draft.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              fullName: draft.fullName,
              username: draft.username,
              role: draft.role,
              isActive: draft.isActive,
              password: draft.password || undefined,
            }),
          })
        : await api<DirectoryUser>("/api/users", {
            method: "POST",
            body: JSON.stringify({
              fullName: draft.fullName,
              username: draft.username,
              role: draft.role,
              password: draft.password,
            }),
          });
      const me = currentUser();
      if (me && saved.id === me.id) {
        localStorage.setItem("sc_user", JSON.stringify({ ...me, ...saved }));
        if (saved.role !== me.role) {
          window.location.assign("/");
          return;
        }
      }
      rememberUser(saved);
      setDraft(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the user");
    } finally {
      setSavingUser(false);
    }
  }

  async function deleteUser(user: DirectoryUser) {
    if (!window.confirm(`Delete ${user.fullName}? This only works before the account has screenshots.`)) return;
    setError("");
    try {
      await api(`/api/users/${user.id}`, { method: "DELETE" });
      setUsers((current) => current.filter((row) => row.id !== user.id));
      setDraft(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the user");
    }
  }

  async function assign(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/assignments", {
        method: "POST",
        body: JSON.stringify({ managerId: Number(managerId), employeeId: Number(employeeId) }),
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign");
    }
  }

  async function remove(id: number) {
    await api(`/api/assignments/${id}`, { method: "DELETE" });
    await reload();
  }

  const managers = users.filter((user) => user.role === "manager" && user.isActive);
  const employees = users.filter((user) => user.role === "employee" && user.isActive);

  if (viewer?.role !== "admin") {
    return <Alert severity="warning">Only an admin can open the directory.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4">Users</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Card component="form" onSubmit={saveInterval} sx={{ p: 2 }}>
        <Typography variant="h6">Capture interval</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Agents capture a thumbnail on this schedule. The default is 20 minutes.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
          <TextField
            label="Minutes"
            type="number"
            value={intervalMinutes}
            onChange={(event) => setIntervalMinutes(event.target.value)}
            inputProps={{ min: 1, max: 60 }}
            sx={{ width: 160 }}
            required
          />
          <Button type="submit" variant="contained">
            Save interval
          </Button>
        </Stack>
      </Card>
      <Card sx={{ p: 2 }}>
        <Stack direction="row" sx={{ alignItems: "center", mb: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Accounts
          </Typography>
          <Button variant="contained" onClick={() => setDraft({ ...emptyDraft })}>
            Add user
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>{user.role}</TableCell>
                <TableCell>
                  <Chip size="small" label={user.isActive ? "Active" : "Disabled"} color={user.isActive ? "success" : "default"} />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() =>
                      setDraft({
                        id: user.id,
                        fullName: user.fullName,
                        username: user.username,
                        role: user.role,
                        password: "",
                        isActive: user.isActive,
                      })
                    }
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Card component="form" onSubmit={assign} sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Manager assignments
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField select label="Manager" value={managerId} onChange={(event) => setManagerId(event.target.value)} sx={{ minWidth: 220 }}>
            {managers.map((user) => (
              <MenuItem key={user.id} value={String(user.id)}>
                {user.fullName}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Employee" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} sx={{ minWidth: 220 }}>
            {employees.map((user) => (
              <MenuItem key={user.id} value={String(user.id)}>
                {user.fullName}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained">
            Assign
          </Button>
        </Stack>
        <Stack spacing={1} sx={{ mt: 2 }}>
          {assignments.map((row) => (
            <Stack key={row.id} direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Typography sx={{ flexGrow: 1 }}>
                {row.managerName} sees {row.employeeName}
              </Typography>
              <Button size="small" onClick={() => void remove(row.id)}>
                Remove
              </Button>
            </Stack>
          ))}
        </Stack>
      </Card>
      <Dialog open={draft !== null} onClose={() => setDraft(null)} fullWidth maxWidth="xs">
        <DialogTitle>{draft?.id ? "Edit user" : "Add user"}</DialogTitle>
        {draft && (
          <Stack component="form" onSubmit={saveUser}>
            <DialogContent sx={{ display: "grid", gap: 2 }}>
              <TextField
                label="Name"
                value={draft.fullName}
                onChange={(event) => setDraft({ ...draft, fullName: event.target.value })}
                required
                autoFocus
              />
              <TextField
                label="Username"
                value={draft.username}
                onChange={(event) => setDraft({ ...draft, username: event.target.value })}
                required
              />
              <TextField
                select
                label="Role"
                value={draft.role}
                onChange={(event) => setDraft({ ...draft, role: event.target.value as Role })}
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
              <TextField
                label={draft.id ? "New password" : "Password"}
                type="password"
                value={draft.password}
                onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                required={!draft.id}
                helperText={draft.id ? "Leave blank to keep the current password." : "At least 8 characters."}
              />
              {draft.id !== null && (
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Typography>Active</Typography>
                  <Switch
                    checked={draft.isActive}
                    onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
                    disabled={draft.id === viewer?.id}
                  />
                </Stack>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              {draft.id !== null && draft.id !== viewer?.id && (
                <Button
                  color="error"
                  sx={{ mr: "auto" }}
                  onClick={() => {
                    const person = users.find((user) => user.id === draft.id);
                    if (person) void deleteUser(person);
                  }}
                >
                  Delete
                </Button>
              )}
              <Button onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={savingUser}>
                Save
              </Button>
            </DialogActions>
          </Stack>
        )}
      </Dialog>
    </Stack>
  );
}
