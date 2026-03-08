import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  KeyRound,
  Brain,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const VALUE_POINTS = [
  {
    icon: Mail,
    title: "Email-based recovery",
    description:
      "We’ll send a secure password reset link to your registered email address.",
  },
  {
    icon: ShieldCheck,
    title: "Secure reset flow",
    description:
      "Your account recovery is handled securely through Firebase Authentication.",
  },
  {
    icon: Brain,
    title: "Back to your dashboard",
    description:
      "Reset your password and continue using your AI-powered financial dashboard.",
  },
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      setSubmitting(false);
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (!isValidEmail) {
      setErrorMessage("Please enter a valid email address.");
      setSubmitting(false);
      return;
    }

    const result = await resetPassword(trimmedEmail);

    if (result.ok) {
      setSuccessMessage(
        "If an account exists for this email, a password reset link has been sent.",
      );
    } else {
      setErrorMessage(
        "Unable to process your request right now. Please try again.",
      );
    }

    setSubmitting(false);
  }

  return (
    <div
      className="relative flex min-h-screen flex-col lg:flex-row"
      style={{ background: "#0A0F1E" }}
    >
      {/* Left branding panel */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden px-8 py-16 lg:w-1/2 lg:py-0">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-1/4 -top-1/4 h-[140%] w-[140%] animate-spin"
            style={{
              background:
                "conic-gradient(from 0deg at 50% 50%, #0A0F1E 0%, #0D2847 25%, #0B4D5C 40%, #0D2847 60%, #0A0F1E 100%)",
              animationDuration: "30s",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(0,201,177,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(0,153,255,0.10) 0%, transparent 55%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        <div className="relative z-10 max-w-md text-center lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-teal-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400" />
            Secure account recovery
          </div>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Reset your{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #00C9B1, #0099FF)",
              }}
            >
              password
            </span>
          </h1>

          <p
            className="text-base leading-relaxed sm:text-lg"
            style={{ color: "#8899AA" }}
          >
            Enter your email and we&apos;ll send you a password reset link so
            you can regain access securely.
          </p>

          <div className="mt-10 space-y-4">
            {VALUE_POINTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-teal-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p
                        className="mt-1 text-sm leading-relaxed"
                        style={{ color: "#8899AA" }}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:w-1/2 lg:py-0">
        <div
          className="w-full max-w-md rounded-2xl border p-8 shadow-2xl backdrop-blur-xl sm:p-10"
          style={{
            background: "rgba(255,255,255,0.05)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium transition hover:underline"
            style={{ color: "#5BB8FF" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          <h2 className="mb-1 text-2xl font-bold text-white">
            Forgot your password?
          </h2>
          <p className="mb-8 text-sm" style={{ color: "#8899AA" }}>
            Enter the email linked to your account and we&apos;ll send you a
            reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-1"
                  style={{ borderColor: "#1E3A5F" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#00C9B1";
                    e.target.style.boxShadow = "0 0 0 3px rgba(0,201,177,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#1E3A5F";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {successMessage && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
                {successMessage}
              </p>
            )}

            {errorMessage && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
              style={{
                backgroundImage: "linear-gradient(135deg, #00C9B1, #0099FF)",
                boxShadow: "0 4px 20px rgba(0,153,255,0.25)",
              }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Sending reset link…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "#8899AA" }}>
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-medium transition hover:underline"
              style={{ color: "#5BB8FF" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
