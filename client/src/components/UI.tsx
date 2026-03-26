import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { X, ChevronDown } from "lucide-react";
import { getBadgeClass, getBadgeLabel } from "../lib/utils";

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`badge badge-${getBadgeClass(status)}`}>
      {label || getBadgeLabel(status)}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "danger" | "success" | "ghost" | "outline";
type BtnSize = "xs" | "sm" | "md" | "lg";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<BtnVariant, React.CSSProperties> = {
  primary:   { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" },
  secondary: { background: "var(--bg-subtle)", color: "var(--text-hi)", border: "1px solid var(--border-mid)" },
  danger:    { background: "var(--red-lo)", color: "#f87171", border: "1px solid rgba(239,68,68,.25)" },
  success:   { background: "var(--green-lo)", color: "var(--green)", border: "1px solid rgba(16,185,129,.25)" },
  ghost:     { background: "transparent", color: "var(--text-mid)", border: "1px solid transparent" },
  outline:   { background: "transparent", color: "var(--text-hi)", border: "1px solid var(--border-mid)" },
};

const sizeStyles: Record<BtnSize, string> = {
  xs: "px-2 py-1 text-xs rounded",
  sm: "px-3 py-1.5 text-sm rounded",
  md: "px-4 py-2 text-base rounded-md",
  lg: "px-5 py-2.5 text-lg rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, BtnProps>(
  ({ variant = "secondary", size = "sm", loading, icon, children, style, className, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center gap-2 font-medium transition select-none ${sizeStyles[size]} ${className || ""}`}
        style={{ ...variantStyles[variant], opacity: loading || rest.disabled ? 0.6 : 1, ...style }}
        disabled={loading || rest.disabled}
        {...rest}
      >
        {loading
          ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// Icon-only button
export function IconButton({ children, title, onClick, variant = "ghost", className }: { children: ReactNode; title?: string; onClick?: () => void; variant?: BtnVariant; className?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 rounded transition ${className || ""}`}
      style={{ ...variantStyles[variant], padding: 0 }}
    >
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps { children: ReactNode; className?: string; style?: React.CSSProperties; hover?: boolean; }
export function Card({ children, className, style, hover }: CardProps) {
  return (
    <div
      className={`rounded-lg overflow-hidden ${hover ? "transition cursor-pointer" : ""} ${className || ""}`}
      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", ...style }}
      onMouseEnter={hover ? e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hi)"; } : undefined}
      onMouseLeave={hover ? e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; } : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between px-5 py-3 ${className || ""}`}
      style={{ borderBottom: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

export function CardTitle({ children, size = "sm" }: { children: ReactNode; size?: "sm" | "md" }) {
  return <div className={`font-semibold ${size === "md" ? "text-base" : "text-sm"}`} style={{ color: "var(--text-hi)" }}>{children}</div>;
}

export function CardBody({ children, className, noPad }: { children: ReactNode; className?: string; noPad?: boolean }) {
  return <div className={`${noPad ? "" : "px-5 py-4"} ${className || ""}`}>{children}</div>;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiProps { label: string; value: string | number; sub?: string; color?: string; icon?: ReactNode; trend?: number; }
export function KpiCard({ label, value, sub, color = "var(--accent)", icon, trend }: KpiProps) {
  return (
    <div className="rounded-lg p-4 relative overflow-hidden"
      style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: color }} />
      {/* Subtle glow */}
      <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${color}10, transparent)` }} />

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--text-lo)" }}>
            {label}
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight" style={{ color: "var(--text-hi)" }}>
            {value}
          </div>
          {sub && <div className="text-xs mt-1" style={{ color: "var(--text-lo)" }}>{sub}</div>}
          {trend !== undefined && (
            <div className={`text-xs mt-1.5 font-medium ${trend >= 0 ? "text-green" : "text-red"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18`, color }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full" style={{ borderCollapse: "collapse" }}>{children}</table></div>;
}

export function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <th className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-widest whitespace-nowrap ${right ? "text-right" : "text-left"}`}
      style={{ color: "var(--text-lo)", borderBottom: "1px solid var(--border)", background: "var(--bg-overlay)" }}>
      {children}
    </th>
  );
}

export function Tr({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      className={`transition ${onClick ? "cursor-pointer" : ""} ${className || ""}`}
      onClick={onClick}
      style={{ borderBottom: "1px solid var(--border)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className, right, mono }: { children: ReactNode; className?: string; right?: boolean; mono?: boolean }) {
  return (
    <td className={`px-4 py-3 text-sm ${right ? "text-right" : ""} ${mono ? "font-mono" : ""} ${className || ""}`}>
      {children}
    </td>
  );
}

// ─── Form Controls ────────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-mid)",
  borderRadius: "var(--r-sm)",
  color: "var(--text-hi)",
  fontSize: "13px",
  outline: "none",
  width: "100%",
  padding: "8px 12px",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function focusIn(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = "var(--accent)";
  e.target.style.boxShadow = "0 0 0 2px var(--accent-lo)";
}
function focusOut(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.target.style.borderColor = "var(--border-mid)";
  e.target.style.boxShadow = "none";
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ style, ...props }, ref) => (
    <input ref={ref} style={{ ...inputBase, ...style }} onFocus={focusIn} onBlur={focusOut} {...props} />
  )
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }>(
  ({ style, children, ...props }, ref) => (
    <select ref={ref} style={{ ...inputBase, ...style }} onFocus={focusIn} onBlur={focusOut} {...props}>
      {children}
    </select>
  )
);
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ style, ...props }, ref) => (
    <textarea ref={ref} style={{ ...inputBase, minHeight: "80px", resize: "vertical", ...style }} onFocus={focusIn} onBlur={focusOut} {...props} />
  )
);
Textarea.displayName = "Textarea";

export function FormGroup({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-lo)" }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs" style={{ color: "var(--text-lo)" }}>{hint}</p>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" | "xl"; }
export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  if (!open) return null;
  const maxW = { sm: "384px", md: "512px", lg: "672px", xl: "800px" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade"
      style={{ background: "rgba(0,0,0,.7)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full rounded-xl overflow-hidden animate-slide"
        style={{ maxWidth: maxW[size], maxHeight: "88vh", background: "var(--bg-raised)", border: "1px solid var(--border-mid)", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-overlay)" }}>
          <h3 className="font-semibold text-base" style={{ color: "var(--text-hi)" }}>{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center transition"
            style={{ color: "var(--text-lo)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-hi)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-lo)")}>
            <X size={15} />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 flex-shrink-0"
            style={{ borderTop: "1px solid var(--border)", background: "var(--bg-overlay)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="mb-4 opacity-30" style={{ fontSize: "40px" }}>{icon}</div>}
      <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-mid)" }}>{title}</p>
      {description && <p className="text-xs mb-4" style={{ color: "var(--text-lo)" }}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Page Header ─────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, count, children }: { title: string; subtitle?: string; count?: number; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-hi)" }}>{title}</h1>
          {count !== undefined && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: "var(--bg-subtle)", color: "var(--text-lo)", border: "1px solid var(--border)" }}>
              {count}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--text-lo)" }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = "Buscar..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute" style={{ left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-lo)", fontSize: "13px" }}>⌕</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputBase, paddingLeft: "30px", width: "200px" }}
        onFocus={focusIn}
        onBlur={focusOut}
      />
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
export function KanbanCol({ title, color, count, children, onAdd }: { title: string; color: string; count: number; children: ReactNode; onAdd?: () => void; }) {
  return (
    <div className="kanban-col">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2 rounded-md mb-2"
        style={{ background: "var(--bg-overlay)", borderLeft: `2px solid ${color}` }}>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>{title}</span>
        <span className="text-xs font-mono px-1.5 py-0.5 rounded"
          style={{ background: "var(--bg-subtle)", color: "var(--text-lo)", border: "1px solid var(--border)" }}>
          {count}
        </span>
      </div>
      {children}
      {onAdd && (
        <button onClick={onAdd}
          className="w-full py-2 rounded-md text-xs font-medium transition mt-1"
          style={{ border: "1px dashed var(--border)", color: "var(--text-lo)", background: "none" }}
          onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "var(--accent)"; el.style.color = "var(--accent)"; }}
          onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "var(--border)"; el.style.color = "var(--text-lo)"; }}>
          + Adicionar
        </button>
      )}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (k: string) => void; }) {
  return (
    <div className="flex gap-0.5 p-1 rounded-lg w-fit" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className="px-3 py-1.5 rounded text-xs font-medium transition"
          style={{
            background: active === t.key ? "var(--bg-raised)" : "transparent",
            color: active === t.key ? "var(--text-hi)" : "var(--text-lo)",
            border: active === t.key ? "1px solid var(--border-mid)" : "1px solid transparent",
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <div style={{ height: "1px", background: "var(--border)", margin: "8px 0" }} />;
  return (
    <div className="flex items-center gap-3" style={{ margin: "8px 0" }}>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      <span className="text-xs" style={{ color: "var(--text-lo)" }}>{label}</span>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
    </div>
  );
}

// ─── Tag ─────────────────────────────────────────────────────────────────────
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded font-medium"
      style={{ background: "var(--bg-subtle)", color: "var(--text-mid)", border: "1px solid var(--border)" }}>
      {children}
    </span>
  );
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = "var(--accent)" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="rounded-full overflow-hidden" style={{ height: "4px", background: "var(--bg-subtle)" }}>
      <div className="h-full rounded-full transition" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
