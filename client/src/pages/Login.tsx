import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [view, setView]       = useState<"login" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent]   = useState(false);
  const utils = trpc.useUtils();

  const login = trpc.auth.login.useMutation({
    onSuccess: () => { utils.auth.me.invalidate(); navigate("/admin"); },
    onError: e => toast.error(e.message),
  });

  const resetReq = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => setResetSent(true),
    onError:   e => toast.error(e.message),
  });

  const Field = ({ label, children, extra }: { label: string; children: React.ReactNode; extra?: React.ReactNode }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted2)" }}>{label}</label>
        {extra}
      </div>
      {children}
    </div>
  );

  const baseInput = "w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all";
  const inputStyle = { background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text)" };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* ── Painel esquerdo ── */}
      <div className="hidden lg:flex flex-col justify-between w-96 p-10 flex-shrink-0"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black"
            style={{ background: "var(--accent)", boxShadow: "0 0 18px rgba(192,57,43,.4)" }}>L</div>
          <div>
            <div className="font-bold text-sm">LARF</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>Gestão de Projetos</div>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold leading-tight">Plataforma interna de gestão.</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Acesso exclusivo para membros da equipe LARF e clientes diretamente envolvidos nos projetos.
          </p>
          <div className="space-y-3">
            {[
              { icon: "🔐", text: "Acesso por convite — sem registro público" },
              { icon: "🛡️", text: "Sessões rastreadas e revogáveis" },
              { icon: "📋", text: "Log completo de atividades" },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 text-sm" style={{ color: "var(--muted)" }}>
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>LARF Marketing Negócios Digitais Ltda</p>
      </div>

      {/* ── Formulário ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-black text-lg"
              style={{ background: "var(--accent)", boxShadow: "0 0 20px rgba(192,57,43,.4)" }}>L</div>
            <div className="font-bold">LARF — Gestão de Projetos</div>
          </div>

          {view === "login" ? (
            <>
              <div className="mb-7">
                <h1 className="text-xl font-bold">Entrar na plataforma</h1>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Acesso exclusivo a membros autorizados</p>
              </div>

              <div className="space-y-4">
                <Field label="E-mail">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" autoComplete="email"
                    className={baseInput} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                    onKeyDown={e => e.key === "Enter" && login.mutate({ email, password })} />
                </Field>

                <Field label="Senha" extra={
                  <button onClick={() => { setView("reset"); setResetEmail(email); }}
                    className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                    Esqueci a senha
                  </button>
                }>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" autoComplete="current-password"
                      className={`${baseInput} pr-10`} style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                      onKeyDown={e => e.key === "Enter" && login.mutate({ email, password })} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: "var(--muted)" }}>
                      {showPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </Field>

                <button onClick={() => login.mutate({ email: email.trim(), password })}
                  disabled={login.isPending || !email || !password}
                  className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: "var(--accent)", opacity: login.isPending || !email || !password ? 0.6 : 1 }}>
                  {login.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Entrar
                </button>
              </div>

              <div className="mt-6 p-3 rounded-lg flex items-start gap-2 text-xs"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                <span className="flex-shrink-0">🔒</span>
                <span>Sem conta? Entre em contato com a equipe LARF para receber um convite personalizado.</span>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => { setView("login"); setResetSent(false); }}
                className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
                style={{ color: "var(--muted)" }}>
                ← Voltar ao login
              </button>

              <div className="mb-7">
                <h1 className="text-xl font-bold">Recuperar senha</h1>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Enviaremos um link para redefinir</p>
              </div>

              {resetSent ? (
                <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.2)", color: "var(--green)" }}>
                  <div className="font-bold mb-1">✓ Solicitação enviada</div>
                  Se o e-mail existir em nossa base, você receberá as instruções em breve. Verifique também a caixa de spam.
                </div>
              ) : (
                <div className="space-y-4">
                  <Field label="E-mail cadastrado">
                    <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className={baseInput} style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
                  </Field>
                  <button onClick={() => resetReq.mutate({ email: resetEmail })}
                    disabled={resetReq.isPending || !resetEmail}
                    className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: "var(--accent)", opacity: resetReq.isPending ? 0.7 : 1 }}>
                    {resetReq.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Enviar instruções
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
