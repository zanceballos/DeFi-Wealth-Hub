import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  Brain,
  Wallet,
  BookOpen,
} from "lucide-react";

const VALUE_POINTS = [
  {
    icon: Wallet,
    title: "Unified financial view",
    description:
      "Bring bank, crypto, and investment statements into one dashboard.",
  },
  {
    icon: Brain,
    title: "AI-powered clarity",
    description:
      "Get wellness scoring, budgeting insights, and personalised advisory.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy visibility",
    description: "See what data is uploaded, parsed, and used across your app.",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    user,
    loading: authLoading,
    error: authError,
    login,
    loginWithGoogle,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  }

  async function handleGoogle() {
    setSubmitting(true);
    await loginWithGoogle();
    setSubmitting(false);
  }

  const loading = submitting || authLoading;

  return (
    <div
      className="relative flex min-h-screen flex-col lg:flex-row"
      style={{ background: "#0A0F1E" }}
    >
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
            Privacy-first financial clarity
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            DeFi{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #00C9B1, #0099FF)",
              }}
            >
              Wealth Hub
            </span>
          </h1>
          <p
            className="text-base leading-relaxed sm:text-lg"
            style={{ color: "#8899AA" }}
          >
            Bring your bank, crypto, and investment statements into one secure
            dashboard with AI-powered insights, budgeting, and wealth advisory.
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
          <div className="mt-8">
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm font-medium transition hover:border-teal-400/50 hover:bg-teal-500/20"
              style={{ color: "#00C9B1" }}
            >
              <BookOpen className="h-4 w-4" />
              Read the full documentation →
            </a>
            <p className="mt-2 pl-1 text-xs" style={{ color: "#556677" }}>
              Architecture, data model, scoring formulas & more.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:w-1/2 lg:py-0">
        <div
          className="w-full max-w-md rounded-2xl border p-8 shadow-2xl backdrop-blur-xl sm:p-10"
          style={{
            background: "rgba(255,255,255,0.05)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <h2 className="mb-1 text-2xl font-bold text-white">Welcome back</h2>
          <p className="mb-8 text-sm" style={{ color: "#8899AA" }}>
            Sign in to access your financial dashboard, wallet insights,
            budgeting, and advisory.
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

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-1"
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
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium transition hover:underline"
                style={{ color: "#5BB8FF" }}
              >
                Forgot password?
              </Link>
            </div>

            {authError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
              style={{
                backgroundImage: "linear-gradient(135deg, #00C9B1, #0099FF)",
                boxShadow: "0 4px 20px rgba(0,153,255,0.25)",
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div
              className="h-px flex-1"
              style={{ background: "rgba(255,255,255,0.1)" }}
            />
            <span className="text-xs" style={{ color: "#8899AA" }}>
              or continue with
            </span>
            <div
              className="h-px flex-1"
              style={{ background: "rgba(255,255,255,0.1)" }}
            />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-60"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm" style={{ color: "#8899AA" }}>
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium transition hover:underline"
              style={{ color: "#5BB8FF" }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
