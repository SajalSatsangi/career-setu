export interface Job {
  id: string;
  companyName: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  requiredSkills: string[];
  status: "OPEN" | "CLOSED";
}

export interface JobApplication {
  id: string;
  status: "APPLIED" | "SHORTLISTED" | "REJECTED" | "HIRED";
  job: Job;
}

interface ApiErrorResponse {
  message?: string | string[];
}

export class JobsError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "JobsError";
  }
}

async function request<T>(path: string, accessToken: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/jobs${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch {
    throw new JobsError("Opportunities are temporarily unavailable.", 0);
  }

  const body = await response.json().catch(() => null) as T | ApiErrorResponse | null;
  if (!response.ok) {
    const rawMessage = body && typeof body === "object" && "message" in body ? body.message : undefined;
    throw new JobsError(Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage ?? "We could not load opportunities.", response.status);
  }

  return body as T;
}

export function fetchJobs(accessToken: string) {
  return request<Job[]>("", accessToken);
}

export function fetchMyApplications(accessToken: string) {
  return request<JobApplication[]>("/me/applications", accessToken);
}

export function applyToJob(accessToken: string, jobId: string) {
  return request<JobApplication>(`/${jobId}/apply`, accessToken, { method: "POST" });
}

export interface RecruiterJob extends Job {
  _count: { applications: number };
}

export interface RecruiterApplication {
  id: string;
  status: JobApplication["status"];
  appliedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    education: Array<{ degree: string; institution: string; fieldOfStudy: string }>;
    skills: Array<{ name: string; proficiency: string }>;
  };
}

export function fetchRecruiterJobs(accessToken: string) {
  return request<RecruiterJob[]>("/mine", accessToken);
}

export function fetchRecruiterApplications(accessToken: string, jobId: string) {
  return request<RecruiterApplication[]>(`/${jobId}/applications`, accessToken);
}

export function updateApplicationStatus(
  accessToken: string,
  jobId: string,
  applicationId: string,
  status: JobApplication["status"],
) {
  return request<JobApplication>(`/${jobId}/applications/${applicationId}/status`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}