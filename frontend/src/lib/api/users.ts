export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiErrorResponse {
  message?: string | string[];
}

function isCurrentUser(value: unknown): value is CurrentUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CurrentUser>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.role === "string"
  );
}

export class CurrentUserError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CurrentUserError";
  }
}

export async function fetchCurrentUser(
  accessToken: string,
): Promise<CurrentUser> {
  let response: Response;

  try {
    response = await fetch("/api/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    throw new CurrentUserError(
      "Unable to connect to CareerSetu. Please try again.",
      0,
    );
  }

  const body = await response.json().catch(() => null) as
    | CurrentUser
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const rawMessage = body && "message" in body ? body.message : undefined;
    const message = Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage;

    throw new CurrentUserError(
      message ?? "We could not load your profile. Please try again.",
      response.status,
    );
  }

  if (!isCurrentUser(body)) {
    throw new CurrentUserError(
      "The server returned an invalid profile response.",
      500,
    );
  }

  return body;
}

export async function updateCurrentUser(
  accessToken: string,
  name: string,
): Promise<CurrentUser> {
  const response = await fetch("/api/users/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  const body = await response.json().catch(() => null) as
    | CurrentUser
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const rawMessage = body && "message" in body ? body.message : undefined;
    const message = Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage;

    throw new CurrentUserError(
      message ?? "We could not update your profile. Please try again.",
      response.status,
    );
  }

  if (!isCurrentUser(body)) {
    throw new CurrentUserError(
      "The server returned an invalid profile response.",
      500,
    );
  }

  return body;
}

export interface EducationRecord {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number | null;
  isCurrent: boolean;
}

export type SkillProficiency = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export interface SkillRecord {
  id: string;
  name: string;
  proficiency: SkillProficiency;
}

async function requestUserCollection<T>(
  path: string,
  accessToken: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api/users/me/${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch {
    throw new CurrentUserError("Unable to connect to CareerSetu. Please try again.", 0);
  }

  const body = await response.json().catch(() => null) as T | ApiErrorResponse | null;

  if (!response.ok) {
    const rawMessage = body && typeof body === "object" && "message" in body
      ? body.message
      : undefined;
    const message = Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage;
    throw new CurrentUserError(message ?? "We could not update your career profile.", response.status);
  }

  return body as T;
}

export function fetchEducation(accessToken: string) {
  return requestUserCollection<EducationRecord[]>("education", accessToken);
}

export function createEducation(
  accessToken: string,
  education: Omit<EducationRecord, "id" | "endYear"> & { endYear?: number | null },
) {
  return requestUserCollection<EducationRecord>("education", accessToken, {
    method: "POST",
    body: JSON.stringify(education),
  });
}

export function deleteEducation(accessToken: string, id: string) {
  return requestUserCollection<EducationRecord>(`education/${id}`, accessToken, {
    method: "DELETE",
  });
}

export function fetchSkills(accessToken: string) {
  return requestUserCollection<SkillRecord[]>("skills", accessToken);
}

export function createSkill(
  accessToken: string,
  skill: Pick<SkillRecord, "name" | "proficiency">,
) {
  return requestUserCollection<SkillRecord>("skills", accessToken, {
    method: "POST",
    body: JSON.stringify(skill),
  });
}

export function deleteSkill(accessToken: string, id: string) {
  return requestUserCollection<SkillRecord>(`skills/${id}`, accessToken, {
    method: "DELETE",
  });
}