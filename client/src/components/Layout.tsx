import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { trpc } from "../lib/trpc";
import {
  LayoutGrid, Users, TrendingUp, FolderOpen, CheckSquare,
  Clock, FileText, CreditCard, DollarSign, BarChart3,
  LogOut, Settings, HelpCircle, ChevronRight, Bell, Menu, X,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const badges: Record<string, number> = { clients: stats?.clients.active ?? 0, projects: stats?.projects.active ?? 0 };
  const isActive = (href: string) => href === "/admin" ? location === "/admin" : location.startsWith(href);
  const pageTitle = PAGE_TITLES[location] || "LARF";
  
  const handleNavClick = (href: string) => {
    navigate(href);
    setSidebarOpen(false);
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-gradient-to-b" style={{
      background: "linear-gradient(180deg, var(--navy-lo) 0%, var(--navy) 100%)",
      boxShadow: "4px 0 32px rgba(47,55,88,.2)",
      borderRight: "1px solid rgba(255,255,255,.06)",
    }}>
      {/* Logo block */}
      <div className="flex items-center justify-between px-4 py-3 md:py-4" style={{ borderBottom: "1px solid rgba(255,255,255,.08)", flexShrink: 0 }}>
        <img src="/src/assets/larflogo.svg" alt="LARF" style={{ height: "24px", width: "auto", maxWidth: "120px", filter: "brightness(0) invert(1)", objectFit: "contain" }} />
        {sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768 && (
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X size={18} style={{ color: "#fff" }} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 md:py-3 px-2 md:px-3" style={{ scrollbarWidth: "none" }}>
        {NAV.map((item, i) => {
          if ("section" in item) return (
            <div key={i} className="px-3 pt-3 md:pt-4 pb-1.5 md:pb-2 font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.28)", fontSize: "8px" }}>
              {item.section}
            </div>
          );
          const Icon = item.icon;
          const active = isActive(item.href);
          const count = item.badge ? badges[item.badge] : null;
          return (
            <button key={item.href} onClick={() => handleNavClick(item.href)}
              className="w-full flex items-center gap-2 md:gap-2.5 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl mb-0.5 transition text-left select-none text-xs md:text-sm"
              style={{
                fontWeight: active ? 700 : 400,
                color: active ? "#fff" : "rgba(255,255,255,.52)",
                background: active ? "rgba(255,122,0,.22)" : "transparent",
                border: active ? "1px solid rgba(255,122,0,.30)" : "1px solid transparent",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.07)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Icon size={13} strokeWidth={active ? 2.5 : 1.8} className="flex-shrink-0" />
              <span className="flex-1 truncate hidden sm:inline">{item.label}</span>
              {count !== null && count > 0 && (
                <span className="text-xs font-bold font-mono px-1 md:px-1.5 py-0.5 rounded-full flex-shrink-0 hidden sm:inline" style={{ background: "rgba(255,122,0,.28)", color: "#FFB066", fontSize: "8px" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ height: "1px", background: "rgba(255,255,255,.07)", margin: "8px 12px" }} />

        {isAdmin && (
          <button onClick={() => handleNavClick("/admin/users")} className="w-full flex items-center gap-2 md:gap-2.5 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl mb-0.5 transition text-left text-xs md:text-sm"
            style={{ fontWeight: location === "/admin/users" ? 700 : 400, color: location === "/admin/users" ? "#fff" : "rgba(255,255,255,.52)", background: location === "/admin/users" ? "rgba(255,122,0,.22)" : "transparent" }}>
            <Settings size={13} strokeWidth={1.8} className="flex-shrink-0" />
            <span className="flex-1 truncate hidden sm:inline">Usuários</span>
          </button>
        )}
        <button onClick={() => handleNavClick("/admin/tutorial")} className="w-full flex items-center gap-2 md:gap-2.5 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg md:rounded-xl transition text-left text-xs md:text-sm"
          style={{ fontWeight: location === "/admin/tutorial" ? 700 : 400, color: location === "/admin/tutorial" ? "#fff" : "rgba(255,255,255,.52)", background: location === "/admin/tutorial" ? "rgba(255,122,0,.22)" : "transparent" }}>
          <HelpCircle size={13} strokeWidth={1.8} className="flex-shrink-0" />
          <span className="flex-1 truncate hidden sm:inline">Tutorial</span>
          <span className="text-xs font-bold px-1 py-0.5 rounded-full hidden sm:inline" style={{ background: "rgba(255,122,0,.28)", color: "#FFB066", fontSize: "7px" }}>NOVO</span>
        </button>
      </nav>

      {/* User */}
      <div className="p-2 md:p-3" style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2.5 rounded-lg md:rounded-xl" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>
          <div className="flex items-center justify-center rounded-lg text-white font-bold flex-shrink-0" style={{ width: "28px", height: "28px", background: "var(--orange)", fontSize: "11px", boxShadow: "0 2px 8px rgba(255,122,0,.40)" }}>
            {user?.name?.charAt(0)?.toUpperCase() || "L"}
          </div>
          <div className="flex-1 min-w-0 hidden sm:block">
            <div className="text-xs font-bold truncate" style={{ color: "#fff" }}>{user?.name || "LARF"}</div>
            <div className="truncate" style={{ color: "rgba(255,255,255,.38)", fontSize: "8px" }}>{user?.role}</div>
          </div>
          <button onClick={logout} title="Sair" className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-lg transition flex-shrink-0"
            style={{ color: "rgba(255,255,255,.38)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--orange)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.38)")}>
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col flex-shrink-0" style={{ width: "232px" }}>
        <Sidebar />
      </div>

      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-60 md:hidden transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-3 md:px-6 gap-2 md:gap-4 flex-shrink-0" style={{ height: "54px", background: "var(--glass-hi)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-xs)" }}>
          <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-1">
            <button className="md:hidden p-1 rounded-lg transition flex-shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: "var(--text-mid)" }}>
              <Menu size={16} />
            </button>
            <img src="/src/assets/larflogo.svg" alt="LARF" className="h-4 md:hidden flex-shrink-0" style={{ filter: "brightness(0) invert(1)", maxWidth: "80px" }} />
            <span className="font-semibold text-xs md:text-sm hidden md:inline text-nowrap" style={{ color: "var(--text-lo)" }}>LARF</span>
            <ChevronRight size={12} className="hidden md:block flex-shrink-0" style={{ color: "var(--border-hi)" }} />
            <span className="font-bold text-xs md:text-base truncate" style={{ color: "var(--navy)" }}>{pageTitle}</span>
          </div>
          <button className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition flex-shrink-0" style={{ color: "var(--text-lo)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--navy-alpha)"; (e.currentTarget as HTMLElement).style.color = "var(--navy)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--text-lo)"; }}>
            <Bell size={14} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
