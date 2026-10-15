
export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export type SignupFormErrors = Partial<
  Record<keyof SignupFormData, string>
>;

export interface PasswordRequirements {
  hasMinimumLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialCharacter: boolean;
}

export function getPasswordRequirements(
  password: string
): PasswordRequirements {
  return {
    hasMinimumLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialCharacter: /[^A-Za-z0-9]/.test(password),
  };
}

export function validateSignupForm(
  formData: SignupFormData
): SignupFormErrors {
  const errors: SignupFormErrors = {};
  const fullName = formData.fullName.trim();
  const email = formData.email.trim();

  if (!fullName) {
    errors.fullName = "Please enter your full name.";
  } else if (fullName.length < 2 || fullName.length > 100) {
    errors.fullName = "Name must be between 2 and 100 characters.";
  } else if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u.test(fullName)) {
    errors.fullName = "Enter a valid name.";
  }

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email = "Enter a valid email address.";
  }

  const requirements = getPasswordRequirements(formData.password);

  if (!formData.password) {
    errors.password = "Please create a password.";
  } else if (!requirements.hasMinimumLength) {
    errors.password = "Use at least 8 characters.";
  } else if (
    !requirements.hasUppercase ||
    !requirements.hasNumber ||
    !requirements.hasSpecialCharacter
  ) {
    errors.password =
      "Include an uppercase letter, a number, and a special symbol.";
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!formData.acceptedTerms) {
    errors.acceptedTerms = "Please accept the terms to continue.";
  }

  return errors;
}
