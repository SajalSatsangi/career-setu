
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import "./forgotPassword.css";
import {
  requestPasswordReset,
  ForgotPasswordError,
} from "@/lib/api/forgotPassword";

function EmailIcon() {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

function ResetIcon() {
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
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [emailAddress, setEmailAddress] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");
  const [developmentToken, setDevelopmentToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateEmailAddress(): boolean {
    const normalizedEmail = emailAddress.trim();

    if (!normalizedEmail) {
      setEmailError("Please enter your email address.");
      return false;
    }

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setEmailError("Enter a valid email address.");
      return false;
    }

    setEmailError("");
    return true;
  }

  async function handleResetRequest(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setFormMessage("");
    setMessageType("");
    setDevelopmentToken("");

    if (!validateEmailAddress()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset(emailAddress);

      setFormMessage(
        response.message ??
          "If an account exists for this email, password reset instructions will be sent."
      );
      setMessageType("success");
      setDevelopmentToken(response.developmentToken ?? "");
    } catch (error: unknown) {
      setFormMessage(
        error instanceof ForgotPasswordError
          ? error.message
          : "Unable to process your request. Please try again."
      );
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="forgot-page">
      <section className="forgot-brand-panel">
        <header className="forgot-brand-header">
          <Link
            href="/"
            className="forgot-brand"
            aria-label="CareerSetu home"
          >
            <span className="forgot-brand-icon">
              <svg
                aria-hidden="true"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M7 23c3-5 6-7 10-7 3 0 6 2 8 5" />
                <path d="M11 13 18 6h5" />
                <path d="M16 16v7M10 23h12" />
              </svg>
            </span>

            <span className="forgot-brand-copy">
              <span className="forgot-brand-name">
                करियरसेतु
                <span className="forgot-brand-tag">CareerSetu</span>
              </span>
              <span className="forgot-brand-tagline">
                Bridge to career opportunities
              </span>
            </span>
          </Link>
        </header>

        <div className="forgot-brand-content">
          <span className="forgot-eyebrow">
            ACCOUNT RECOVERY
          </span>

          <h1>Every step forward starts with access.</h1>

          <p>
            Get back to your learning journey and continue
            building the skills that move your career forward.
          </p>

          <div className="forgot-benefit-list">
            <article className="forgot-benefit">
              <span className="forgot-benefit-number">01</span>
              <div>
                <h2>Recover your account</h2>
                <p>Request password reset instructions using your email.</p>
              </div>
            </article>

            <article className="forgot-benefit">
              <span className="forgot-benefit-number">02</span>
              <div>
                <h2>Choose a new password</h2>
                <p>Follow the instructions provided by the reset service.</p>
              </div>
            </article>

            <article className="forgot-benefit">
              <span className="forgot-benefit-number">03</span>
              <div>
                <h2>Continue learning</h2>
                <p>Return to CareerSetu after completing recovery.</p>
              </div>
            </article>
          </div>
        </div>

        <footer className="forgot-brand-footer">
          CareerSetu · Your next step starts here.
        </footer>
      </section>

      <section className="forgot-form-panel">
        <div className="forgot-form-container">
          <Link href="/login" className="forgot-back-link">
            <ArrowIcon />
            Back to sign in
          </Link>

          <div className="forgot-heading-icon">
            <ResetIcon />
          </div>

          <div className="forgot-form-heading">
            <h2>Forgot your password?</h2>
            <p>
              Enter the email address associated with your account.
              We’ll help you get back in.
            </p>
          </div>

          {formMessage && (
            <div
              className={`forgot-alert ${
                messageType === "success"
                  ? "forgot-alert-success"
                  : "forgot-alert-error"
              }`}
              role="status"
              aria-live="polite"
            >
              <strong>
                {messageType === "success"
                  ? "Request processed"
                  : "Unable to process request"}
              </strong>
              <p>{formMessage}</p>
            </div>
          )}

          {developmentToken && (
            <div className="forgot-dev-reset" role="status">
              <strong>Development reset link</strong>
              <Link href={`/reset-password?token=${developmentToken}`}>Continue to set a new password</Link>
            </div>
          )}

          <form
            className="forgot-form"
            onSubmit={handleResetRequest}
            noValidate
          >
            <div className="forgot-field">
              <label htmlFor="forgot-email">Email address</label>

              <div
                className={`forgot-input-wrapper ${
                  emailError ? "forgot-input-invalid" : ""
                }`}
              >
                <span className="forgot-input-icon">
                  <EmailIcon />
                </span>

                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={emailAddress}
                  onChange={(event) => {
                    setEmailAddress(event.target.value);
                    setEmailError("");
                    setFormMessage("");
                    setMessageType("");
                  }}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={
                    emailError ? "forgot-email-error" : undefined
                  }
                  disabled={isSubmitting}
                />
              </div>

              {emailError && (
                <p
                  id="forgot-email-error"
                  className="forgot-field-error"
                  role="alert"
                >
                  {emailError}
                </p>
              )}

              <p className="forgot-field-hint">
                Use the email address you registered with.
              </p>
            </div>

            <button
              type="submit"
              className="forgot-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="forgot-spinner"
                    aria-hidden="true"
                  />
                  Sending request...
                </>
              ) : (
                "Request password reset"
              )}
            </button>
          </form>

          <div className="forgot-signup-link">
            Don’t have an account?{" "}
            <Link href="/signup">Create an account</Link>
          </div>

          <p className="forgot-security-note">
            Never share a password reset link with anyone.
          </p>
        </div>
      </section>
    </main>
  );
}
