import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Lock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

function PwBar({ pw }: { pw: string }) {
  const checks = [
    { label: "8+ caracteres",    ok: pw.length >= 8 },
    { label: "Maiúscula",        ok: /[A-Z]/.test(pw) },
    { label: "Minúscula",        ok: /[a-z]/.test(pw) },
    { label: "Número",           ok: /[0-9]/.test(pw) },
    { label: "Caractere especial",ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["","#ef4444","#f97316","#f59e0b","#84cc16","#10b981"];
  const labels = ["","Muito fraca","Fraca","Razoável","Boa","Forte"];
  if (!pw) return null;
  return (
    <div className="mt-2.5">
      <div className="flex gap-1 mb-2">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex-1 rounded-full transition" style={{ height:"4px", background: i<=score ? colors[score] : "var(--border-mid)" }}/>
        ))}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold" style={{ color: colors[score] }}>{labels[score]}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            {c.ok ? <CheckCircle size={11} color="var(--green)"/> : <XCircle size={11} color="var(--border-hi)"/>}
            <span style={{ color: c.ok ? "var(--green)" : "var(--text-lo)" }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="min-h-screen flex items-center justify-center" style={{ background:"var(--bg)" }}>
    <div className="text-center space-y-3">
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor:"var(--orange)", borderTopColor:"transparent" }}/>
      <p className="text-sm" style={{ color:"var(--text-lo)" }}>Verificando convite...</p>
    </div>
  </div>;
}

function ErrorScreen({ msg }: { msg: string }) {
  const [,navigate] = useLocation();
  return <div className="min-h-screen flex items-center justify-center p-4" style={{ background:"var(--bg)" }}>
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background:"var(--red-bg)", border:"1px solid rgba(239,68,68,.2)", color:"var(--red)" }}>
        <Lock size={24}/>
      </div>
      <h2 className="text-2xl font-extrabold mb-2" style={{ color:"var(--navy)" }}>Link inválido</h2>
      <p className="text-sm mb-6" style={{ color:"var(--text-lo)" }}>{msg}</p>
      <button onClick={()=>navigate("/login")}
        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition"
        style={{ background:"var(--orange)", boxShadow:"var(--shadow-orange)" }}>
        Ir para o login
      </button>
    </div>
  </div>;
}

const ROLE_LABEL: Record<string,string> = { viewer:"Visualizador", member:"Membro", admin:"Administrador" };

