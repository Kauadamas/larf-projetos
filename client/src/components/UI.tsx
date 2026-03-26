import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { X } from "lucide-react";
import { getBadgeClass, getBadgeLabel } from "../lib/utils";

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ status }: { status: string }) {
  return <span className={`badge ${getBadgeClass(status)}`}>{getBadgeLabel(status)}</span>;
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const btnStyles: Record<BtnVariant, string> = {
  primary: "text-white font-semibold transition-all",
  secondary: "font-medium transition-all",
  danger: "font-semibold transition-all",
  success: "font-semibold transition-all",
  ghost: "font-medium transition-all",
};

export function Button({ variant = "secondary", size = "md", loading, children, className, style, ...rest }: BtnProps) {
  const sizeMap = { sm: "px-3 py-1.5 text-xs rounded-lg", md: "px-4 py-2 text-sm rounded-lg", lg: "px-6 py-2.5 text-sm rounded-xl" };
  const styleMap: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: "var(--accent)", color: "white" },
    secondary: { background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" },
    danger: { background: "rgba(239,68,68,.12)", color: "var(--red)", border: "1px solid rgba(239,68,68,.2)" },
    success: { background: "rgba(34,197,94,.12)", color: "var(--green)", border: "1px solid rgba(34,197,94,.2)" },
    ghost: { background: "transparent", color: "var(--muted2)" },
  };
  return (
    <button className={`inline-flex items-center gap-2 ${sizeMap[size]} ${btnStyles[variant]} ${className || ""}`}
      style={{ ...styleMap[variant], ...style }} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl ${className || ""}`} style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}
export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`flex items-center justify-between px-5 py-3.5 ${className || ""}`} style={{ borderBottom: "1px solid var(--border)" }}>{children}</div>;
}
export function CardTitle({ children }: { children: ReactNode }) {
  return <div className="text-sm font-semibold">{children}</div>;
}
export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className || ""}`}>{children}</div>;
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full text-sm border-collapse">{children}</table></div>;
}
export function Th({ children }: { children: ReactNode }) {
  return <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-wide text-xs whitespace-nowrap" style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)", fontSize: "10px" }}>{children}</th>;
}
export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 ${className || ""}`} style={{ borderBottom: "1px solid var(--border)" }}>{children}</td>;
}
export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr className="group transition-colors" style={{}} onClick={onClick}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.02)")}
      onMouseLeave={e => (e.currentTarget.style.background = "")}>
      {children}
    </tr>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={`w-full px-3 py-2 rounded-lg text-sm outline-none transition-all ${className || ""}`}
      style={{ background: "var(--surface2)", border: "1.5px solid var(--border)", color: "var(--text)" }}
      onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-glow)"; }}
      onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
      {...props} />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={`w-full px-3 py-2 rounded-lg text-sm outline-none transition-all ${className || ""}`}
      style={{ background: "var(--surface2)", border: "1.5px solid var(--border)", color: "var(--text)" }}
      onFocus={e => (e.target.style.borderColor = "var(--accent)")}
      onBlur={e => (e.target.style.borderColor = "var(--border)")}
      {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={`w-full px-3 py-2 rounded-lg text-sm outline-none transition-all resize-none min-h-20 ${className || ""}`}
      style={{ background: "var(--surface2)", border: "1.5px solid var(--border)", color: "var(--text)" }}
      onFocus={e => (e.target.style.borderColor = "var(--accent)")}
      onBlur={e => (e.target.style.borderColor = "var(--border)")}
      {...props} />
  );
}

export function FormGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted2)" }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg"; }
export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  if (!open) return null;
  const maxW = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade"
      style={{ background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`w-full ${maxW[size]} rounded-2xl max-h-[88vh] overflow-y-auto animate-fade`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-bold text-sm">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--muted)" }}><X size={16} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3.5" style={{ borderTop: "1px solid var(--border)" }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, action }: { icon: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4 opacity-20">{icon}</div>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{title}</p>
      {action}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color || "var(--accent)" }} />
      <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)", fontSize: "10px" }}>{label}</div>
      <div className="text-2xl font-bold" style={{ fontFamily: "var(--mono)", letterSpacing: "-1px" }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}

// ─── Page Header ─────────────────────────────────────────────────────────────
export function PageHeader({ title, count, children }: { title: string; count?: number; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <h1 className="text-lg font-bold">{title}{count !== undefined ? <span className="ml-2 text-sm font-normal" style={{ color: "var(--muted)" }}>({count})</span> : null}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder || "🔍  Buscar..."}
      className="px-3 py-1.5 rounded-lg text-sm outline-none w-48"
      style={{ background: "var(--surface2)", border: "1.5px solid var(--border)", color: "var(--text)" }} />
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
export function KanbanCol({ title, color, count, children, onAdd }: { title: string; color: string; count: number; children: ReactNode; onAdd?: () => void }) {
  return (
    <div className="kanban-col">
      <div className="flex items-center justify-between px-3 py-2 rounded-lg mb-2"
        style={{ background: "var(--surface2)", borderLeft: `3px solid ${color}` }}>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{title}</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full font-mono" style={{ background: "var(--border)", color: "var(--muted)" }}>{count}</span>
      </div>
      {children}
      {onAdd && (
        <button onClick={onAdd} className="w-full py-1.5 rounded-lg text-xs font-medium transition-all mt-1"
          style={{ border: "1.5px dashed var(--border)", color: "var(--muted)", background: "none" }}
          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "var(--accent)"; (e.target as HTMLElement).style.color = "var(--accent)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "var(--border)"; (e.target as HTMLElement).style.color = "var(--muted)"; }}>
          + Adicionar
        </button>
      )}
    </div>
  );
}

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="kpi-card animate-pulse">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text h-[10px]" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      <td colSpan={5} className="px-4 py-3">
        <div className="space-y-2">
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text h-[10px]" />
        </div>
      </td>
    </tr>
  );
}

// ─── Enhanced Data Table with Features ────────────────────────────────────────
export function DataTable({
  columns,
  data,
  isLoading,
  onRowClick,
}: {
  columns: Array<{ key: string; label: string; width?: string }>;
  data: any[];
  isLoading?: boolean;
  onRowClick?: (row: any) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : data.length ? (
            data.map((row, i) => (
              <tr key={i} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? "pointer" : "default" }}>
                {columns.map(col => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-8" style={{ color: "var(--muted)" }}>
                Sem dados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
interface TabsProps {
  tabs: Array<{ id: string; label: string; icon?: any }>;
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-2 border-b" style={{ borderColor: "rgba(59,130,246,.1)" }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="px-4 py-3 text-sm font-medium transition-all relative group"
            style={{
              color: active === tab.id ? "var(--accent)" : "var(--muted)",
              borderBottom: active === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon size={16} />}
              {tab.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg" style={{ background: "rgba(59,130,246,.05)" }}>
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        Página {page} de {totalPages} ({total} total)
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-2 py-1.5 rounded text-xs font-medium transition-all"
          style={{
            background: page === 1 ? "rgba(59,130,246,.05)" : "var(--surface2)",
            color: page === 1 ? "var(--muted)" : "var(--text)",
            opacity: page === 1 ? 0.5 : 1,
            cursor: page === 1 ? "not-allowed" : "pointer",
          }}
        >
          ← Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2 py-1.5 rounded text-xs font-medium transition-all"
          style={{
            background: page >= totalPages ? "rgba(59,130,246,.05)" : "var(--surface2)",
            color: page >= totalPages ? "var(--muted)" : "var(--text)",
            opacity: page >= totalPages ? 0.5 : 1,
            cursor: page >= totalPages ? "not-allowed" : "pointer",
          }}
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
interface AlertProps {
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

export function Alert({ type, title, message, action }: AlertProps) {
  const config = {
    info: { bg: "rgba(59,130,246,.1)", border: "rgba(59,130,246,.2)", icon: "ℹ️", color: "var(--accent)" },
    success: { bg: "rgba(34,197,94,.1)", border: "rgba(34,197,94,.2)", icon: "✓", color: "var(--green)" },
    warning: { bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.2)", icon: "⚠️", color: "var(--yellow)" },
    error: { bg: "rgba(239,68,68,.1)", border: "rgba(239,68,68,.2)", icon: "✕", color: "var(--red)" },
  };
  const c = config[type];
  return (
    <div className="p-4 rounded-lg border flex items-start gap-3" style={{ background: c.bg, borderColor: c.border }}>
      <span className="text-xl flex-shrink-0">{c.icon}</span>
      <div className="flex-1">
        <h4 className="text-sm font-semibold mb-1" style={{ color: c.color }}>
          {title}
        </h4>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {message}
        </p>
      </div>
      {action && (
        <button onClick={action.onClick} className="text-xs font-medium px-3 py-1.5 rounded transition-all" style={{ background: c.bg, color: c.color }}>
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, label, color }: { value: number; max?: number; label?: string; color?: string }) {
  const percentage = (value / max) * 100;
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-2 text-xs">
          <span style={{ color: "var(--text)" }}>{label}</span>
          <span style={{ color: "var(--muted)" }}>
            {value} / {max}
          </span>
        </div>
      )}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
        <div
          className="h-full transition-all"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            background: color || "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "w-6 h-6 text-xs", md: "w-8 h-8 text-sm", lg: "w-10 h-10 text-base" };
  const initials = name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className={`${sizeMap[size]} rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{
        background: `linear-gradient(135deg, var(--accent) 0%, #00d9ff 100%)`,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Tag Component ────────────────────────────────────────────────────────────
interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  variant?: "primary" | "secondary" | "outline";
  onRemove?: () => void;
}

export function Tag({ label, variant = "secondary", onRemove, ...props }: TagProps) {
  const styles = {
    primary: { bg: "var(--accent)", text: "white" },
    secondary: { bg: "rgba(59,130,246,.1)", text: "var(--accent)" },
    outline: { bg: "transparent", text: "var(--accent)", border: "1px solid var(--accent)" },
  };
  const s = styles[variant];
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
      style={{ background: s.bg, color: s.text, border: (s as any).border || "none" }}
      {...props}
    >
      {label}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 hover:opacity-70">
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Stats Grid ───────────────────────────────────────────────────────────────
export function StatsGrid({
  stats,
  isLoading,
}: {
  stats: Array<{ label: string; value: string | number; color?: string; icon?: any }>;
  isLoading?: boolean;
}) {
  return (
    <div className="stats-row">
      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : (
        stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="kpi-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 style={{ color: "var(--muted)" }}>{stat.label}</h4>
                  <div className="value" style={{ color: stat.color || "var(--text)" }}>
                    {stat.value}
                  </div>
                </div>
                {Icon && <Icon size={20} style={{ color: stat.color || "var(--muted)", opacity: 0.5 }} />}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
