import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { trpc } from "../lib/trpc";
import {
  LayoutGrid, Users, TrendingUp, FolderOpen, CheckSquare, Clock,
  FileText, CreditCard, DollarSign, BarChart3, LogOut, Settings,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { section: "Visão Geral" },
  { label: "Dashboard", icon: LayoutGrid, href: "/admin" },
  { section: "Clientes" },
  { label: "Clientes", icon: Users, href: "/admin/clients", badge: "clients" },
  { label: "Pipeline", icon: TrendingUp, href: "/admin/pipeline" },
  { section: "Projetos" },
  { label: "Projetos", icon: FolderOpen, href: "/admin/projects", badge: "projects" },
  { label: "Tarefas", icon: CheckSquare, href: "/admin/tasks" },
  { label: "Registro de Horas", icon: Clock, href: "/admin/time" },
  { section: "Financeiro" },
  { label: "Propostas", icon: FileText, href: "/admin/proposals" },
  { label: "Recebimentos", icon: CreditCard, href: "/admin/invoices" },
  { label: "Despesas", icon: DollarSign, href: "/admin/expenses" },
  { section: "Análise" },
  { label: "Relatórios", icon: BarChart3, href: "/admin/reports" },
] as const;

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { data: stats } = trpc.dashboard.stats.useQuery();

  const badges: Record<string, number> = {
    clients: stats?.clients.active ?? 0,
    projects: stats?.projects.active ?? 0,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: "var(--accent)", boxShadow: "0 0 14px rgba(192,57,43,.5)" }}>
            L
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">LARF</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>Gestão de Projetos</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item, i) => {
            if ("section" in item) {
              return (
                <div key={i} className="text-xs font-semibold uppercase tracking-widest px-2 pt-4 pb-1.5"
                  style={{ color: "var(--muted)", fontSize: "9px" }}>
                  {item.section}
                </div>
              );
            }
            const Icon = item.icon;
            const active = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            const count = "badge" in item ? badges[item.badge as string] : null;
            return (
              <button key={item.href} onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: active ? "var(--accent)" : "var(--muted2)",
                  background: active ? "var(--accent-glow)" : "transparent",
                  border: active ? "1px solid rgba(192,57,43,.2)" : "1px solid transparent",
                }}>
                <Icon size={15} className="flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {count !== null && count > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: "var(--accent)", fontSize: "10px" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          {isAdmin && (
            <button onClick={() => navigate("/admin/users")}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ color: location === "/admin/users" ? "var(--accent)" : "var(--muted2)" }}>
              <Settings size={15} />
              <span className="flex-1 text-left">Usuários</span>
            </button>
          )}
        </nav>

        {/* User */}
        <div className="p-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: "var(--surface2)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: "var(--accent)" }}>
              {user?.name?.charAt(0)?.toUpperCase() || "L"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{user?.name || "LARF"}</div>
              <div className="text-xs" style={{ color: "var(--muted)", fontSize: "10px" }}>{user?.role || "—"}</div>
            </div>
            <button onClick={logout} title="Sair"
              className="p-1 rounded transition-colors"
              style={{ color: "var(--muted)" }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
