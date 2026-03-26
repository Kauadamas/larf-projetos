import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { trpc } from "../lib/trpc";
import {
  LayoutGrid, Users, TrendingUp, FolderOpen, CheckSquare,
  Clock, FileText, CreditCard, DollarSign, BarChart3,
  LogOut, Settings, ChevronRight, Bell,
} from "lucide-react";

type NavItem =
  | { section: string }
  | { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; href: string; badge?: string };

const NAV: NavItem[] = [
  { section: "Principal" },
  { label: "Dashboard",   icon: LayoutGrid,  href: "/admin" },
  { section: "Clientes" },
  { label: "Clientes",    icon: Users,        href: "/admin/clients",   badge: "clients" },
  { label: "Pipeline",    icon: TrendingUp,   href: "/admin/pipeline" },
  { section: "Projetos" },
  { label: "Projetos",    icon: FolderOpen,   href: "/admin/projects",  badge: "projects" },
  { label: "Tarefas",     icon: CheckSquare,  href: "/admin/tasks" },
  { label: "Horas",       icon: Clock,        href: "/admin/time" },
  { section: "Financeiro" },
  { label: "Propostas",   icon: FileText,     href: "/admin/proposals" },
  { label: "Recebimentos",icon: CreditCard,   href: "/admin/invoices" },
  { label: "Despesas",    icon: DollarSign,   href: "/admin/expenses" },
  { section: "Análise" },
  { label: "Relatórios",  icon: BarChart3,    href: "/admin/reports" },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/clients": "Clientes",
  "/admin/pipeline": "Pipeline",
  "/admin/projects": "Projetos",
  "/admin/tasks": "Tarefas",
  "/admin/time": "Horas",
  "/admin/proposals": "Propostas",
  "/admin/invoices": "Recebimentos",
  "/admin/expenses": "Despesas",
  "/admin/reports": "Relatórios",
  "/admin/users": "Usuários",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { data: stats } = trpc.dashboard.stats.useQuery();

  const badges: Record<string, number> = {
    clients: stats?.clients.active ?? 0,
    projects: stats?.projects.active ?? 0,
  };

  const isActive = (href: string) =>
    href === "/admin" ? location === "/admin" : location.startsWith(href);

  const pageTitle = PAGE_TITLES[location] || "LARF";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* ── Sidebar ── */}
      <aside className="flex flex-col flex-shrink-0"
        style={{ width: "216px", background: "var(--bg-raised)", borderRight: "1px solid var(--border)" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-center rounded-lg font-bold text-white flex-shrink-0"
            style={{
              width: "32px", height: "32px", fontSize: "14px",
              background: "var(--accent)",
              boxShadow: "0 0 16px var(--accent-glow)",
            }}>
            L
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight" style={{ color: "var(--text-hi)" }}>LARF</div>
            <div className="text-xs" style={{ color: "var(--text-lo)" }}>Gestão</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map((item, i) => {
            if ("section" in item) {
              return (
                <div key={i} className="px-2 pt-4 pb-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-lo)", fontSize: "9px" }}>
                  {item.section}
                </div>
              );
            }
            const Icon = item.icon;
            const active = isActive(item.href);
            const count = item.badge ? badges[item.badge] : null;
            return (
              <button key={item.href}
                onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md mb-0.5 transition text-left"
                style={{
                  fontSize: "13px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--text-hi)" : "var(--text-mid)",
                  background: active ? "var(--bg-overlay)" : "transparent",
                  borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                }}>
                <Icon size={14} className="flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {count !== null && count > 0 && (
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "var(--accent-lo)", color: "var(--accent-hi)", fontSize: "10px" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {isAdmin && (
            <button onClick={() => navigate("/admin/users")}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md mb-0.5 transition text-left"
              style={{
                fontSize: "13px",
                fontWeight: location === "/admin/users" ? 600 : 400,
                color: location === "/admin/users" ? "var(--text-hi)" : "var(--text-mid)",
                background: location === "/admin/users" ? "var(--bg-overlay)" : "transparent",
                borderLeft: location === "/admin/users" ? "2px solid var(--accent)" : "2px solid transparent",
              }}>
              <Settings size={14} />
              <span>Usuários</span>
            </button>
          )}
        </nav>

        {/* User */}
        <div className="p-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5 p-2 rounded-lg"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-center rounded-lg text-white text-xs font-bold flex-shrink-0"
              style={{ width: "28px", height: "28px", background: "var(--accent)" }}>
              {user?.name?.charAt(0)?.toUpperCase() || "L"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "var(--text-hi)" }}>
                {user?.name || "LARF"}
              </div>
              <div className="text-xs truncate" style={{ color: "var(--text-lo)", fontSize: "10px" }}>
                {user?.role}
              </div>
            </div>
            <button onClick={logout} title="Sair" className="transition flex-shrink-0"
              style={{ color: "var(--text-lo)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-hi)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-lo)")}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-6 flex-shrink-0"
          style={{ height: "52px", background: "var(--bg-raised)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-lo)" }}>LARF</span>
            <ChevronRight size={12} style={{ color: "var(--border-hi)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-hi)" }}>{pageTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 rounded flex items-center justify-center transition"
              style={{ color: "var(--text-lo)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-hi)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-lo)")}>
              <Bell size={15} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
