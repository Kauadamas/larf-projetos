import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  Lock, Mail, Eye, EyeOff, User, ArrowRight, Shield, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";

// ─── Password Strength Component ──────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ chars", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Lowercase", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["", "#ef4444", "#ef4444", "#eab308", "#eab308", "#22c55e"];
  const labels = ["", "Very weak", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-all"
            style={{ background: i <= score ? colors[score] : "rgba(100,115,139,.2)" }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold"
          style={{ color: colors[score] }}
        >
          {labels[score]}
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {checks.map(c => (
            <span
              key={c.label}
              className="text-xs flex items-center gap-1"
              style={{ color: c.ok ? "#22c55e" : "var(--muted)" }}
            >
              {c.ok ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-current" />}
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div
        className="absolute top-1/3 right-0 w-96 h-96 rounded-full opacity-5 pointer-events-none"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          transform: "translate(50%, -50%)",
        }}
      />
      <div className="text-center space-y-4 relative z-10">
        <Loader2 size={32} className="mx-auto animate-spin" style={{ color: "var(--accent)" }} />
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Verifying invitation...
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({ msg }: { msg: string }) {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div
        className="absolute top-1/2 right-0 w-96 h-96 rounded-full opacity-5 pointer-events-none"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          transform: "translate(50%, -50%)",
        }}
      />
      <div className="text-center max-w-sm relative z-10">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(239,68,68,.1)" }}
        >
          <AlertCircle size={32} style={{ color: "#ef4444" }} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Invalid invitation</h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          {msg}
        </p>
        <button
          onClick={() => navigate("/login")}
          className="btn btn-primary"
        >
          <ArrowRight size={18} />
          Back to login
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  viewer: "Viewer",
  member: "Member",
  admin: "Administrator",
};

export default function AcceptInvite() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") || "";
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: invite, isLoading, error } = trpc.auth.validateInvite.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const accept = trpc.auth.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success("Account created! Welcome to LARF.");
      navigate("/admin");
    },
    onError: e => toast.error(e.message),
  });

  if (!token) return <ErrorScreen msg="No invitation token found in this link." />;
  if (isLoading) return <Spinner />;
  if (error) return <ErrorScreen msg={error.message} />;

  const pwMatch = !confirm || pw === confirm;
  const canSubmit =
    name.trim().length >= 2 &&
    pw.length >= 8 &&
    pw === confirm &&
    !accept.isPending;

  if (!mounted) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Decorative background */}
      <div
        className="absolute top-1/2 -right-32 w-96 h-96 rounded-full opacity-5 pointer-events-none"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          transform: "translate(0, -50%)",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="mb-8 animate-fade">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-smooth hover:scale-110"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, #00d9ff 100%)",
                color: "white",
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

        {/* Header */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            You were invited as{" "}
            <span className="font-semibold" style={{ color: "var(--accent)" }}>
              {ROLE_LABEL[invite?.role || "member"]}
            </span>
          </p>
        </div>

        {/* Form Container */}
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {/* Email - Read Only */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Email address
            </label>
            <div
              className="px-4 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-smooth"
              style={{
                background: "rgba(59,130,246,.05)",
                border: "1px solid rgba(59,130,246,.2)",
                color: "var(--muted)",
              }}
            >
              <Mail size={18} />
              <span>{invite?.email}</span>
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              Linked to your invitation and cannot be changed
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Full name
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted)" }}
              />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="How should we call you?"
                autoComplete="name"
                className="input pl-10"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted)" }}
              />
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                className="input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-smooth hover:opacity-70"
                style={{ color: "var(--muted)" }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <PasswordStrength password={pw} />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Confirm password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted)" }}
              />
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className="input pl-10"
                style={{
                  borderColor: !pwMatch ? "#ef4444" : undefined,
                }}
              />
            </div>
            {!pwMatch && (
              <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#ef4444" }}>
                <AlertCircle size={14} />
                Passwords don't match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={() =>
              accept.mutate({
                token,
                name,
                password: pw,
                passwordConfirm: confirm,
              })
            }
            disabled={!canSubmit}
            className="btn btn-primary w-full"
          >
            {accept.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <Shield size={18} />
                Create my account
              </>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div
          className="mt-8 p-4 rounded-lg border animate-fade"
          style={{
            animationDelay: "0.3s",
            background: "rgba(100,115,139,.05)",
            borderColor: "rgba(100,115,139,.2)",
            color: "var(--muted)",
          }}
        >
          <p className="text-xs leading-relaxed">
            <span className="font-semibold">Privacy notice:</span> This is a personal,
            non-transferable link. Do not share it with others.
          </p>
        </div>
      </div>
    </div>
  );
}
