
"use client";

import { FormEvent, useState } from "react";

const requirements = [
  { label: "8+ characters", test: (value: string) => value.length >= 8 },
  { label: "1 uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "1 numeric digit", test: (value: string) => /\d/.test(value) },
  { label: "1 special symbol", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

function Icon({
  name,
  size = 18,
}: {
  name: "user" | "mail" | "lock" | "eye" | "eyeOff" | "history" | "arrow" | "brain" | "sliders" | "bulb" | "check";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<string, React.ReactNode> = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /><path d="M12 14v3" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-4 4.7M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7a10 10 0 0 0 3.2-.5" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    brain: <><path d="M12 5a4 4 0 0 0-7.5 2A4 4 0 0 0 5 14a4 4 0 0 0 7 3Z" /><path d="M12 5a4 4 0 0 1 7.5 2A4 4 0 0 1 19 14a4 4 0 0 1-7 3M12 5v16M8 9h2M15 11h2" /></>,
    sliders: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" fill="currentColor" /><circle cx="15" cy="12" r="2" fill="currentColor" /><circle cx="10" cy="18" r="2" fill="currentColor" /></>,
    bulb: <><path d="M9 18h6M10 22h4M8 14a7 7 0 1 1 8 0c-.8.6-1 1.5-1 2H9c0-.5-.2-1.4-1-2Z" /><path d="M12 4v2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordChecks = requirements.map((item) => ({
    ...item,
    passed: item.test(password),
  }));
  const strength = passwordChecks.filter((item) => item.passed).length;
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setMessage("");

    if (name.trim().length < 2) {
      setMessage("Please enter your full legal name.");
      return;
    }

    if (!emailValid) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (strength !== 4) {
      setMessage("Please meet all four password requirements.");
      return;
    }

    if (!passwordsMatch) {
      setMessage("Your passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setMessage("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setMessage(
      "All checks passed! Backend registration is not connected yet."
    );
  }

  return (
    <main className="signup-page">
      <section className="brand-panel" aria-label="About CareerSetu">
        <div className="brand-content">
          <a className="brand" href="#" aria-label="CareerSetu home">
            <span className="brand-mark">
              <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="36" height="36" rx="10" fill="white" />
                <path d="M9 27 20 8l11 19H9Z" fill="#5045E8" />
                <path d="m14 27 6-10 6 10" stroke="white" strokeWidth="2" />
                <circle cx="20" cy="27" r="2" fill="white" />
              </svg>
            </span>
            <span className="brand-wording">
              <span className="brand-name">
                करियरसेतु <span>CareerSetu</span>
              </span>
              <span className="brand-tagline">
                National Career Readiness &amp; AI Bridge
              </span>
            </span>
          </a>

          <div className="cohort-pill">
            <span className="status-dot" />
            Cohorts open for 2025/2026
          </div>

          <h1>Join thousands of learners building future-proof careers.</h1>
          <p className="brand-description">
            Personalized AI career roadmaps, real-world industry benchmarks,
            and verified portfolio credentials designed for tomorrow&apos;s
            work landscape.
          </p>

          <div className="progress-card">
            <div className="progress-heading">
              <strong>Step 1 of 2: Basic Account</strong>
              <span>50% Completed</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Registration progress"
              aria-valuenow={50}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span />
            </div>
            <p>
              Profile validation, educational history, and domain goals are
              seamlessly configured in Step 2 onboarding.
            </p>
          </div>

          <div className="benefits">
            <article className="benefit-card">
              <span className="benefit-icon"><Icon name="brain" size={19} /></span>
              <div>
                <h2>Free Diagnostic Assessment</h2>
                <p>
                  Automated skill gap evaluation calibrated against real hiring
                  matrices.
                </p>
              </div>
            </article>
            <article className="benefit-card">
              <span className="benefit-icon"><Icon name="sliders" size={19} /></span>
              <div>
                <h2>Personalized AI Course Planner</h2>
                <p>
                  Adaptive learning roadmaps adjusted for student and
                  professional schedules.
                </p>
              </div>
            </article>
            <article className="benefit-card">
              <span className="benefit-icon"><Icon name="bulb" size={19} /></span>
              <div>
                <h2>Lifetime Workshop Access</h2>
                <p>
                  Weekly masterclasses with Tier-1 engineering and product
                  leads.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="form-panel" aria-labelledby="form-title">
        <div className="form-container">
          <header className="form-header">
            <h2 id="form-title">Create your CareerSetu account</h2>
            <p>Start your journey towards high-growth career opportunities.</p>
          </header>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <div className="field-label-row">
                <label htmlFor="full-name">Full legal name <span>*</span></label>
                <span className="field-hint">Used on official certificates</span>
              </div>
              <div className="input-wrap">
                <Icon name="user" />
                <input
                  id="full-name"
                  autoComplete="name"
                  placeholder="e.g. Ananya Patel"
                  value={name}
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={submitted && name.trim().length < 2}
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label htmlFor="email">Work or student email <span>*</span></label>
                <span className="field-hint">Institutional ID preferred</span>
              </div>
              <div className="input-wrap">
                <Icon name="mail" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ananya.p@college.edu"
                  value={email}
                  maxLength={254}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={submitted && !emailValid}
                  required
                />
              </div>
            </div>

            <div className="field-group password-group">
              <div className="field-label-row">
                <label htmlFor="password">Password <span>*</span></label>
                <span className="field-hint">Minimum 8 characters</span>
              </div>
              <div className="input-wrap">
                <Icon name="lock" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a robust passphrase"
                  value={password}
                  maxLength={128}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={submitted && strength !== 4}
                  required
                />
                <button
                  className="visibility-button"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} />
                </button>
              </div>

              <div className="strength-card">
                <div className="strength-heading">
                  <span>PASSWORD STRENGTH</span>
                  <strong>
                    {password.length === 0
                      ? "None entered"
                      : ["Weak", "Fair", "Good", "Strong", "Very strong"][strength]}
                  </strong>
                </div>
                <div className="strength-bars" aria-hidden="true">
                  {[1, 2, 3, 4].map((bar) => (
                    <span
                      key={bar}
                      className={bar <= strength ? `strength-level level-${strength}` : ""}
                    />
                  ))}
                </div>
                <p className="strength-description">
                  Use at least 8 characters with a blend of uppercase letters,
                  numbers, and symbols.
                </p>
                <div className="requirements-grid">
                  {passwordChecks.map((item) => (
                    <div
                      key={item.label}
                      className={`requirement ${item.passed ? "requirement-passed" : ""}`}
                    >
                      <span className="requirement-indicator">
                        {item.passed ? <Icon name="check" size={12} /> : ""}
                      </span>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="field-group confirm-group">
              <div className="field-label-row">
                <label htmlFor="confirm-password">Confirm password <span>*</span></label>
                {confirmPassword.length > 0 && (
                  <span className={passwordsMatch ? "match-success" : "match-error"}>
                    {passwordsMatch ? "✓ Passwords match" : "Passwords do not match"}
                  </span>
                )}
              </div>
              <div className="input-wrap">
                <Icon name="history" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-type your password"
                  value={confirmPassword}
                  maxLength={128}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  aria-invalid={submitted && !passwordsMatch}
                  required
                />
                <button
                  className="visibility-button"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                >
                  <Icon name={showConfirmPassword ? "eyeOff" : "eye"} />
                </button>
              </div>
            </div>

            <label className="consent-row">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
              />
              <span>
                I agree to the CareerSetu{" "}
                <a href="/terms" onClick={(event) => event.preventDefault()}>
                  Terms of Service
                </a>{" "}
                and acknowledge the institutional{" "}
                <a href="/privacy" onClick={(event) => event.preventDefault()}>
                  Privacy Policy
                </a>.
              </span>
            </label>

            {message && (
              <div
                className={`form-message ${message.startsWith("All checks") ? "form-message-success" : "form-message-error"}`}
                role="status"
              >
                {message}
              </div>
            )}

            <button className="submit-button" type="submit">
              Create CareerSetu Account
              <Icon name="arrow" size={19} />
            </button>

            <p className="form-footer">
              Already have an account? <a href="/login">Sign in</a>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
