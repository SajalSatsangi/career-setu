export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  published: boolean;
  activities?: CourseActivity[];
}

export interface CourseActivity {
  id: string;
  title: string;
  description: string;
  position: number;
}

export interface CourseCompletion {
  activityId: string;
}

export interface CourseEnrollment {
  id: string;
  progress: number;
  course: Course;
  completions?: CourseCompletion[];
}

interface ApiErrorResponse {
  message?: string | string[];
}

export class CoursesError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "CoursesError";
  }
}

async function request<T>(path: string, accessToken: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/courses${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch {
    throw new CoursesError("Learning paths are temporarily unavailable.", 0);
  }

  const body = await response.json().catch(() => null) as T | ApiErrorResponse | null;
  if (!response.ok) {
    const rawMessage = body && typeof body === "object" && "message" in body ? body.message : undefined;
    throw new CoursesError(Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage ?? "Learning paths are temporarily unavailable.", response.status);
  }

  return body as T;
}

export function fetchCourses(accessToken: string) {
  return request<Course[]>("", accessToken);
}

export function fetchMyCourseEnrollments(accessToken: string) {
  return request<CourseEnrollment[]>("/me/enrollments", accessToken);
}

export function enrollInCourse(accessToken: string, courseId: string) {
  return request<CourseEnrollment>(`/${courseId}/enroll`, accessToken, { method: "POST" });
}

export function completeCourseActivity(accessToken: string, courseId: string, activityId: string) {
  return request<CourseEnrollment>(`/${courseId}/activities/${activityId}/complete`, accessToken, { method: "POST" });
}