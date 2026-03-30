import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { X, Search, TrendingUp, TrendingDown, Plus, Check, AlertCircle, Info, Rocket, CheckCircle2, DollarSign, Users, FileText, Eye, Edit2, Trash2, Clock, Calendar, FileCheck, BarChart3 } from "lucide-react";
import { getBadgeClass, getBadgeLabel } from "../lib/utils";

export { Edit2, Trash2, AlertCircle };

export function Badge({ status, label }: { status: string; label?: string }) {
  return <span className={`badge badge-${getBadgeClass(status)}`}>{label || getBadgeLabel(status)}</span>;
}

type BV = "primary"|"navy"|"secondary"|"danger"|"success"|"ghost"|"outline";
type BS = "xs"|"sm"|"md"|"lg";
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: BV; size?: BS; loading?: boolean; icon?: ReactNode; }

const BVS: Record<BV, React.CSSProperties> = {
  primary:   { background:"var(--orange)", color:"#fff", border:"1px solid var(--orange)", boxShadow:"0 2px 12px rgba(255,122,0,.32)" },
  navy:      { background:"var(--navy)",   color:"#fff", border:"1px solid var(--navy)",   boxShadow:"0 2px 12px rgba(47,55,88,.28)" },
  secondary: { background:"var(--glass-hi)",color:"var(--text)", border:"1px solid var(--border-mid)", boxShadow:"var(--shadow-xs)" },
  danger:    { background:"var(--red-bg)", color:"#b91c1c", border:"1px solid rgba(239,68,68,.22)" },
  success:   { background:"var(--green-bg)", color:"#047857", border:"1px solid rgba(16,185,129,.22)" },
  ghost:     { background:"transparent",   color:"var(--text-mid)", border:"1px solid transparent" },
  outline:   { background:"transparent",   color:"var(--navy)",     border:"1px solid var(--border-mid)" },
};
const BSS: Record<BS, string> = {
  xs:"px-2 py-1 text-xs rounded text-xs", sm:"px-3 py-2 text-sm rounded-md",
  md:"px-4 py-2.5 text-base rounded-lg", lg:"px-6 py-3 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, BtnProps>(({ variant="secondary", size="sm", loading, icon, children, style, className, ...rest }, ref) => (
  <button ref={ref}
    className={`inline-flex items-center gap-2 font-semibold transition select-none ${BSS[size]} ${className||""}`}
    style={{ ...BVS[variant], opacity: loading||rest.disabled ? .55 : 1, ...style }}
    disabled={loading||rest.disabled} {...rest}>
    {loading ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/> : icon}
    {children}
  </button>
));
Button.displayName = "Button";

