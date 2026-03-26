import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { 
  Lock, Mail, Eye, EyeOff, ArrowRight, Shield, CheckCircle2, 
  Activity, LogIn 
} from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [view, setView] = useState<"login" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const utils = trpc.useUtils();

  useEffect(() => {
    setMounted(true);
  }, []);

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      try {
        await utils.auth.me.refetch();
      } catch (err) {
        console.error("[Login] Erro ao refetch auth.me:", err);
      }
      navigate("/admin");
    },
    onError: e => {
      toast.error(e.message, {
        description: "Verifique suas credenciais e tente novamente.",
      });
    },
  });

  const resetReq = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => setResetSent(true),
    onError: e => toast.error(e.message),
  });

  const Field = ({ 
    label, 
    children, 
    extra 
  }: { 
    label: string; 
    children: React.ReactNode; 
    extra?: React.ReactNode 
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
        {extra}
      </div>
      {children}
    </div>
  );

  const Feature = ({ icon: Icon, title, description }: any) => (
    <div className="flex gap-4 group" style={{ opacity: mounted ? 1 : 0 }}>
      <div 
        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-smooth group-hover:scale-110"
        style={{ background: "rgba(59,130,246,.1)", color: "var(--accent)" }}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold mb-1">{title}</h3>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {description}
        </p>
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* ═══════════════════════════════════════════════════════════════════ 
          PAINEL ESQUERDO - DESKTOP
          ═══════════════════════════════════════════════════════════════════ */}
      <div 
        className="hidden lg:flex flex-col justify-between w-96 p-12 flex-shrink-0 relative overflow-hidden"
        style={{ background: "var(--surface)" }}
      >
        {/* Decorative elements */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          }}
        />
        
        <div className="relative z-10 space-y-12">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-smooth hover:scale-110"
              style={{ 
                background: "linear-gradient(135deg, var(--accent) 0%, #00d9ff 100%)",
                color: "white"
              }}
            >
              L
            </div>
            <div>
              <div className="font-bold text-base">LARF</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                Project Management
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-4xl font-bold leading-tight">
              Manage projects with precision.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              The exclusive platform for LARF teams and project stakeholders. 
              Secure access, real-time collaboration, complete transparency.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Feature
              icon={Shield}
              title="Invite-only access"
              description="No public registration. Exclusive to invited members."
            />
            <Feature
              icon={Activity}
              title="Session tracking"
              description="Revoke sessions, monitor activity in real-time."
            />
            <Feature
              icon={CheckCircle2}
              title="Complete audit log"
              description="Every action recorded for accountability."
            />
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs z-10" style={{ color: "var(--muted)" }}>
          © 2026 LARF Marketing & Digital Business
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ 
          PAINEL DIREITO - FORMULÁRIO
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background */}
        <div 
          className="absolute top-1/2 right-0 w-96 h-96 rounded-full opacity-5 pointer-events-none"
          style={{
            background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
            transform: "translate(50%, -50%)",
          }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 animate-fade">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ 
                  background: "linear-gradient(135deg, var(--accent) 0%, #00d9ff 100%)",
                  color: "white"
                }}
              >
                L
              </div>
              <div>
                <div className="font-bold text-sm">LARF</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  Project Management
                </div>
              </div>
            </div>
          </div>

          {view === "login" ? (
            <div className="animate-fade">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Sign in to access your projects
                </p>
              </div>

              {/* Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  login.mutate({ email, password });
                }}
                className="space-y-6 mb-6"
              >
                <Field label="Email address">
                  <div className="relative">
                    <Mail 
                      size={18} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 transition-smooth"
                      style={{ color: "var(--muted)" }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                      className="input pl-10"
                      autoFocus
                    />
                  </div>
                </Field>

                <Field
                  label="Password"
                  extra={
                    <button
                      type="button"
                      onClick={() => {
                        setView("reset");
                        setResetEmail(email);
                      }}
                      className="text-xs font-medium transition-smooth hover:opacity-70"
                      style={{ color: "var(--accent)" }}
                    >
                      Forgot password?
                    </button>
                  }
                >
                  <div className="relative">
                    <Lock 
                      size={18} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 transition-smooth"
                      style={{ color: "var(--muted)" }}
                    />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="input pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-smooth hover:opacity-70"
                      style={{ color: "var(--muted)" }}
                    >
                      {showPw ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={login.isPending || !email || !password}
                  className="btn btn-primary w-full"
                >
                  {login.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Sign in
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Info Box */}
              <div 
                className="p-4 rounded-lg border transition-smooth"
                style={{ 
                  background: "rgba(59,130,246,.05)",
                  borderColor: "rgba(59,130,246,.2)",
                  color: "var(--muted)"
                }}
              >
                <p className="text-xs leading-relaxed">
                  <span className="font-semibold">No account?</span> Contact the LARF team 
                  to receive a personalized invite.
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-fade">
              {/* Back Button */}
              <button
                onClick={() => {
                  setView("login");
                  setResetSent(false);
                }}
                className="flex items-center gap-2 text-sm mb-8 transition-smooth hover:opacity-70"
                style={{ color: "var(--muted)" }}
              >
                <ArrowRight size={16} className="rotate-180" />
                Back to login
              </button>

              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Reset password</h1>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  We'll send you a link to reset your password
                </p>
              </div>

              {resetSent ? (
                <div 
                  className="p-4 rounded-lg border space-y-2 animate-slide-up"
                  style={{ 
                    background: "rgba(16,185,129,.05)",
                    borderColor: "rgba(16,185,129,.2)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} style={{ color: "var(--green)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>
                      Check your email
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    If an account exists with this email, we've sent 
                    password reset instructions. Check your spam folder if needed.
                  </p>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    resetReq.mutate({ email: resetEmail });
                  }}
                  className="space-y-6"
                >
                  <Field label="Email address">
                    <div className="relative">
                      <Mail 
                        size={18} 
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--muted)" }}
                      />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="input pl-10"
                        autoFocus
                      />
                    </div>
                  </Field>

                  <button
                    type="submit"
                    disabled={resetReq.isPending || !resetEmail}
                    className="btn btn-primary w-full"
                  >
                    {resetReq.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={18} />
                        Send reset link
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
