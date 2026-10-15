
export type ForgotPasswordErrorCode =
  | "VALIDATION_ERROR"
  | "REQUEST_UNAVAILABLE"
  | "SERVER_ERROR";

export class ForgotPasswordError extends Error {
  constructor(
    message: string,
    public readonly code: ForgotPasswordErrorCode
  ) {
    super(message);
    this.name = "ForgotPasswordError";
  }
}

interface ForgotPasswordApiResponse {
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function requestPasswordReset(
  emailAddress: string
): Promise<ForgotPasswordApiResponse> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/auth/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: emailAddress.trim().toLowerCase(),
        }),
      }
    );
  } catch {
    throw new ForgotPasswordError(
      "Unable to connect to the server. Check your connection and try again.",
      "REQUEST_UNAVAILABLE"
    );
  }

  const responseBody: ForgotPasswordApiResponse | null =
    await response.json().catch(() => null);

  if (response.ok) {
    return responseBody ?? {
      message:
        "If an account exists for this email, password reset instructions will be sent.",
    };
  }

  if (response.status === 400 || response.status === 422) {
    throw new ForgotPasswordError(
      responseBody?.message ?? "Please enter a valid email address.",
      "VALIDATION_ERROR"
    );
  }

  if (
    response.status === 404 ||
    response.status === 501 ||
    response.status === 503
  ) {
    throw new ForgotPasswordError(
      "Password reset is not available yet. Please try again later.",
      "REQUEST_UNAVAILABLE"
    );
  }

  throw new ForgotPasswordError(
    responseBody?.message ??
      "Something went wrong. Please try again.",
    "SERVER_ERROR"
  );
}
