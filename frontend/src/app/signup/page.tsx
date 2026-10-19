
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  getPasswordRequirements,
  validateSignupForm,
  type SignupFormData,
} from "@/lib/validation/signup";
import {
  createAccount,
  SignupError,
} from "@/lib/api/signup";
import "./signup.css";

const STRENGTH_LABELS = [
  "Too weak",
  "Weak",
  "Fair",
  "Good",
  "Strong",
];

function scorePassword(password: string): number {
  if (!password) return 0;

  const requirements = getPasswordRequirements(password);
  let score = 0;

  if (requirements.hasMinimumLength) score++;
  if (requirements.hasUppercase) score++;
  if (requirements.hasNumber) score++;
  if (requirements.hasSpecialCharacter) score++;

  return Math.max(score, 1);
}

function Particles() {
  return (
    <div className="cs-particles" aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => {
        const size = 2 + ((index * 7) % 4);

        return (
          <span
            key={index}
            style={{
              left: `${(index * 37) % 100}%`,
              width: size,
              height: size,
              animationDuration: `${14 + ((index * 5) % 14)}s`,
              animationDelay: `-${(index * 3) % 20}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<SignupFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupFormData, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const strength = useMemo(
    () => scorePassword(formData.password),
    [formData.password],
  );

  function updateField<K extends keyof SignupFormData>(
    field: K,
    value: SignupFormData[K],
  ) {
    setFormData((current) => ({ ...current, [field]: value }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setFeedback(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const validationErrors = validateSignupForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      await createAccount(formData);

      setFeedback({
        type: "success",
        text: "Your account has been created. Redirecting to sign in…",
      });

      window.setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof SignupError
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="cs-auth">
      <Particles />

      <aside className="cs-brand" aria-label="CareerSetu introduction">
        <Link href="/" className="cs-logo">
          <span className="cs-logo-mark" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M3 17c3-8 15-8 18 0M7 17v-4M12 17V9M17 17v-4M2 17h20" />
            </svg>
          </span>

          <span>
            करियरसेतु
            <small>CareerSetu</small>
          </span>
        </Link>

        <div className="cs-hero">
          <h1>
            Build your <span className="cs-grad">bridge</span> to the career
            you want.
          </h1>

          <p>
            Discover personalised learning paths, build real-world skills,
            and move closer to your dream career.
          </p>
        </div>

        <div className="cs-stage" aria-hidden="true">
          <svg
            className="cs-bridge"
            viewBox="0 0 600 230"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="cs-gradient" x1="0" x2="1">
                <stop offset="0" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
            </defs>

            <path
              className="draw"
              d="M0 200 C150 20 450 20 600 200"
              stroke="url(#cs-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          <div className="cs-chip a">
            Your goals
            <b>Start your journey</b>
          </div>

          <div className="cs-chip b">
            AI learning roadmap
            <b>Made for you</b>
            <div className="bar">
              <i style={{ width: "80%" }} />
            </div>
          </div>

          <div className="cs-chip c">
            Your next opportunity
            <b>Keep growing 🚀</b>
          </div>
        </div>

        <div className="cs-stats">
          <span>
            <b>AI</b>
            Personalised learning
          </span>
          <span>
            <b>Skills</b>
            Career readiness
          </span>
          <span>
            <b>Goals</b>
            Your next step
          </span>
        </div>
      </aside>

      <section className="cs-panel">
        <div className="cs-card">
          <div className="cs-card-heading">
            <span className="cs-eyebrow">YOUR FUTURE STARTS HERE</span>
            <h2>Create your account</h2>
            <p className="cs-sub">
              Join CareerSetu and take the next step in your career.
            </p>
          </div>

          <form className="cs-form" onSubmit={onSubmit} noValidate>
            <div className="cs-field">
              <label htmlFor="fullName">Full name</label>
              <div className="cs-input-wrap">
                <input
                  id="fullName"
                  className="cs-input"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  aria-invalid={!!errors.fullName}
                  aria-describedby={
                    errors.fullName ? "fullName-error" : undefined
                  }
                  required
                />
              </div>

              {errors.fullName && (
                <p id="fullName-error" className="cs-err" role="alert">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="cs-field">
              <label htmlFor="email">Email address</label>
              <div className="cs-input-wrap">
                <input
                  id="email"
                  className="cs-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  required
                />
              </div>

              {errors.email && (
                <p id="email-error" className="cs-err" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="cs-field">
              <label htmlFor="password">Password</label>
              <div className="cs-input-wrap">
                <input
                  id="password"
                  className="cs-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  aria-invalid={!!errors.password}
                  aria-describedby="pw-strength password-error"
                  required
                />

                <button
                  type="button"
                  className="cs-eye"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? "Hide passwords" : "Show passwords"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="cs-meter" aria-hidden="true">
                {[1, 2, 3, 4].map((level) => (
                  <i
                    key={level}
                    className={
                      formData.password && strength >= level
                        ? `on-${strength}`
                        : ""
                    }
                  />
                ))}
              </div>

              <p
                id="pw-strength"
                className="cs-meter-label"
                aria-live="polite"
              >
                {formData.password
                  ? `Strength: ${STRENGTH_LABELS[strength]}`
                  : "Use 8+ characters, uppercase, a number and a symbol."}
              </p>

              {errors.password && (
                <p id="password-error" className="cs-err" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="cs-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="cs-input-wrap">
                <input
                  id="confirmPassword"
                  className="cs-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  value={formData.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "confirm-error" : undefined
                  }
                  required
                />
              </div>

              {errors.confirmPassword && (
                <p id="confirm-error" className="cs-err" role="alert">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="cs-terms">
              <label className="cs-check">
                <input
                  type="checkbox"
                  checked={formData.acceptedTerms}
                  onChange={(event) =>
                    updateField("acceptedTerms", event.target.checked)
                  }
                  aria-invalid={!!errors.acceptedTerms}
                  required
                />

                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="cs-link">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="cs-link">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {errors.acceptedTerms && (
                <p className="cs-err" role="alert">
                  {errors.acceptedTerms}
                </p>
              )}
            </div>

            {feedback && (
              <div
                className={`cs-alert ${feedback.type}`}
                role={feedback.type === "error" ? "alert" : "status"}
              >
                {feedback.text}
              </div>
            )}

            <button className="cs-btn" type="submit" disabled={loading}>
              {loading && (
                <span className="cs-spin" aria-hidden="true" />
              )}
              {loading ? "Creating account…" : "Create your account"}
              {!loading && <span aria-hidden="true"> →</span>}
            </button>

            <p className="cs-switch">
              Already have an account?{" "}
              <Link href="/login" className="cs-link">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
