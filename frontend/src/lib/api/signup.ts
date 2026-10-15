
import type { SignupFormData } from "@/lib/validation/signup";

export type SignupErrorCode =
  | "ACCOUNT_EXISTS"
  | "VALIDATION_ERROR"
  | "SIGNUP_UNAVAILABLE"
  | "SERVER_ERROR";

export class SignupError extends Error {
  constructor(
    message: string,
    public readonly code: SignupErrorCode
  ) {
    super(message);
    this.name = "SignupError";
  }
}

interface SignupApiResponse {
  message?: string;
  code?: string;
}

export async function createAccount(
  formData: SignupFormData
): Promise<SignupApiResponse> {
  let response: Response;

  try {
    response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }),
    });
  } catch {
    throw new SignupError(
      "Signup is unavailable because the server could not be reached.",
      "SIGNUP_UNAVAILABLE"
    );
  }

  const responseBody: SignupApiResponse | null =
    await response.json().catch(() => null);

  if (response.ok) {
    return responseBody ?? {
      message: "Your account was created successfully.",
    };
  }

  if (
    response.status === 409 ||
    responseBody?.code === "ACCOUNT_EXISTS"
  ) {
    throw new SignupError(
      "An account already exists with this email address.",
      "ACCOUNT_EXISTS"
    );
  }

  if (response.status === 400 || response.status === 422) {
    throw new SignupError(
      responseBody?.message ?? "Please check your signup details.",
      "VALIDATION_ERROR"
    );
  }

  if (response.status === 404 || response.status === 501) {
    throw new SignupError(
      "Signup is not available yet. Please try again later.",
      "SIGNUP_UNAVAILABLE"
    );
  }

  throw new SignupError(
    responseBody?.message ?? "Something went wrong. Please try again.",
    "SERVER_ERROR"
  );
}
