import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Lock } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [view, setView] = useState<"login" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const utils = trpc.useUtils();

  const login = trpc.auth.login.useMutation({
    onSuccess: () => { utils.auth.me.invalidate(); navigate("/admin"); },
    onError: e => toast.error(e.message),
  });

  const resetReq = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => setResetSent(true),
    onError: e => toast.error(e.message),
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    background: "var(--bg-overlay)",
    border: "1px solid var(--border-mid)",
    borderRadius: "var(--r-sm)",
    color: "var(--text-hi)", fontSize: "13px",
    outline: "none", transition: "border-color .15s, box-shadow .15s",
  };
  const focIn = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--accent)";
    e.target.style.boxShadow = "0 0 0 2px var(--accent-lo)";
  };
  const focOut = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--border-mid)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>

      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 flex-shrink-0"
        style={{ width: "360px", background: "var(--bg-raised)", borderRight: "1px solid var(--border)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl font-bold text-white"
            style={{ width: "38px", height: "38px", background: "var(--accent)", boxShadow: "0 0 20px var(--accent-glow)" }}>
            L
          </div>
          <div>
            <div className="font-bold" style={{ color: "var(--text-hi)" }}>LARF</div>
            <div className="text-xs" style={{ color: "var(--text-lo)" }}>Gestão de Projetos</div>
          </div>
        </div>

        {/* Copy */}
        <div>
          <div className="text-3xl font-bold tracking-tight mb-4 leading-tight" style={{ color: "var(--text-hi)" }}>
            Plataforma<br />interna de<br />gestão.
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-lo)" }}>
            Gerencie clientes, projetos, finanças e equipe em um só lugar. Acesso exclusivo.
          </p>
          <div className="mt-8 space-y-3">
            {["🔒 Acesso somente por convite", "🛡️ Sessões rastreadas", "📋 Audit log completo"].map(f => (
              <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-lo)" }}>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs" style={{ color: "var(--text-lo)" }}>
          LARF Marketing Negócios Digitais e Projetos Ltda
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div style={{ width: "100%", maxWidth: "360px" }}>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "var(--accent)", boxShadow: "0 0 20px var(--accent-glow)" }}>
              L
            </div>
            <div className="font-bold" style={{ color: "var(--text-hi)" }}>LARF — Gestão de Projetos</div>
          </div>

          {view === "login" ? (
            <div className="animate-fade">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-hi)" }}>Entrar</h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-lo)" }}>Acesso restrito a membros autorizados</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-lo)" }}>E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" autoComplete="email"
                    style={inputStyle} onFocus={focIn} onBlur={focOut}
                    onKeyDown={e => e.key === "Enter" && login.mutate({ email, password })} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-lo)" }}>Senha</label>
                    <button onClick={() => { setView("reset"); setResetEmail(email); }}
                      className="text-xs transition" style={{ color: "var(--accent)" }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                      Esqueci a senha
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" autoComplete="current-password"
                      style={{ ...inputStyle, paddingRight: "40px" }} onFocus={focIn} onBlur={focOut}
                      onKeyDown={e => e.key === "Enter" && login.mutate({ email, password })} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute transition"
                      style={{ right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-lo)" }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => login.mutate({ email: email.trim(), password })}
                  disabled={login.isPending || !email || !password}
                  className="w-full flex items-center justify-center gap-2 font-semibold transition rounded-lg"
                  style={{ padding: "10px 16px", background: "var(--accent)", color: "#fff", fontSize: "14px", opacity: login.isPending || !email || !password ? 0.6 : 1, marginTop: "4px" }}>
                  {login.isPending
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <ArrowRight size={15} />}
                  Entrar
                </button>
              </div>

              <div className="mt-5 flex items-start gap-2.5 p-3 rounded-lg text-xs"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)", color: "var(--text-lo)" }}>
                <Lock size={12} className="flex-shrink-0 mt-0.5" />
                <span>Sem conta? Entre em contato com a equipe LARF para receber um convite.</span>
              </div>
            </div>

          ) : (
            <div className="animate-fade">
              <button onClick={() => { setView("login"); setResetSent(false); }}
                className="flex items-center gap-1.5 text-xs mb-5 transition"
                style={{ color: "var(--text-lo)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-hi)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-lo)")}>
                ← Voltar
              </button>

              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-hi)" }}>Recuperar senha</h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-lo)" }}>Enviaremos instruções por e-mail</p>
              </div>

              {resetSent ? (
                <div className="p-4 rounded-lg text-sm animate-fade"
                  style={{ background: "var(--green-lo)", border: "1px solid rgba(16,185,129,.2)", color: "var(--green)" }}>
                  <div className="font-semibold mb-1">✓ E-mail enviado</div>
                  Se o endereço existir, você receberá as instruções em breve. Verifique também o spam.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-lo)" }}>E-mail</label>
                    <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                      placeholder="seu@email.com" style={inputStyle} onFocus={focIn} onBlur={focOut} />
                  </div>
                  <button onClick={() => resetReq.mutate({ email: resetEmail })}
                    disabled={resetReq.isPending || !resetEmail}
                    className="w-full flex items-center justify-center gap-2 font-semibold rounded-lg transition"
                    style={{ padding: "10px 16px", background: "var(--accent)", color: "#fff", fontSize: "14px", opacity: resetReq.isPending ? 0.7 : 1 }}>
                    {resetReq.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Enviar instruções
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
