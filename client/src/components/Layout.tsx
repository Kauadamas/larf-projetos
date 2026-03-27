import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { trpc } from "../lib/trpc";
import {
  LayoutGrid, Users, TrendingUp, FolderOpen, CheckSquare,
  Clock, FileText, CreditCard, DollarSign, BarChart3,
  LogOut, Settings, HelpCircle, ChevronRight, Bell,
} from "lucide-react";

type NavItem = { section: string } | { label: string; icon: React.ComponentType<any>; href: string; badge?: string };
const NAV: NavItem[] = [
  { section: "Principal" },
  { label: "Dashboard",    icon: LayoutGrid,   href: "/admin" },
  { section: "Clientes" },
  { label: "Clientes",     icon: Users,         href: "/admin/clients",   badge: "clients" },
  { label: "Pipeline",     icon: TrendingUp,    href: "/admin/pipeline" },
  { section: "Projetos" },
  { label: "Projetos",     icon: FolderOpen,    href: "/admin/projects",  badge: "projects" },
  { label: "Tarefas",      icon: CheckSquare,   href: "/admin/tasks" },
  { label: "Horas",        icon: Clock,         href: "/admin/time" },
  { section: "Financeiro" },
  { label: "Propostas",    icon: FileText,      href: "/admin/proposals" },
  { label: "Recebimentos", icon: CreditCard,    href: "/admin/invoices" },
  { label: "Despesas",     icon: DollarSign,    href: "/admin/expenses" },
  { section: "Análise" },
  { label: "Relatórios",   icon: BarChart3,     href: "/admin/reports" },
];
const PAGE_TITLES: Record<string, string> = {
  "/admin":"Dashboard", "/admin/clients":"Clientes", "/admin/pipeline":"Pipeline",
  "/admin/projects":"Projetos", "/admin/tasks":"Tarefas", "/admin/time":"Horas",
  "/admin/proposals":"Propostas", "/admin/invoices":"Recebimentos", "/admin/expenses":"Despesas",
  "/admin/reports":"Relatórios", "/admin/users":"Usuários", "/admin/tutorial":"Tutorial",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const badges: Record<string, number> = { clients: stats?.clients.active ?? 0, projects: stats?.projects.active ?? 0 };
  const isActive = (href: string) => href === "/admin" ? location === "/admin" : location.startsWith(href);
  const pageTitle = PAGE_TITLES[location] || "LARF";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Sidebar ── */}
      <aside className="flex flex-col flex-shrink-0" style={{
        width: "232px",
        background: "linear-gradient(180deg, var(--navy-lo) 0%, var(--navy) 100%)",
        boxShadow: "4px 0 32px rgba(47,55,88,.2)",
        borderRight: "1px solid rgba(255,255,255,.06)",
      }}>

        {/* Logo block */}
        <div className="flex items-center justify-center px-5" style={{ height: "72px", borderBottom: "1px solid rgba(255,255,255,.08)", flexShrink: 0 }}>
          {/* Use the SVG logo — cropped to just the logo content */}
          <img
            src="/src/assets/larflogo.svg"
            alt="LARF"
            style={{
              height: "28px",
              width: "auto",
              maxWidth: "160px",
              filter: "brightness(0) invert(1)",
              objectFit: "contain",
              /* The SVG has large blank area, use CSS to crop it visually */
              clipPath: "none",
            }}
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3" style={{ scrollbarWidth: "none" }}>
          {NAV.map((item, i) => {
            if ("section" in item) return (
              <div key={i} className="px-2 pt-5 pb-1.5 font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,.28)", fontSize: "9px" }}>
                {item.section}
              </div>
            );
            const Icon = item.icon;
            const active = isActive(item.href);
            const count = item.badge ? badges[item.badge] : null;
            return (
              <button key={item.href} onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 transition text-left select-none"
                style={{
                  fontSize: "13px", fontWeight: active ? 700 : 400,
                  color: active ? "#fff" : "rgba(255,255,255,.52)",
                  background: active ? "rgba(255,122,0,.22)" : "transparent",
                  border: active ? "1px solid rgba(255,122,0,.30)" : "1px solid transparent",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.07)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                <span className="flex-1 truncate">{item.label}</span>
                {count !== null && count > 0 && (
                  <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(255,122,0,.28)", color: "#FFB066", fontSize: "10px" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <div style={{ height: "1px", background: "rgba(255,255,255,.07)", margin: "12px 8px" }} />

          {isAdmin && (
            <button onClick={() => navigate("/admin/users")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 transition text-left"
              style={{ fontSize: "13px", fontWeight: location === "/admin/users" ? 700 : 400, color: location === "/admin/users" ? "#fff" : "rgba(255,255,255,.52)", background: location === "/admin/users" ? "rgba(255,122,0,.22)" : "transparent" }}>
              <Settings size={15} strokeWidth={1.8} />
              <span className="flex-1">Usuários</span>
            </button>
          )}
          <button onClick={() => navigate("/admin/tutorial")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left"
            style={{ fontSize: "13px", fontWeight: location === "/admin/tutorial" ? 700 : 400, color: location === "/admin/tutorial" ? "#fff" : "rgba(255,255,255,.52)", background: location === "/admin/tutorial" ? "rgba(255,122,0,.22)" : "transparent" }}>
            <HelpCircle size={15} strokeWidth={1.8} />
            <span className="flex-1">Tutorial</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,122,0,.28)", color: "#FFB066", fontSize: "9px" }}>NOVO</span>
          </button>
        </nav>

        {/* User */}
        <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl"
            style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>
            <div className="flex items-center justify-center rounded-xl text-white font-bold flex-shrink-0"
              style={{ width: "32px", height: "32px", background: "var(--orange)", fontSize: "13px", boxShadow: "0 2px 8px rgba(255,122,0,.40)" }}>
              {user?.name?.charAt(0)?.toUpperCase() || "L"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: "#fff" }}>{user?.name || "LARF"}</div>
              <div className="truncate" style={{ color: "rgba(255,255,255,.38)", fontSize: "10px" }}>{user?.role}</div>
            </div>
            <button onClick={logout} title="Sair"
              className="w-7 h-7 flex items-center justify-center rounded-lg transition flex-shrink-0"
              style={{ color: "rgba(255,255,255,.38)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--orange)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.38)")}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 flex-shrink-0"
          style={{ height: "60px", background: "var(--glass-hi)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-xs)" }}>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold" style={{ color: "var(--text-lo)" }}>LARF</span>
            <ChevronRight size={14} style={{ color: "var(--border-hi)" }} />
            <span className="font-bold text-base" style={{ color: "var(--navy)" }}>{pageTitle}</span>
          </div>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition"
            style={{ color: "var(--text-lo)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--navy-alpha)"; (e.currentTarget as HTMLElement).style.color = "var(--navy)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--text-lo)"; }}>
            <Bell size={16} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
