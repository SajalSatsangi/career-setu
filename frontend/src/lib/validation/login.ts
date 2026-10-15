
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type LoginFormErrors = Partial<
  Record<keyof LoginFormData, string>
>;

export function validateLoginForm(
  formData: LoginFormData
): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const email = formData.email.trim();

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email = "Enter a valid email address.";
  }

  if (!formData.password) {
    errors.password = "Please enter your password.";
  }

  return errors;
}
