export type Role = "admin" | "manager" | "employee";

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

export interface Person {
  userId: number;
  fullName: string;
  username: string;
  role: Role;
  online: boolean;
  hostname: string | null;
  deviceId: string | null;
  lastCapture: string | null;
  lastThumbnailUrl: string | null;
  activityState?: "active" | "idle" | null;
  activityApp?: string | null;
  activityTitle?: string | null;
  idleSeconds?: number | null;
  activeSeconds?: number;
  awaySeconds?: number;
}

export interface ActivityEvent {
  id: number;
  recordedAt: string;
  appName: string;
  windowTitle: string;
  idleSeconds: number;
  state: "active" | "idle";
}

export interface DashboardData {
  onlineDevices: number;
  recentCaptures: number;
  openRequests: number;
  people: Person[];
}

export interface Shot {
  id: number;
  userId: number;
  deviceId: string;
  deviceHostname: string;
  captureTime: string;
  clientFileId: string;
  status: string;
  duplicate: boolean;
  width: number;
  height: number;
  thumbnailBytes: number;
  thumbnailUrl: string;
  inputActive?: boolean | null;
}

export interface FullImage {
  id: number;
  captureTime: string;
  clientFileId: string;
  width: number;
  height: number;
  url: string;
}

export interface ImageRequest {
  id: number;
  requesterId: number;
  requesterName: string;
  userId: number;
  userName: string;
  deviceId: string;
  startTime: string;
  endTime: string;
  status: string;
  error: string | null;
  createdAt: string;
  images: FullImage[];
}

export interface DirectoryUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

export interface Assignment {
  id: number;
  managerId: number;
  employeeId: number;
  managerName: string;
  employeeName: string;
}
