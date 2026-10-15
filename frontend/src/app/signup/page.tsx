
"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  getPasswordRequirements,
  validateSignupForm,
  type SignupFormData,
  type SignupFormErrors,
} from "@/lib/validation/signup";
import { createAccount, SignupError } from "@/lib/api/signup";
import "./signup.css";

const INITIAL_FORM: SignupFormData = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
};

const PASSWORD_CHECKS = [
  { key: "hasMinimumLength", label: "8+ characters" },
  { key: "hasUppercase", label: "1 uppercase letter" },
  { key: "hasNumber", label: "1 numeric digit" },
  { key: "hasSpecialCharacter", label: "1 special symbol" },
] as const;

function PasswordVisibilityIcon({ isVisible }: { isVisible: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {isVisible ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 002.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.2 9.5 7-.4 1.1-1.2 2.3-2.3 3.4" />
          <path d="M6.2 6.2C3.9 7.6 2.7 9.6 2.5 12c1 2.8 4.5 7 9.5 7 1.1 0 2.1-.2 3-.6" />
        </>
      ) : (
        <>
          <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export default function SignupPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountExistsEmail, setAccountExistsEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const passwordRequirements = getPasswordRequirements(formData.password);
  const completedRequirementCount = Object.values(
    passwordRequirements
  ).filter(Boolean).length;

  const passwordStrength = !formData.password
    ? "Not entered"
    : completedRequirementCount <= 1
      ? "Weak"
      : completedRequirementCount === 2
        ? "Fair"
        : completedRequirementCount === 3
          ? "Good"
          : "Strong";

  const passwordsMatch =
    formData.password === formData.confirmPassword;

  function updateField<K extends keyof SignupFormData>(
    fieldName: K,
    value: SignupFormData[K]
  ) {
    const updatedForm = { ...formData, [fieldName]: value };
    setFormData(updatedForm);
    setFormMessage("");

    if (fieldName === "email") {
      setAccountExistsEmail("");
    }

    if (hasSubmitted) {
      setErrors(validateSignupForm(updatedForm));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);
    setFormMessage("");
    setAccountExistsEmail("");

    const validationErrors = validateSignupForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createAccount(formData);
      setMessageType("success");
      setFormMessage(result.message ?? "Account created successfully.");
    } catch (error) {
      if (error instanceof SignupError && error.code === "ACCOUNT_EXISTS") {
        setAccountExistsEmail(formData.email.trim());
      }

      setMessageType("error");
      setFormMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="signup-page">
      <section className="signup-shell">
        <aside className="signup-brand">
          <a className="brand-logo" href="/" aria-label="CareerSetu home">
            <span className="brand-icon">CS</span>
            <span className="brand-name">
              <strong>करियरसेतु <small>CareerSetu</small></strong>
              <small className="brand-tagline">
                AI-Powered Learning Platform
              </small>
            </span>
          </a>

          <div className="cohort-badge">
            <span className="status-dot" />
            Start building your career
          </div>

          <h1>Your next opportunity starts here.</h1>
          <p className="brand-description">
            Build skills, discover learning paths, and move closer to your
            career goals with an AI-guided career development platform.
          </p>

          <div className="progress-card">
            <div className="progress-heading">
              <strong>Step 1: Create your account</strong>
              <span>1 of 2</span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span />
            </div>
            <p>
              Create your account first. You can complete your learning and
              career profile in the next step.
            </p>
          </div>

          <div className="benefit-list">
            <Benefit
              icon="◎"
              title="Personalized Learning"
              description="Explore learning paths suited to your goals and skill level."
            />
            <Benefit
              icon="⌘"
              title="Skill Development"
              description="Build practical skills through exercises and guided practice."
            />
            <Benefit
              icon="✧"
              title="Career Readiness"
              description="Track your progress as you work towards your career goals."
            />
          </div>
        </aside>

        <section className="signup-content">
          <div className="signup-form-wrap">
            <header className="form-header">
              <h2>Create your account</h2>
              <p>Enter your details to get started with CareerSetu.</p>
            </header>

            {accountExistsEmail && (
              <div className="account-exists-alert" role="alert">
                <span className="account-alert-icon" aria-hidden="true">!</span>
                <div>
                  <h3>Account Already Exists</h3>
                  <p>
                    An account is already registered with{" "}
                    <strong>{accountExistsEmail}</strong>.{" "}
                    <a href="/login">Sign in here</a> or reset your password.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-field">
                <FieldHeading htmlFor="full-name" label="Full name" />
                <div className={`input-wrap ${errors.fullName ? "has-error" : ""}`}>
                  <span className="input-icon" aria-hidden="true">♙</span>
                  <input
                    id="full-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    aria-invalid={!!errors.fullName}
                  />
                </div>
                {errors.fullName && <FieldError>{errors.fullName}</FieldError>}
              </div>

              <div className="form-field">
                <FieldHeading
                  htmlFor="email"
                  label="Email address"
                  hint="Institutional email preferred"
                />
                <div
                  className={`input-wrap ${
                    errors.email || accountExistsEmail ? "has-error" : ""
                  }`}
                >
                  <span className="input-icon" aria-hidden="true">✉</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    placeholder="you@college.edu"
                    value={formData.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    aria-invalid={!!errors.email || !!accountExistsEmail}
                  />
                </div>
                {errors.email && <FieldError>{errors.email}</FieldError>}
                {accountExistsEmail && (
                  <p className="field-error">
                    This email is already registered. Please sign in.
                  </p>
                )}
              </div>

              <div className="form-field">
                <FieldHeading
                  htmlFor="password"
                  label="Password"
                  hint="At least 8 characters"
                />
                <div className={`input-wrap ${errors.password ? "has-error" : ""}`}>
                  <span className="input-icon" aria-hidden="true">♙</span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    className="visibility-button"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    <PasswordVisibilityIcon isVisible={showPassword} />
                  </button>
                </div>

                <div className="password-panel">
                  <div className="strength-heading">
                    <span>Password strength</span>
                    <strong className={`strength-${passwordStrength.toLowerCase().replace(" ", "-")}`}>
                      {passwordStrength}
                    </strong>
                  </div>

                  <div className="strength-bars" aria-hidden="true">
                    {PASSWORD_CHECKS.map((check, index) => (
                      <span
                        key={check.key}
                        className={
                          formData.password && index < completedRequirementCount
                            ? `filled strength-level-${completedRequirementCount}`
                            : ""
                        }
                      />
                    ))}
                  </div>

                  <p className="password-hint">
                    Use uppercase letters, numbers, and special symbols.
                  </p>

                  <div className="requirements-grid">
                    {PASSWORD_CHECKS.map(({ key, label }) => {
                      const isComplete = passwordRequirements[key];
                      return (
                        <div
                          key={key}
                          className={`requirement ${isComplete ? "requirement-met" : ""}`}
                        >
                          <span className="requirement-circle" aria-hidden="true">
                            {isComplete ? "✓" : ""}
                          </span>
                          <span>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {errors.password && <FieldError>{errors.password}</FieldError>}
              </div>

              <div className="form-field">
                <FieldHeading
                  htmlFor="confirm-password"
                  label="Confirm password"
                  hint={
                    formData.confirmPassword
                      ? passwordsMatch ? "Passwords match" : "Passwords do not match"
                      : undefined
                  }
                  hintClassName={
                    formData.confirmPassword
                      ? passwordsMatch ? "match-text" : "mismatch-text"
                      : ""
                  }
                />
                <div
                  className={`input-wrap ${
                    errors.confirmPassword ? "has-error" : ""
                  }`}
                >
                  <span className="input-icon" aria-hidden="true">↻</span>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(event) =>
                      updateField("confirmPassword", event.target.value)
                    }
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    className="visibility-button"
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((visible) => !visible)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    aria-pressed={showConfirmPassword}
                  >
                    <PasswordVisibilityIcon isVisible={showConfirmPassword} />
                  </button>
                </div>
                {errors.confirmPassword && (
                  <FieldError>{errors.confirmPassword}</FieldError>
                )}
              </div>

              <div className="terms-row">
                <input
                  id="terms"
                  name="acceptedTerms"
                  type="checkbox"
                  checked={formData.acceptedTerms}
                  onChange={(event) =>
                    updateField("acceptedTerms", event.target.checked)
                  }
                  aria-invalid={!!errors.acceptedTerms}
                />
                <label htmlFor="terms">
                  I agree to the CareerSetu <a href="/terms">Terms of Service</a>{" "}
                  and acknowledge the <a href="/privacy">Privacy Policy</a>.
                </label>
              </div>
              {errors.acceptedTerms && (
                <FieldError>{errors.acceptedTerms}</FieldError>
              )}

              <button
                className="submit-button"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner" aria-hidden="true" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account <span aria-hidden="true">→</span>
                  </>
                )}
              </button>

              {formMessage && (
                <p
                  className={`form-message ${
                    messageType === "success" ? "form-message-success" : ""
                  }`}
                  role="status"
                >
                  {formMessage}
                </p>
              )}

              <p className="signin-row">
                Already have an account? <a href="/login">Sign in</a>
              </p>
            </form>

            <footer className="form-footer">
              <span>CareerSetu account access</span>
              <div>
                <a href="/support">Need help?</a>
                <a href="/accessibility">Accessibility</a>
              </div>
            </footer>
          </div>
        </section>
      </section>
    </main>
  );
}

function FieldHeading({
  htmlFor,
  label,
  hint,
  hintClassName = "",
}: {
  htmlFor: string;
  label: string;
  hint?: string;
  hintClassName?: string;
}) {
  return (
    <div className="field-heading">
      <label htmlFor={htmlFor}>
        {label} <span className="required-mark">*</span>
      </label>
      {hint && <span className={hintClassName}>{hint}</span>}
    </div>
  );
}

function FieldError({ children }: { children: ReactNode }) {
  return <p className="field-error" role="alert">{children}</p>;
}

function Benefit({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <article className="benefit-card">
      <span className="benefit-icon" aria-hidden="true">{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}
