import type { AuthUser } from "./types";

const TOKEN_KEY = "sc_token";
const USER_KEY = "sc_user";
const jsonCache = new Map<string, string>();

export function readCache<T>(path: string): T | null {
  const raw = jsonCache.get(path) ?? sessionStorage.getItem(`sc:${path}`);
  if (!raw) return null;
  jsonCache.set(path, raw);
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeCache(path: string, value: unknown): void {
  const raw = JSON.stringify(value);
  jsonCache.set(path, raw);
  try {
    sessionStorage.setItem(`sc:${path}`, raw);
  } catch {
    /* the browser storage quota is full */
  }
}

export function dropCache(path: string): void {
  jsonCache.delete(path);
  sessionStorage.removeItem(`sc:${path}`);
}

export function currentUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function authHeader(): Headers {
  const headers = new Headers();
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function errorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const body = JSON.parse(text) as { detail?: string };
    if (typeof body.detail === "string") return body.detail;
  } catch {
    /* response was not JSON */
  }
  return text || response.statusText;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = authHeader();
  const incoming = new Headers(options.headers);
  incoming.forEach((value, key) => headers.set(key, value));
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...options, headers, cache: "no-store" });
  if (response.status === 401) {
    clearSession();
    if (!path.endsWith("/api/login")) window.location.assign("/login");
    throw new Error("Not authenticated");
  }
  if (!response.ok) throw new Error(await errorMessage(response));
  if (response.status === 204) return undefined as T;
  const body = (await response.json()) as T;
  if ((options.method ?? "GET") === "GET") writeCache(path, body);
  return body;
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  const body = (await response.json()) as { accessToken: string; user: AuthUser };
  saveSession(body.accessToken, body.user);
  return body.user;
}

export async function fetchBlob(path: string): Promise<Blob> {
  const response = await fetch(path, { headers: authHeader() });
  if (response.status === 401) {
    clearSession();
    window.location.assign("/login");
    throw new Error("Not authenticated");
  }
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.blob();
}
