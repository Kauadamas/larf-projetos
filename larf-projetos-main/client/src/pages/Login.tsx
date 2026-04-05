import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Lock, Shield, Users, BarChart3 } from "lucide-react";

function Feature({ icon: Icon, text }: { icon: React.ComponentType<any>; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,122,0,.15)", color: "var(--orange)" }}>
        <Icon size={14} />
      </div>
      <span className="text-sm" style={{ color: "rgba(255,255,255,.6)" }}>{text}</span>
    </div>
  );
}

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

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "12px 16px",
    background: "rgba(255,255,255,.08)", border: "1.5px solid rgba(255,255,255,.12)",
    borderRadius: "var(--r-md)", color: "#fff", fontSize: "14px", fontFamily: "var(--font)",
    outline: "none", transition: "border-color .15s, box-shadow .15s",
  };
  const fIn = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--orange)";
    e.target.style.boxShadow = "0 0 0 3px rgba(255,122,0,.18)";
    e.target.style.background = "rgba(255,255,255,.11)";
  };
  const fOut = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,.12)";
    e.target.style.boxShadow = "none";
    e.target.style.background = "rgba(255,255,255,.08)";
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: "var(--bg)" }}>

      {/* ── Left — Navy brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between flex-shrink-0"
        style={{
          width: "420px",
          background: "linear-gradient(160deg, var(--navy-lo) 0%, var(--navy) 60%, #243060 100%)",
          padding: "48px 44px",
          position: "relative", overflow: "hidden",
        }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:"-60px", right:"-60px", width:"240px", height:"240px", borderRadius:"50%", background:"rgba(255,122,0,.07)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"-80px", left:"-40px", width:"280px", height:"280px", borderRadius:"50%", background:"rgba(255,122,0,.05)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"40%", right:"-30px", width:"120px", height:"120px", borderRadius:"50%", border:"1px solid rgba(255,255,255,.06)", pointerEvents:"none" }}/>

        {/* Logo */}
        <div>
          <img src="/assets/larflogo.svg" alt="LARF"
            style={{ height: "30px", width: "auto", filter: "brightness(0) invert(1)", objectFit:"contain" }} />
          <div className="text-xs mt-1 font-semibold uppercase tracking-widest" style={{ color:"rgba(255,255,255,.35)" }}>
            Plataforma de Gestão
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight" style={{ color:"#fff" }}>
              Gestão completa<br/>em um só lugar.
            </h1>
            <p className="text-sm mt-4 leading-relaxed" style={{ color:"rgba(255,255,255,.52)" }}>
              Clientes, projetos, finanças e equipe. Acesso restrito a membros autorizados da LARF.
            </p>
          </div>
          <div className="space-y-3">
            <Feature icon={Shield} text="Acesso exclusivo por convite" />
            <Feature icon={Users}  text="Gestão completa de projetos" />
            <Feature icon={BarChart3} text="Relatórios financeiros em tempo real" />
          </div>
        </div>

        <div className="text-xs" style={{ color:"rgba(255,255,255,.25)" }}>
          LARF Marketing Negócios Digitais e Projetos Ltda
        </div>
      </div>

      {/* ── Right — Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8" style={{ background:"var(--bg)" }}>
        <div style={{ width:"100%", maxWidth:"380px" }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black"
              style={{ background:"var(--orange)", fontSize:"16px", boxShadow:"var(--shadow-orange)" }}>L</div>
            <div>
              <div className="font-bold text-base" style={{ color:"var(--navy)" }}>LARF</div>
              <div className="text-xs" style={{ color:"var(--text-lo)" }}>Plataforma de Gestão</div>
            </div>
          </div>

          {view === "login" ? (
            <div className="animate-up">
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight" style={{ color:"var(--navy)" }}>Entrar</h2>
                <p className="text-sm mt-1.5" style={{ color:"var(--text-lo)" }}>Acesso restrito a membros autorizados</p>
              </div>

              <div className="glass-card p-7 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color:"var(--text-lo)" }}>E-mail</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    placeholder="seu@email.com" autoComplete="email"
                    style={{ ...inputSt, color:"var(--text)", background:"var(--glass-hi)", border:"1.5px solid var(--border-mid)" }}
                    onFocus={e=>{e.target.style.borderColor="var(--orange)";e.target.style.boxShadow="0 0 0 3px var(--orange-alpha)"}}
                    onBlur={e=>{e.target.style.borderColor="var(--border-mid)";e.target.style.boxShadow="none"}}
                    onKeyDown={e=>e.key==="Enter"&&login.mutate({email,password})} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color:"var(--text-lo)" }}>Senha</label>
                    <button onClick={()=>{setView("reset");setResetEmail(email)}}
                      className="text-xs font-semibold transition focus-visible:outline-none" style={{ color:"var(--orange)" }}
                      onMouseEnter={e=>(e.currentTarget.style.color="var(--orange-lo)")}
                      onMouseLeave={e=>(e.currentTarget.style.color="var(--orange)")}>
                      Esqueci a senha
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                      placeholder="••••••••" autoComplete="current-password"
                      style={{ ...inputSt, paddingRight:"44px", color:"var(--text)", background:"var(--glass-hi)", border:"1.5px solid var(--border-mid)" }}
                      onFocus={e=>{e.target.style.borderColor="var(--orange)";e.target.style.boxShadow="0 0 0 3px var(--orange-alpha)"}}
                      onBlur={e=>{e.target.style.borderColor="var(--border-mid)";e.target.style.boxShadow="none"}}
                      onKeyDown={e=>e.key==="Enter"&&login.mutate({email:email.trim(),password})} />
                    <button type="button" onClick={()=>setShowPw(!showPw)}
                      className="absolute transition focus-visible:outline-none"
                      style={{ right:"14px", top:"50%", transform:"translateY(-50%)", color:"var(--text-lo)" }}
                      onMouseEnter={e=>(e.currentTarget.style.color="var(--navy)")}
                      onMouseLeave={e=>(e.currentTarget.style.color="var(--text-lo)")}>
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                <button onClick={()=>login.mutate({email:email.trim(),password})}
                  disabled={login.isPending||!email||!password}
                  className="w-full flex items-center justify-center gap-2.5 font-bold transition rounded-xl focus-visible:outline-none"
                  style={{ padding:"13px 20px", background:"var(--orange)", color:"#fff", fontSize:"15px", opacity:login.isPending||!email||!password ? .55 : 1, boxShadow: login.isPending||!email||!password ? "none" : "var(--shadow-orange)" }}
                  onMouseEnter={e=>{if(!login.isPending&&email&&password)(e.currentTarget as HTMLElement).style.background="var(--orange-lo)"}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="var(--orange)"}}>
                  {login.isPending ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <ArrowRight size={18}/>}
                  Entrar na plataforma
                </button>
              </div>

              <div className="mt-5 flex items-start gap-2.5 p-4 rounded-xl text-xs"
                style={{ background:"var(--navy-alpha)", border:"1px solid var(--border)", color:"var(--text-lo)" }}>
                <Lock size={13} className="flex-shrink-0 mt-0.5" />
                <span>Sem acesso? Entre em contato com a equipe LARF para receber um convite personalizado.</span>
              </div>
            </div>

          ) : (
            <div className="animate-up">
              <button onClick={()=>{setView("login");setResetSent(false)}}
                className="flex items-center gap-1.5 text-sm font-semibold mb-6 transition focus-visible:outline-none"
                style={{ color:"var(--text-lo)" }}
                onMouseEnter={e=>(e.currentTarget.style.color="var(--navy)")}
                onMouseLeave={e=>(e.currentTarget.style.color="var(--text-lo)")}>
                ← Voltar ao login
              </button>
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold tracking-tight" style={{ color:"var(--navy)" }}>Recuperar senha</h2>
                <p className="text-sm mt-1.5" style={{ color:"var(--text-lo)" }}>Enviaremos instruções por e-mail</p>
              </div>

              {resetSent ? (
                <div className="p-5 rounded-xl animate-up"
                  style={{ background:"var(--green-bg)", border:"1px solid rgba(16,185,129,.22)", color:"#047857" }}>
                  <div className="font-bold mb-1 flex items-center gap-2"><span style={{ fontSize:"18px" }}>✓</span> E-mail enviado!</div>
                  <p className="text-sm leading-relaxed" style={{ color:"var(--text-mid)" }}>
                    Se o endereço existir na nossa base, você receberá as instruções em breve. Verifique também a caixa de spam.
                  </p>
                </div>
              ) : (
                <div className="glass-card p-7 space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color:"var(--text-lo)" }}>E-mail cadastrado</label>
                    <input type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)}
                      placeholder="seu@email.com"
                      style={{ ...inputSt, color:"var(--text)", background:"var(--glass-hi)", border:"1.5px solid var(--border-mid)" }}
                      onFocus={e=>{e.target.style.borderColor="var(--orange)";e.target.style.boxShadow="0 0 0 3px var(--orange-alpha)"}}
                      onBlur={e=>{e.target.style.borderColor="var(--border-mid)";e.target.style.boxShadow="none"}} />
                  </div>
                  <button onClick={()=>resetReq.mutate({email:resetEmail})}
                    disabled={resetReq.isPending||!resetEmail}
                    className="w-full flex items-center justify-center gap-2 font-bold rounded-xl transition focus-visible:outline-none"
                    style={{ padding:"13px 20px", background:"var(--orange)", color:"#fff", fontSize:"15px", opacity:resetReq.isPending ? .6 : 1, boxShadow:"var(--shadow-orange)" }}>
                    {resetReq.isPending && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
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
