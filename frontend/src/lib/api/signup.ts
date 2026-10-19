
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
  message?: string | string[];
  code?: string;
}

export async function createAccount(
  formData: SignupFormData
): Promise<SignupApiResponse> {
  let response: Response;

  try {
    response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }),
    });
  } catch {
    throw new SignupError(
      "The server could not be reached. Please try again.",
      "SIGNUP_UNAVAILABLE"
    );
  }

  const body = await response.json().catch(() => null) as
    | SignupApiResponse
    | null;

  const rawMessage = body?.message;
  const message = Array.isArray(rawMessage)
    ? rawMessage.join(" ")
    : rawMessage;

  if (response.ok) {
    return body ?? {
      message: "Your account was created successfully.",
    };
  }

  if (response.status === 409) {
    throw new SignupError(
      "An account already exists with this email address.",
      "ACCOUNT_EXISTS"
    );
  }

  if (response.status === 400 || response.status === 422) {
    throw new SignupError(
      message ?? "Please check your signup details.",
      "VALIDATION_ERROR"
    );
  }

  if (response.status === 404 || response.status === 501) {
    throw new SignupError(
      "The registration endpoint could not be found.",
      "SIGNUP_UNAVAILABLE"
    );
  }

  throw new SignupError(
    message ?? "Something went wrong. Please try again.",
    "SERVER_ERROR"
  );
}
