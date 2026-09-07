"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  UserCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  // Quick demo credentials for convenience
  const demoAccounts = [
    {
      role: "Admin",
      email: "admin@sms.edu",
      pass: "Admin@1234",
      label: "Administrator",
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300",
      badge: "Full Access",
    },
    {
      role: "Teacher",
      email: "sarah.connor@sms.edu",
      pass: "Teacher@1234",
      label: "Faculty",
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300",
      badge: "Grading & Attendance",
    },
    {
      role: "Student",
      email: "alex.morgan@sms.edu",
      pass: "Student@1234",
      label: "Student",
      color: "from-sky-500/20 to-indigo-500/20 border-sky-500/30 text-sky-300",
      badge: "Courses & Fees",
    },
  ];

  const handleSelectDemo = (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.pass);
    setActiveDemo(account.role);
    setError("");
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let result: { success?: boolean; error?: string; user?: { role?: string } } | null = null;
      try {
        result = await response.json();
      } catch {
        // Response was not valid JSON
      }

      if (!response.ok || !result?.success) {
        setError(result?.error || `Authentication request failed (${response.status}). Please try again.`);
        return;
      }

      const role = result?.user?.role;
      let targetPath = "/";
      if (role === "ADMIN") targetPath = "/admin/dashboard";
      else if (role === "TEACHER") targetPath = "/teacher/dashboard";
      else if (role === "STUDENT") targetPath = "/student/dashboard";

      window.location.href = targetPath;
    } catch {
      setError("Unable to connect to the authentication server. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Dynamic Background Atmosphere */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 h-[36rem] w-[36rem] rounded-full bg-violet-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-[28rem] w-[28rem] rounded-full bg-cyan-600/10 blur-[130px]" />

      {/* Decorative Grid Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 shadow-2xl shadow-indigo-950/40 backdrop-blur-2xl lg:grid-cols-12">
          
          {/* Left Column: Brand & Showcase (Desktop) */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-10 lg:col-span-5 lg:flex border-r border-slate-800/70">
            {/* Soft Ambient Light inside card */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />

            {/* Top Brand Header */}
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-bold tracking-tight text-white">EduVanguard</h2>
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                      v2.4
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-widest text-indigo-300/80 font-medium">
                    Student Management System
                  </p>
                </div>
              </div>

              {/* Tagline */}
              <div className="mt-10 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Next-Generation Academic Platform</span>
                </div>
                <h1 className="text-3xl font-extrabold leading-snug tracking-tight text-white">
                  Empowering academic excellence and intelligence.
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Unified portal connecting administrators, educators, and students with real-time academic records, automated fee management, and performance insights.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Role-Based Access Control</h4>
                    <p className="text-[11px] text-slate-400">Granular permissions for Admin, Teachers, and Students</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 backdrop-blur-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Continuous Evaluation</h4>
                    <p className="text-[11px] text-slate-400">Real-time gradebook, term exams, and attendance logs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Card */}
            <div className="relative z-10 pt-8">
              <div className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-medium text-slate-300">EduVanguard Cloud Core</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                  99.9% Uptime
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In Form */}
          <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-7">
            <div>
              {/* Mobile Header */}
              <div className="mb-6 flex items-center justify-between lg:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/30">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">EduVanguard</h2>
                    <p className="text-[10px] tracking-wider uppercase text-indigo-400">SMS Portal</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>

              {/* Form Title & Subtitle */}
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Sign in to your portal
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  Enter your credentials to access your institutional workspace.
                </p>
              </div>

              {/* Quick Demo Fill Buttons */}
              <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-indigo-400" /> Quick Demo Sign-in:
                  </span>
                  {activeDemo && (
                    <span className="text-[11px] text-indigo-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {activeDemo} loaded
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => handleSelectDemo(account)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                        activeDemo === account.role
                          ? "border-indigo-500 bg-indigo-500/15 shadow-sm shadow-indigo-500/20 text-white"
                          : "border-slate-800/80 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="text-xs font-semibold">{account.role}</span>
                      <span className="text-[10px] text-slate-400 truncate w-full">
                        {account.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Notification Banner */}
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-rose-300 animate-in fade-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                  <div className="text-xs leading-relaxed">{error}</div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    Institutional Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@sms.edu"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition duration-200 focus:border-indigo-500 focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/15"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setError("To reset your password, please contact the institution system administrator.")
                      }
                      className="text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your security password"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 outline-none transition duration-200 focus:border-indigo-500 focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition hover:text-slate-200"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center pt-1 pb-1">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="text-xs text-slate-400 select-none">
                      Remember this workstation for 30 days
                    </span>
                  </label>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:brightness-110 hover:shadow-indigo-600/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Authenticating Portal Access...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Security & Assistance Footer */}
            <div className="mt-8 border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <span>Enterprise 256-bit Encrypted Session</span>
              </div>
              <p>
                Need assistance?{" "}
                <span className="text-slate-400 font-medium hover:text-indigo-300 transition-colors cursor-pointer">
                  IT Support Desk
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
