import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Lock, Eye, EyeOff, Check } from "lucide-react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

// ─── Barra de força de senha ──────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ chars",   ok: password.length >= 8 },
    { label: "Maiúscula",  ok: /[A-Z]/.test(password) },
    { label: "Minúscula",  ok: /[a-z]/.test(password) },
    { label: "Número",     ok: /[0-9]/.test(password) },
    { label: "Especial",   ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score  = checks.filter(c => c.ok).length;
  const colors = ["","var(--red)","var(--red)","var(--yellow)","var(--yellow)","var(--green)"];
  const labels = ["","Muito fraca","Fraca","Razoável","Boa","Forte"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all"
            style={{ background: i <= score ? colors[score] : "var(--border)" }} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: colors[score] }}>{labels[score]}</span>
        <div className="flex flex-wrap justify-end gap-2">
          {checks.map(c => (
            <span key={c.label} className="text-xs flex items-center gap-0.5"
              style={{ color: c.ok ? "var(--green)" : "var(--text-lo)" }}>
              {c.ok ? <Check size={12} /> : <span className="text-xs">○</span>} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Telas auxiliares ─────────────────────────────────────────────────────────
function Spinner() {
  return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
    <div className="text-center space-y-3">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      <p className="text-sm" style={{ color: "var(--text-lo)" }}>Verificando convite...</p>
    </div>
  </div>;
}

function ErrorScreen({ msg }: { msg: string }) {
  const [, navigate] = useLocation();
  return <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
    <div className="text-center max-w-sm">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(192,57,43,.12)" }}><Lock size={28} style={{ color: "var(--accent)" }} /></div>
      <h2 className="text-xl font-bold mb-2">Link inválido</h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-lo)" }}>{msg}</p>
      <button onClick={() => navigate("/login")}
        className="px-6 py-2.5 rounded-lg text-sm font-bold text-white"
        style={{ background: "var(--accent)" }}>
        Ir para o login
      </button>
    </div>
  </div>;
}

// ─── Página principal ─────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  viewer: "Visualizador", member: "Membro", admin: "Administrador",
};

export default function AcceptInvite() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const token  = new URLSearchParams(search).get("token") || "";

  const [name,    setName]    = useState("");
  const [pw,      setPw]      = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw,  setShowPw]  = useState(false);

  const { data: invite, isLoading, error } = trpc.auth.validateInvite.useQuery(
    { token }, { enabled: !!token, retry: false }
  );

  const accept = trpc.auth.acceptInvite.useMutation({
    onSuccess: () => { toast.success("Conta criada! Bem-vindo(a) ao LARF."); navigate("/admin"); },
    onError:   e  => toast.error(e.message),
  });

  if (!token)    return <ErrorScreen msg="Nenhum token de convite encontrado neste link." />;
  if (isLoading) return <Spinner />;
  if (error)     return <ErrorScreen msg={error.message} />;

  const pwMatch  = !confirm || pw === confirm;
  const canSubmit = name.trim().length >= 2 && pw.length >= 8 && pw === confirm && !accept.isPending;

  const inputCls = "w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all";
  const inputSt  = { background: "var(--bg-overlay)", border: "1.5px solid var(--border)", color: "var(--text)" };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-xl"
            style={{ background: "var(--accent)", boxShadow: "0 0 28px rgba(192,57,43,.45)" }}>L</div>
          <h1 className="text-2xl font-bold tracking-tight">Criar sua conta</h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--text-lo)" }}>
            Você foi convidado como{" "}
            <strong style={{ color: "var(--accent)" }}>{ROLE_LABEL[invite?.role || "member"]}</strong>
          </p>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>

          {/* E-mail bloqueado */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-lo)" }}>E-mail</label>
            <div className="px-3 py-2.5 rounded-lg text-sm flex items-center gap-2"
              style={{ background: "var(--bg-overlay)", border: "1.5px solid var(--border)", color: "var(--text-lo)" }}>
              <Lock size={16} style={{ color: "var(--text-lo)" }} /><span>{invite?.email}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-lo)" }}>Vinculado ao convite — não pode ser alterado</p>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-lo)" }}>Seu nome *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Como você quer ser chamado(a)" autoComplete="name"
              className={inputCls} style={inputSt}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")}
              onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-lo)" }}>Senha *</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)}
                placeholder="Mínimo 8 caracteres" autoComplete="new-password"
                className={`${inputCls} pr-10`} style={inputSt}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e  => (e.target.style.borderColor = "var(--border)")} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm transition"
                style={{ color: "var(--text-lo)", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--orange)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-lo)")}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={pw} />
          </div>

          {/* Confirmar senha */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-lo)" }}>Confirmar senha *</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repita a senha" autoComplete="new-password"
              className={inputCls}
              style={{ ...inputSt, borderColor: !pwMatch ? "var(--red)" : "var(--border)" }}
              onFocus={e => (e.target.style.borderColor = !pwMatch ? "var(--red)" : "var(--accent)")}
              onBlur={e  => (e.target.style.borderColor = !pwMatch ? "var(--red)" : "var(--border)")} />
            {!pwMatch && <p className="text-xs mt-1" style={{ color: "var(--red)" }}>As senhas não conferem</p>}
          </div>

          <button
            onClick={() => accept.mutate({ token, name, password: pw, passwordConfirm: confirm })}
            disabled={!canSubmit}
            className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{ background: "var(--accent)", opacity: canSubmit ? 1 : 0.5 }}>
            {accept.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Criar minha conta
          </button>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "var(--text-lo)" }}>
          Este link é pessoal e intransferível. Não compartilhe com terceiros.
        </p>
      </div>
    </div>
  );
}
