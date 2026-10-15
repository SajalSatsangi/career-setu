import type { LoginFormData } from "@/lib/validation/login";

export type LoginErrorCode =
  | "INVALID_CREDENTIALS"
  | "VALIDATION_ERROR"
  | "SESSION_EXPIRED"
  | "LOGIN_UNAVAILABLE"
  | "SERVER_ERROR";

interface LoginApiResponse {
  message?: string;
  code?: string;
  accessToken?: string;
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
        rememberMe: formData.rememberMe,
      }),
    });
  } catch {
    throw new LoginError(
      "Unable to connect to the server. Check your connection and try again.",
      "LOGIN_UNAVAILABLE"
    );
  }

  const responseBody: LoginApiResponse | null =
    await response.json().catch(() => null);

  if (response.ok) {
    return responseBody ?? {};
  }

  if (
    response.status === 401 ||
    responseBody?.code === "INVALID_CREDENTIALS"
  ) {
    throw new LoginError(
      "The email address or password is incorrect.",
      "INVALID_CREDENTIALS"
    );
  }

  if (response.status === 400 || response.status === 422) {
    throw new LoginError(
      responseBody?.message ?? "Please check your login details.",
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
    responseBody?.message ?? "Something went wrong. Please try again.",
    "SERVER_ERROR"
  );
}