export default function AcceptInvite() {
  const [,navigate] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") || "";
  const [name,setName] = useState("");
  const [pw,setPw] = useState("");
  const [confirm,setConfirm] = useState("");
  const [showPw,setShowPw] = useState(false);

  const { data:invite, isLoading, error } = trpc.auth.validateInvite.useQuery({ token }, { enabled:!!token, retry:false });
  const accept = trpc.auth.acceptInvite.useMutation({
    onSuccess: () => { toast.success("Conta criada! Bem-vindo(a) ao LARF."); navigate("/admin"); },
    onError: e => toast.error(e.message),
  });

  if (!token) return <ErrorScreen msg="Nenhum token de convite encontrado neste link."/>;
  if (isLoading) return <Spinner/>;
  if (error) return <ErrorScreen msg={error.message}/>;

  const pwMatch = !confirm || pw === confirm;
  const canSubmit = name.trim().length >= 2 && pw.length >= 8 && pw === confirm && !accept.isPending;

  const inputSt: React.CSSProperties = {
    width:"100%", padding:"11px 14px",
    background:"var(--glass-hi)", border:"1.5px solid var(--border-mid)",
    borderRadius:"var(--r-md)", color:"var(--text)", fontSize:"13.5px",
    fontFamily:"var(--font)", outline:"none", transition:"border-color .15s, box-shadow .15s",
  };
  const fIn = (e:React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor="var(--orange)"; e.target.style.boxShadow="0 0 0 3px var(--orange-alpha)"; };
  const fOut = (e:React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor="var(--border-mid)"; e.target.style.boxShadow="none"; };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background:"var(--bg)" }}>
      <div style={{ width:"100%", maxWidth:"460px" }}>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg"
              style={{ background:"var(--orange)", boxShadow:"var(--shadow-orange)" }}>L</div>
            <div>
              <div className="font-extrabold text-base" style={{ color:"var(--navy)" }}>LARF</div>
              <div className="text-xs" style={{ color:"var(--text-lo)" }}>Plataforma de Gestão</div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card overflow-hidden animate-up">
          {/* Top bar */}
          <div className="px-7 py-5" style={{ background:"linear-gradient(135deg,var(--navy-lo),var(--navy))", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} color="var(--orange)"/>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color:"rgba(255,255,255,.5)" }}>Convite válido</span>
            </div>
            <h1 className="text-xl font-extrabold" style={{ color:"#fff" }}>Criar sua conta</h1>
            <p className="text-sm mt-0.5" style={{ color:"rgba(255,255,255,.55)" }}>
              Você foi convidado como <strong style={{ color:"var(--orange)" }}>{ROLE_LABEL[invite?.role||"member"]}</strong>
            </p>
          </div>

          {/* Form */}
          <div className="p-7 space-y-5">
            {/* Email locked */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color:"var(--text-lo)" }}>E-mail</label>
              <div className="flex items-center gap-2 px-3.5 py-3 rounded-lg"
                style={{ background:"var(--navy-alpha)", border:"1.5px solid var(--border)", color:"var(--text-mid)", fontSize:"13.5px" }}>
                <Lock size={13} style={{ color:"var(--text-lo)" }}/>
                <span>{invite?.email}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background:"var(--navy-alpha)", color:"var(--text-lo)", border:"1px solid var(--border)" }}>
                  Fixo
                </span>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color:"var(--text-lo)" }}>
                Seu nome <span style={{ color:"var(--orange)" }}>*</span>
              </label>
              <input value={name} onChange={e=>setName(e.target.value)}
                placeholder="Como você quer ser chamado(a)"
                style={inputSt} onFocus={fIn} onBlur={fOut}/>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color:"var(--text-lo)" }}>
                Senha <span style={{ color:"var(--orange)" }}>*</span>
              </label>
              <div className="relative">
                <input type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  style={{ ...inputSt, paddingRight:"44px" }} onFocus={fIn} onBlur={fOut}/>
                <button type="button" onClick={()=>setShowPw(!showPw)}
                  className="absolute transition"
                  style={{ right:"13px", top:"50%", transform:"translateY(-50%)", color:"var(--text-lo)" }}
                  onMouseEnter={e=>(e.currentTarget.style.color="var(--navy)")}
                  onMouseLeave={e=>(e.currentTarget.style.color="var(--text-lo)")}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              <PwBar pw={pw}/>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color:"var(--text-lo)" }}>
                Confirmar senha <span style={{ color:"var(--orange)" }}>*</span>
              </label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
                placeholder="Repita a senha"
                style={{ ...inputSt, borderColor: !pwMatch ? "var(--red)" : "var(--border-mid)" }}
                onFocus={fIn} onBlur={e=>{ e.target.style.borderColor=!pwMatch?"var(--red)":"var(--border-mid)"; e.target.style.boxShadow="none"; }}/>
              {!pwMatch && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color:"var(--red)" }}>
                  <AlertCircle size={12}/> As senhas não conferem
                </div>
              )}
            </div>

            {/* Submit */}
            <button onClick={()=>accept.mutate({token,name,password:pw,passwordConfirm:confirm})}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2.5 font-bold transition rounded-xl"
              style={{ padding:"13px 20px", background:"var(--orange)", color:"#fff", fontSize:"15px", opacity:canSubmit?1:.5, boxShadow:canSubmit?"var(--shadow-orange)":"none" }}
              onMouseEnter={e=>{if(canSubmit)(e.currentTarget as HTMLElement).style.background="var(--orange-lo)"}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="var(--orange)"}}>
              {accept.isPending ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <ArrowRight size={18}/>}
              Criar minha conta
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color:"var(--text-lo)" }}>
          Este link é pessoal e expira em 48 horas. Não compartilhe com terceiros.
        </p>
      </div>
    </div>
  );
}
