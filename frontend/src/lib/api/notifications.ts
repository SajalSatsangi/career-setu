export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}

interface ApiErrorResponse { message?: string | string[]; }

export class NotificationsError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "NotificationsError";
  }
}

async function request<T>(path: string, accessToken: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/notifications${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...options?.headers },
    });
  } catch {
    throw new NotificationsError("Notifications are temporarily unavailable.", 0);
  }
  const body = await response.json().catch(() => null) as T | ApiErrorResponse | null;
  if (!response.ok) {
    const rawMessage = body && typeof body === "object" && "message" in body ? body.message : undefined;
    throw new NotificationsError(Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage ?? "Notifications are temporarily unavailable.", response.status);
  }
  return body as T;
}

export function fetchNotifications(accessToken: string) {
  return request<NotificationRecord[]>("", accessToken);
}

export function markNotificationRead(accessToken: string, id: string) {
  return request<{ message: string }>(`/${id}/read`, accessToken, { method: "PATCH" });
}

export function markAllNotificationsRead(accessToken: string) {
  return request<{ count: number }>("/read-all", accessToken, { method: "PATCH" });
}