export function IconButton({ children, title, onClick, variant="ghost", className }: { children:ReactNode; title?:string; onClick?:()=>void; variant?:BV; className?:string }) {
  return (
    <button onClick={onClick} title={title}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition ${className||""}`}
      style={{ ...BVS[variant], padding:0 }}>
      {children}
    </button>
  );
}

export function Card({ children, className, style, hover }: { children:ReactNode; className?:string; style?:React.CSSProperties; hover?:boolean }) {
  return (
    <div className={`glass-card overflow-hidden ${hover?"transition cursor-pointer":""} ${className||""}`}
      style={style}
      onMouseEnter={hover ? e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow="var(--shadow-lg)"; el.style.transform="translateY(-2px)"; } : undefined}
      onMouseLeave={hover ? e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow="var(--shadow-sm)"; el.style.transform=""; } : undefined}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children:ReactNode; className?:string }) {
  return <div className={`flex items-center justify-between px-5 py-3.5 ${className||""}`} style={{ borderBottom:"1px solid var(--border)", background:"rgba(47,55,88,.02)" }}>{children}</div>;
}
export function CardTitle({ children, size="sm" }: { children:ReactNode; size?:"sm"|"md" }) {
  return <div className={`font-bold ${size==="md"?"text-xl":"text-base"}`} style={{ color:"var(--navy)" }}>{children}</div>;
}
export function CardBody({ children, className, noPad }: { children:ReactNode; className?:string; noPad?:boolean }) {
  return <div className={`${noPad?"":"px-5 py-4"} ${className||""}`}>{children}</div>;
}

export function KpiCard({ label, value, sub, color="var(--orange)", icon, trend }: { label:string; value:string|number; sub?:string; color?:string; icon?:ReactNode; trend?:number }) {
  return (
    <div className="glass-card p-3 md:p-5 relative overflow-hidden transition"
      onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.boxShadow="var(--shadow-lg)";el.style.transform="translateY(-3px)"}}
      onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.boxShadow="var(--shadow-sm)";el.style.transform=""}}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background:color, borderRadius:"12px 12px 0 0" }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"70px", background:`linear-gradient(to bottom,${color}09,transparent)`, pointerEvents:"none" }}/>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-widest mb-1 md:mb-3" style={{ color:"var(--text-lo)" }}>{label}</div>
          <div className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono" style={{ color:"var(--navy)" }}>{value}</div>
          {sub && <div className="text-xs mt-1" style={{ color:"var(--text-lo)" }}>{sub}</div>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-bold mt-1 md:mt-2 ${trend>=0?"text-green":"text-red"}`}>
              {trend>=0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        {icon && <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${color}14`, color }}>{icon}</div>}
      </div>
    </div>
  );
}

export function Table({ children }: { children:ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full" style={{ borderCollapse:"collapse" }}>{children}</table></div>;
}
export function Th({ children, right }: { children:ReactNode; right?:boolean }) {
  return <th className={`px-4 py-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap ${right?"text-right":"text-left"}`} style={{ color:"var(--text-lo)", borderBottom:"1px solid var(--border)", background:"rgba(47,55,88,.025)" }}>{children}</th>;
}
export function Tr({ children, onClick, className }: { children:ReactNode; onClick?:()=>void; className?:string }) {
  return (
    <tr className={`transition ${onClick?"cursor-pointer":""} ${className||""}`}
      style={{ borderBottom:"1px solid var(--border)" }}
      onClick={onClick}
      onMouseEnter={e=>{if(onClick)(e.currentTarget as HTMLElement).style.background="rgba(255,122,0,.03)"}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=""}}>
      {children}
    </tr>
  );
}
export function Td({ children, className, right, mono }: { children:ReactNode; className?:string; right?:boolean; mono?:boolean }) {
  return <td className={`px-4 py-3.5 ${right?"text-right":""} ${mono?"font-mono":""} ${className||""}`} style={{ fontSize:"13px" }}>{children}</td>;
}

const inputBase: React.CSSProperties = {
  background:"var(--glass-hi)", border:"1.5px solid var(--border-mid)", borderRadius:"var(--r-sm)",
  color:"var(--text)", fontSize:"13px", fontFamily:"var(--font)", outline:"none", width:"100%",
  padding:"10px 14px", transition:"border-color .15s, box-shadow .15s",
};
const onFocusIn  = (e:React.FocusEvent<any>) => { e.target.style.borderColor="var(--orange)"; e.target.style.boxShadow="0 0 0 3px var(--orange-alpha)"; };
const onFocusOut = (e:React.FocusEvent<any>) => { e.target.style.borderColor="var(--border-mid)"; e.target.style.boxShadow="none"; };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ style, ...props }, ref) => <input ref={ref} style={{ ...inputBase, ...style }} onFocus={onFocusIn} onBlur={onFocusOut} {...props}/>
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>&{children:ReactNode}>(
  ({ style, children, ...props }, ref) => <select ref={ref} style={{ ...inputBase, ...style }} onFocus={onFocusIn} onBlur={onFocusOut} {...props}>{children}</select>
);
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ style, ...props }, ref) => <textarea ref={ref} style={{ ...inputBase, minHeight:"88px", resize:"vertical", ...style }} onFocus={onFocusIn} onBlur={onFocusOut} {...props}/>
);
Textarea.displayName = "Textarea";

export function FormGroup({ label, children, hint, required, error }: { label:string; children:ReactNode; hint?:string; required?:boolean; error?:string }) {
  const hasError = !!error;
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest" style={{ color:"var(--text-lo)" }}>
        {label}{required && <span style={{ color:"var(--orange)" }}>*</span>}
      </label>
      <div style={{ borderColor: hasError ? "#ef4444" : "transparent" }}>
        {children}
      </div>
      {hasError ? (
        <div className="flex items-center gap-1 text-xs font-medium" style={{ color:"#ef4444" }}>
          <AlertCircle size={12}/>
          {error}
        </div>
      ) : hint ? (
        <p className="text-xs" style={{ color:"var(--text-lo)" }}>{hint}</p>
      ) : null}
    </div>
  );
}

// FormGrid for responsive form layouts - mobile: 1 col, tablet: 2 col, desktop: var cols
export function FormGrid({ children, cols=2 }: { children:ReactNode; cols?: 1|2|3|4 }) {
  const gridClass = `grid grid-cols-1 ${cols>=2?"md:grid-cols-2":""} ${cols>=3?"lg:grid-cols-3":""} ${cols>=4?"2xl:grid-cols-4":""} gap-4`;
  return <div className={gridClass}>{children}</div>;
}

interface ModalProps { open:boolean; onClose:()=>void; title:string; children:ReactNode; footer?:ReactNode; size?:"sm"|"md"|"lg"|"xl"; subtitle?:string }
export function Modal({ open, onClose, title, subtitle, children, footer, size="md" }: ModalProps) {
  if (!open) return null;
  
  // Responsive size: full width on mobile, fixed width on desktop
  const maxW = { sm:"400px", md:"540px", lg:"700px", xl:"860px" };
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const responsiveSize = isMobile ? "100%" : maxW[size];
  const mobilePadding = isMobile ? "p-3" : "p-4";
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade"
      style={{ background:"rgba(47,55,88,.5)", backdropFilter:"blur(10px)" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="w-full rounded-2xl overflow-hidden animate-up flex flex-col"
        style={{ maxWidth:responsiveSize, maxHeight:isMobile ? "95vh" : "90vh", background:"var(--glass-hi)", border:"1px solid var(--glass-border)", boxShadow:"var(--shadow-xl)", backdropFilter:"blur(24px)" }}>
        <div className={`flex items-start justify-between flex-shrink-0 ${isMobile ? "px-4 py-3.5" : "px-6 py-5"}`} style={{ borderBottom:"1px solid var(--border)", background:"linear-gradient(135deg,rgba(47,55,88,.03),rgba(255,122,0,.025))" }}>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold ${isMobile ? "text-lg" : "text-xl"}`} style={{ color:"var(--navy)" }}>{title}</h3>
            {subtitle && <p className="text-xs mt-0.5" style={{ color:"var(--text-lo)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition ml-4 flex-shrink-0"
            style={{ color:"var(--text-lo)", background:"var(--navy-alpha)" }}
            onMouseEnter={e=>(e.currentTarget.style.background="var(--red-bg)")}
            onMouseLeave={e=>(e.currentTarget.style.background="var(--navy-alpha)")}>
            <X size={15}/>
          </button>
        </div>
        <div className={`overflow-y-auto flex-1 ${isMobile ? "px-4 py-4 space-y-3" : "px-6 py-4 space-y-4"}`}>{children}</div>
        {footer && <div className={`flex items-center justify-end gap-2.5 flex-shrink-0 flex-wrap ${isMobile ? "px-4 py-3" : "px-6 py-4"}`} style={{ borderTop:"1px solid var(--border)", background:"rgba(47,55,88,.02)" }}>{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?:ReactNode|string; title:string; description?:string; action?:ReactNode }) {
  // Map string icons to lucide components
  const iconMap: Record<string, React.ComponentType<any>> = {
    "rocket": Rocket,
    "check": CheckCircle2,
    "money": DollarSign,
    "users": Users,
    "trending": TrendingUp,
    "document": FileText,
    "view": Eye,
    "edit": Edit2,
    "delete": Trash2,
    "clock": Clock,
    "calendar": Calendar,
    "task": FileCheck,
    "chart": BarChart3,
  };
  
  let iconElement = icon;
  if (typeof icon === "string" && iconMap[icon]) {
    const IconComp = iconMap[icon];
    iconElement = <IconComp size={32} strokeWidth={1.5} />;
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {iconElement && <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 flex-shrink-0" style={{ background:"rgba(249,115,22,.08)", border:"1px solid rgba(249,115,22,.2)", color:"var(--orange)" }}>{iconElement}</div>}
      <p className="font-bold text-lg mb-2 max-w-sm" style={{ color:"var(--navy)" }}>{title}</p>
      {description && <p className="text-sm mb-6 max-w-sm" style={{ color:"var(--text-lo)" }}>{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, count, children }: { title:string; subtitle?:string; count?:number; children?:ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight" style={{ color:"var(--navy)" }}>{title}</h1>
          {count !== undefined && <span className="text-xs font-bold px-2 md:px-2.5 py-1 rounded-full font-mono" style={{ background:"rgba(47,55,88,.06)", color:"var(--text-lo)", border:"1px solid var(--border)" }}>{count}</span>}
        </div>
        {subtitle && <p className="text-xs md:text-sm mt-1" style={{ color:"var(--text-lo)" }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">{children}</div>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder="Buscar...", width="220px" }: { value:string; onChange:(v:string)=>void; placeholder?:string; width?:string }) {
  return (
    <div className="relative flex-shrink-0 w-full sm:w-auto" style={{ maxWidth: width }}>
      <Search size={12} className="md:block hidden" style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", color:"var(--text-lo)" }}/>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full py-1.5 md:py-2 px-3 md:px-3 text-xs md:text-sm rounded-lg md:rounded-md"
        style={{ ...inputBase, paddingLeft: "28px" }} onFocus={onFocusIn} onBlur={onFocusOut}/>
    </div>
  );
}

export function KanbanCol({ title, color, count, children, onAdd }: { title:string; color:string; count:number; children:ReactNode; onAdd?:()=>void }) {
  return (
    <div className="kanban-col">
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3"
        style={{ background:"var(--glass-hi)", border:`1px solid ${color}30`, borderLeft:`3px solid ${color}`, boxShadow:"var(--shadow-xs)" }}>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{title}</span>
        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full" style={{ background:`${color}14`, color, border:`1px solid ${color}30` }}>{count}</span>
      </div>
      {children}
      {onAdd && (
        <button onClick={onAdd}
          className="w-full py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 mt-1"
          style={{ border:"1.5px dashed var(--border-mid)", color:"var(--text-lo)", background:"none" }}
          onMouseEnter={e=>{const el=e.currentTarget;el.style.borderColor="var(--orange)";el.style.color="var(--orange)";el.style.background="var(--orange-alpha)"}}
          onMouseLeave={e=>{const el=e.currentTarget;el.style.borderColor="var(--border-mid)";el.style.color="var(--text-lo)";el.style.background="none"}}>
          <Plus size={12}/> Adicionar
        </button>
      )}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs:{key:string;label:string;icon?:ReactNode}[]; active:string; onChange:(k:string)=>void }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl" style={{ background:"var(--navy-alpha)", border:"1px solid var(--border)" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={()=>onChange(t.key)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          style={{ background:active===t.key?"var(--glass-hi)":"transparent", color:active===t.key?"var(--navy)":"var(--text-lo)", boxShadow:active===t.key?"var(--shadow-xs)":"none", border:active===t.key?"1px solid var(--border)":"1px solid transparent" }}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

export function Tag({ children }: { children:ReactNode }) {
  return <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background:"var(--navy-alpha)", color:"var(--navy-hi)", border:"1px solid var(--border)" }}>{children}</span>;
}

export function ProgressBar({ value, max=100, color="var(--orange)" }: { value:number; max?:number; color?:string }) {
  const pct = Math.min(100, Math.max(0, (value/max)*100));
  return <div className="rounded-full overflow-hidden" style={{ height:"5px", background:"var(--navy-alpha)" }}><div className="h-full rounded-full transition" style={{ width:`${pct}%`, background:color }}/></div>;
}

export function Divider({ label }: { label?:string }) {
  if (!label) return <div style={{ height:"1px", background:"var(--border)", margin:"4px 0" }}/>;
  return <div className="flex items-center gap-3" style={{ margin:"4px 0" }}><div style={{ flex:1, height:"1px", background:"var(--border)" }}/><span className="text-xs font-semibold" style={{ color:"var(--text-lo)" }}>{label}</span><div style={{ flex:1, height:"1px", background:"var(--border)" }}/></div>;
}

export function Alert({ type, children }: { type:"info"|"success"|"warning"|"error"; children:ReactNode }) {
  const cfg = {
    info:    { bg:"var(--blue-bg)",   border:"rgba(59,130,246,.22)",  color:"#1d4ed8", Icon:Info },
    success: { bg:"var(--green-bg)",  border:"rgba(16,185,129,.22)",  color:"#047857", Icon:Check },
    warning: { bg:"var(--yellow-bg)", border:"rgba(245,158,11,.22)",  color:"#b45309", Icon:AlertCircle },
    error:   { bg:"var(--red-bg)",    border:"rgba(239,68,68,.22)",   color:"#b91c1c", Icon:AlertCircle },
  }[type];
  return <div className="flex items-start gap-3 p-3 rounded-lg text-sm" style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, color:"var(--text-mid)" }}><cfg.Icon size={15} style={{ color:cfg.color, flexShrink:0, marginTop:"1px" }}/><div>{children}</div></div>;
}

// FieldError component for validation feedback
export function FieldError({ error, show }: { error?:string; show?:boolean }) {
  if (!show || !error) return null;
  return <div className="flex items-center gap-1.5 mt-1.5" style={{ color:"var(--red)", fontSize:"12px", fontWeight:"500" }}><AlertCircle size={13}/>{error}</div>;
}

// ConfirmDialog for destructive actions
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  itemName?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning";
}
export function ConfirmDialog({ open, title, description, itemName, loading, onConfirm, onCancel, variant = "danger" }: ConfirmDialogProps) {
  if (!open) return null;
  const textColor = variant === "danger" ? "#dc2626" : "#d97706";
  const bgColor = variant === "danger" ? "var(--red-bg)" : "var(--yellow-bg)";
  const borderColor = variant === "danger" ? "rgba(239,68,68,.22)" : "rgba(245,158,11,.22)";
  const Icon = variant === "danger" ? AlertCircle : AlertCircle;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade"
      style={{ background:"rgba(47,55,88,.5)", backdropFilter:"blur(10px)" }}
      onClick={e => { if(e.target===e.currentTarget) onCancel(); }}>
      <div className="w-full rounded-2xl overflow-hidden animate-up"
        style={{ maxWidth:"420px", background:"var(--glass-hi)", border:"1px solid var(--glass-border)", display:"flex", flexDirection:"column", boxShadow:"var(--shadow-xl)", backdropFilter:"blur(24px)" }}>
        <div className="text-center px-6 py-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:bgColor, border:`1px solid ${borderColor}` }}>
              <Icon size={28} style={{ color:textColor }}/>
            </div>
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ color:"var(--navy)" }}>{title}</h3>
          {description && <p className="text-xs mb-4" style={{ color:"var(--text-lo)" }}>{description}</p>}
          {itemName && <p className="text-sm font-semibold p-2 rounded-lg mb-4" style={{ background:"rgba(47,55,88,.05)", color:"var(--navy)", border:"1px solid var(--border)" }}>"{itemName}"</p>}
        </div>
        <div className="flex items-center justify-end gap-2.5 px-6 py-4" style={{ borderTop:"1px solid var(--border)", background:"rgba(47,55,88,.02)" }}>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button variant={variant === "danger" ? "danger" : "warning"} onClick={onConfirm} loading={loading}>Confirmar</Button>
        </div>
      </div>
    </div>
  );
}

// Breadcrumb for navigation context
interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium mb-4 overflow-x-auto pb-1" style={{ color:"var(--text-lo)" }}>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5 flex-shrink-0">
          {idx > 0 && <span style={{ color:"var(--text-lo)" }}>/</span>}
          {item.href || item.onClick ? (
            <button 
              onClick={item.onClick}
              style={{ color:"var(--orange)", textDecoration:"none", cursor:"pointer", transition:"color .2s", fontWeight:"500" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f97316")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--orange)")}>
              {item.label}
            </button>
          ) : (
            <span style={{ color:"var(--navy)", fontWeight:"600" }}>{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}
