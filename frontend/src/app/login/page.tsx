
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  validateLoginForm,
  type LoginFormData,
  type LoginFormErrors,
} from "@/lib/validation/login";
import {
  authenticateUser,
  LoginError,
} from "@/lib/api/login";
import "./login.css";

const INITIAL_FORM_DATA: LoginFormData = {
  email: "",
  password: "",
  rememberMe: true,
};

function EmailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  );
}

function PasswordVisibilityIcon({ isVisible }: { isVisible: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {isVisible && <path d="m3 3 18 18" />}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "error" | "info" | ""
  >("");

  function updateFormField<K extends keyof LoginFormData>(
    fieldName: K,
    fieldValue: LoginFormData[K]
  ) {
    const updatedFormData = {
      ...formData,
      [fieldName]: fieldValue,
    };

    setFormData(updatedFormData);

    if (hasSubmitted) {
      setFormErrors(validateLoginForm(updatedFormData));
    }

    setFormMessage("");
    setMessageType("");
  }

  async function handleLoginSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setHasSubmitted(true);
    setFormMessage("");
    setMessageType("");

    const validationErrors = validateLoginForm(formData);
    setFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authenticateUser(formData);
      router.replace("/dashboard");
    } catch (error: unknown) {
      if (error instanceof LoginError) {
        setFormMessage(error.message);
        setMessageType(
          error.code === "SESSION_EXPIRED" ? "info" : "error"
        );
      } else {
        setFormMessage("Unable to sign in right now. Please try again.");
        setMessageType("error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <header className="login-brand-header">
          <Link href="/" className="login-brand" aria-label="CareerSetu home">
            <span className="login-brand-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M7 23c3-5 6-7 10-7 3 0 6 2 8 5" />
                <path d="M11 13 18 6h5" />
                <path d="M16 16v7M10 23h12" />
              </svg>
            </span>
            <span className="login-brand-copy">
              <span className="login-brand-name">
                करियरसेतु <span className="login-brand-tag">CareerSetu</span>
              </span>
              <span className="login-brand-tagline">
                Bridge to career opportunities
              </span>
            </span>
          </Link>

          <span className="login-brand-status">
            <span className="login-status-dot" />
            Learn. Build. Grow.
          </span>
        </header>

        <div className="login-brand-content">
          <span className="login-eyebrow">
            YOUR CAREER JOURNEY STARTS HERE
          </span>
          <h1>Your next opportunity starts here.</h1>
          <p className="login-brand-description">
            Build skills, discover learning paths, and move closer to your
            career goals with CareerSetu.
          </p>

          <div className="login-feature-grid">
            <article className="login-feature-card">
              <span className="login-feature-symbol">01</span>
              <h2>Personalized learning</h2>
              <p>
                Explore learning paths that match your interests and career goals.
              </p>
            </article>

            <article className="login-feature-card">
              <span className="login-feature-symbol">02</span>
              <h2>Practical skill building</h2>
              <p>
                Strengthen your skills through focused practice and structured learning.
              </p>
            </article>

            <article className="login-feature-card login-feature-card-wide">
              <span className="login-feature-symbol">03</span>
              <div>
                <h2>Career readiness</h2>
                <p>
                  Organize your progress and prepare for your next career step.
                </p>
              </div>
            </article>
          </div>
        </div>

        <footer className="login-brand-footer">
          A personal learning companion for your next step.
        </footer>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-heading">
            <h2>Welcome back</h2>
            <p>Sign in to continue your learning journey.</p>
          </div>

          {formMessage && (
            <div
              className={`login-alert ${
                messageType === "info"
                  ? "login-alert-info"
                  : "login-alert-error"
              }`}
              role="alert"
            >
              <span className="login-alert-icon" aria-hidden="true">
                {messageType === "info" ? "i" : "!"}
              </span>
              <div className="login-alert-content">
                <strong>
                  {messageType === "info"
                    ? "Security session expired"
                    : "Unable to sign in"}
                </strong>
                <p>{formMessage}</p>
              </div>
              <button
                type="button"
                className="login-alert-dismiss"
                onClick={() => {
                  setFormMessage("");
                  setMessageType("");
                }}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          <form className="login-form" onSubmit={handleLoginSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="login-email">
                Institutional or personal email
              </label>
              <div className={`login-input-wrapper ${formErrors.email ? "login-input-invalid" : ""}`}>
                <span className="login-input-icon"><EmailIcon /></span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(event) => updateFormField("email", event.target.value)}
                  aria-invalid={Boolean(formErrors.email)}
                  aria-describedby={formErrors.email ? "login-email-error" : undefined}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.email && (
                <p className="login-field-error" id="login-email-error" role="alert">
                  {formErrors.email}
                </p>
              )}
              <p className="login-field-hint">
                Use the email address associated with your account.
              </p>
            </div>

            <div className="login-field">
              <div className="login-password-heading">
                <label htmlFor="login-password">Password</label>
                <Link href="/forgot-password" className="login-forgot-link">
                  Forgot password?
                </Link>
              </div>

              <div className={`login-input-wrapper ${formErrors.password ? "login-input-invalid" : ""}`}>
                <span className="login-input-icon"><LockIcon /></span>
                <input
                  id="login-password"
                  name="password"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(event) => updateFormField("password", event.target.value)}
                  aria-invalid={Boolean(formErrors.password)}
                  aria-describedby={formErrors.password ? "login-password-error" : undefined}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  aria-pressed={isPasswordVisible}
                  disabled={isSubmitting}
                >
                  <PasswordVisibilityIcon isVisible={isPasswordVisible} />
                </button>
              </div>
              {formErrors.password && (
                <p className="login-field-error" id="login-password-error" role="alert">
                  {formErrors.password}
                </p>
              )}
            </div>

            <label className="login-remember-option">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(event) => updateFormField("rememberMe", event.target.checked)}
                disabled={isSubmitting}
              />
              <span>Keep me signed in</span>
            </label>

            <button type="submit" className="login-submit-button" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to CareerSetu
                  <ArrowIcon />
                </>
              )}
            </button>
          </form>

          <div className="login-create-account">
            <span>New to CareerSetu?</span>
            <Link href="/signup">Create an account</Link>
          </div>

          <p className="login-security-note">
            <LockIcon />
            <span>
              Your account is protected by the authentication configured for CareerSetu.
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
