
import type { LoginFormData } from "@/lib/validation/login";

export type LoginErrorCode =
  | "INVALID_CREDENTIALS"
  | "VALIDATION_ERROR"
  | "SESSION_EXPIRED"
  | "LOGIN_UNAVAILABLE"
  | "SERVER_ERROR";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginApiResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export class LoginError extends Error {
  constructor(
    message: string,
    public readonly code: LoginErrorCode
  ) {
    super(message);
    this.name = "LoginError";
  }
}

export async function authenticateUser(
  formData: LoginFormData
): Promise<LoginApiResponse> {
  let response: Response;

  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }),
    });
  } catch {
    throw new LoginError(
      "Unable to connect to the server. Check your connection and try again.",
      "LOGIN_UNAVAILABLE"
    );
  }

  const body = await response.json().catch(() => null) as
    | LoginApiResponse
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const rawMessage = body && "message" in body
      ? body.message
      : undefined;

    const message = Array.isArray(rawMessage)
      ? rawMessage.join(" ")
      : rawMessage;

    if (response.status === 401) {
      if (
        body &&
        "code" in body &&
        body.code === "SESSION_EXPIRED"
      ) {
        throw new LoginError(
          "Your session has expired. Please sign in again.",
          "SESSION_EXPIRED"
        );
      }

      throw new LoginError(
        "The email address or password is incorrect.",
        "INVALID_CREDENTIALS"
      );
    }

    if (response.status === 400 || response.status === 422) {
      throw new LoginError(
        message ?? "Please check your login details.",
        "VALIDATION_ERROR"
      );
    }

    if (response.status === 404 || response.status === 501) {
      throw new LoginError(
        "Login is not available yet. Please try again later.",
        "LOGIN_UNAVAILABLE"
      );
    }

    if (response.status === 503) {
      throw new LoginError(
        "The login service is temporarily unavailable. Please try again shortly.",
        "LOGIN_UNAVAILABLE"
      );
    }

    throw new LoginError(
      message ?? "Something went wrong. Please try again.",
      "SERVER_ERROR"
    );
  }

  if (
    !body ||
    !("accessToken" in body) ||
    typeof body.accessToken !== "string" ||
    !("user" in body) ||
    !body.user ||
    typeof body.user !== "object"
  ) {
    throw new LoginError(
      "The server returned an invalid login response.",
      "SERVER_ERROR"
    );
  }

  return body as LoginApiResponse;
}
