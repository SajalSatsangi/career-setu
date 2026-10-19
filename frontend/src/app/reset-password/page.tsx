"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ForgotPasswordError, resetPassword } from "@/lib/api/forgotPassword";
import "./reset-password.css";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);
    const token = new URLSearchParams(window.location.search).get("token") ?? "";

    if (!token) {
      setMessage("This password reset link is invalid or expired.");
      return;
    }

    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPassword(token, password);
      setMessage(response.message ?? "Password reset successful. You can now sign in.");
      setIsSuccess(true);
    } catch (error: unknown) {
      setMessage(error instanceof ForgotPasswordError ? error.message : "Unable to reset your password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="reset-password-page">
      <section className="reset-password-panel" aria-labelledby="reset-password-title">
        <span className="reset-password-mark" aria-hidden="true">CS</span>
        <p className="reset-password-kicker">ACCOUNT RECOVERY</p>
        <h1 id="reset-password-title">Set a new password</h1>
        <p className="reset-password-intro">Choose a strong password with at least one letter and one number.</p>
        {message && <p className={isSuccess ? "reset-password-success" : "reset-password-error"} role="status">{message}</p>}
        {isSuccess ? <Link className="reset-password-link" href="/login">Return to sign in</Link> : <form onSubmit={handleSubmit}>
          <label htmlFor="new-password">New password</label>
          <input id="new-password" type="password" minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
          <label htmlFor="confirm-password">Confirm password</label>
          <input id="confirm-password" type="password" minLength={8} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Resetting..." : "Set new password"}</button>
        </form>}
        <Link className="reset-password-link" href="/login">Back to sign in</Link>
      </section>
    </main>
  );
}