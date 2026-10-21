export interface MentorProfile {
  id: string;
  userId: string;
  bio: string;
  expertise: string[];
  availability: string;
  user: { id: string; name: string };
}

export interface MentorshipRequest {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  mentor: { id: string; name: string };
}

interface ApiErrorResponse { message?: string | string[]; }

export class MentoringError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "MentoringError";
  }
}

async function request<T>(path: string, accessToken: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/mentoring${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...options?.headers },
    });
  } catch {
    throw new MentoringError("Mentoring is temporarily unavailable.", 0);
  }

  const body = await response.json().catch(() => null) as T | ApiErrorResponse | null;
  if (!response.ok) {
    const rawMessage = body && typeof body === "object" && "message" in body ? body.message : undefined;
    throw new MentoringError(Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage ?? "Mentoring is temporarily unavailable.", response.status);
  }
  return body as T;
}

export function fetchMentors(accessToken: string) {
  return request<MentorProfile[]>("/mentors", accessToken);
}

export function fetchMyMentorshipRequests(accessToken: string) {
  return request<MentorshipRequest[]>("/me/requests", accessToken);
}

export function requestMentorship(accessToken: string, mentorId: string) {
  return request<MentorshipRequest>(`/mentors/${mentorId}/requests`, accessToken, { method: "POST" });
}