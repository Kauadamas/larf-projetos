import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useSidebar } from "../hooks/useSidebar";
import { trpc } from "../lib/trpc";
import larfLogo from "../assets/larflogo.svg";
import larfLogoSmall from "../assets/larflogo-clean.svg";
import {
  LayoutGrid, Users, TrendingUp, FolderOpen, CheckSquare,
  Clock, FileText, CreditCard, DollarSign, BarChart3,
  LogOut, Settings, HelpCircle, ChevronRight, Menu, X,
  Sun, Moon, PanelLeftClose, PanelLeftOpen,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { collapsed, toggle: toggleSidebar } = useSidebar();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const badges: Record<string, number> = { clients: stats?.clients.active ?? 0, projects: stats?.projects.active ?? 0 };
  const isActive = (href: string) => href === "/admin" ? location === "/admin" : location.startsWith(href);
  const pageTitle = PAGE_TITLES[location] || "LARF";

  const handleNavClick = (href: string) => {
    navigate(href);
    setMobileOpen(false);
  };

  const isDark = theme === "dark";
  // Sidebar width: 232px expanded, 64px collapsed (icons only)
  const sidebarW = collapsed ? "64px" : "232px";

  const Sidebar = () => (
    <aside
      className="flex flex-col h-full transition-all duration-300"
      style={{
        background: "linear-gradient(180deg, var(--navy-lo) 0%, var(--navy) 100%)",
        boxShadow: "4px 0 32px rgba(47,55,88,.2)",
        borderRight: "1px solid rgba(255,255,255,.06)",
        width: sidebarW,
        minWidth: sidebarW,
        overflow: "hidden",
      }}
    >
      {/* Logo block */}
      <div className="flex items-center justify-between px-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,.08)", flexShrink: 0, minHeight: "54px" }}>
        {!collapsed && (
          <img src={larfLogo} alt="LARF" style={{ height: "22px", width: "auto", maxWidth: "100px", filter: "brightness(0) invert(1)", objectFit: "contain" }} />
        )}
        {collapsed && (
          <img src={larfLogoSmall} alt="L" style={{ height: "28px", width: "28px", filter: "brightness(0) invert(1)", objectFit: "contain", margin: "0 auto" }} />
        )}
        {mobileOpen && !collapsed && (
          <button onClick={() => setMobileOpen(false)} className="md:hidden ml-2 flex-shrink-0">
            <X size={18} style={{ color: "#fff" }} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5" style={{ scrollbarWidth: "none" }}>
        {NAV.map((item, i) => {
          if ("section" in item) {
            if (collapsed) return null;
            return (
              <div key={i} className="px-3 pt-3 pb-1.5 font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.28)", fontSize: "8px" }}>
                {item.section}
              </div>
            );
          }
          const Icon = item.icon;
          const active = isActive(item.href);
          const count = item.badge ? badges[item.badge] : null;
          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              title={collapsed ? item.label : undefined}
              className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl mb-0.5 transition text-left select-none text-sm"
              style={{
                fontWeight: active ? 700 : 400,
                color: active ? "#fff" : "rgba(255,255,255,.65)",
                background: active ? "rgba(255,122,0,.22)" : "transparent",
                border: active ? "1px solid rgba(255,122,0,.30)" : "1px solid transparent",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.07)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.8} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {count !== null && count > 0 && (
                    <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(255,122,0,.28)", color: "#FFB066", fontSize: "8px" }}>
                      {count}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}

        <div style={{ height: "1px", background: "rgba(255,255,255,.07)", margin: "8px 8px" }} />

        {isAdmin && (
          <button
            onClick={() => handleNavClick("/admin/users")}
            title={collapsed ? "Usuários" : undefined}
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl mb-0.5 transition text-left text-sm focus-visible:outline-none"
            style={{
              fontWeight: location === "/admin/users" ? 700 : 400,
              color: location === "/admin/users" ? "#fff" : "rgba(255,255,255,.52)",
              background: location === "/admin/users" ? "rgba(255,122,0,.22)" : "transparent",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <Settings size={16} strokeWidth={1.8} className="flex-shrink-0" />
            {!collapsed && <span className="flex-1 truncate">Usuários</span>}
          </button>
        )}
        <button
          onClick={() => handleNavClick("/admin/tutorial")}
          title={collapsed ? "Tutorial" : undefined}
          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition text-left text-sm focus-visible:outline-none"
          style={{
            fontWeight: location === "/admin/tutorial" ? 700 : 400,
            color: location === "/admin/tutorial" ? "#fff" : "rgba(255,255,255,.52)",
            background: location === "/admin/tutorial" ? "rgba(255,122,0,.22)" : "transparent",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <HelpCircle size={16} strokeWidth={1.8} className="flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">Tutorial</span>
              <span className="text-xs font-bold px-1 py-0.5 rounded-full" style={{ background: "rgba(255,122,0,.28)", color: "#FFB066", fontSize: "7px" }}>NOVO</span>
            </>
          )}
        </button>
      </nav>

      {/* User block */}
      <div className="p-2" style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <div
          className="flex items-center rounded-xl"
          style={{
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.08)",
            padding: collapsed ? "6px" : "8px 10px",
            gap: collapsed ? 0 : "8px",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <div className="flex items-center justify-center rounded-lg text-white font-bold flex-shrink-0" style={{ width: "32px", height: "32px", background: "var(--orange)", fontSize: "12px", boxShadow: "var(--shadow-orange)" }}>
            {user?.name?.charAt(0)?.toUpperCase() || "L"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: "#fff" }}>{user?.name || "LARF"}</div>
              <div className="truncate" style={{ color: "rgba(255,255,255,.52)", fontSize: "8px" }}>{user?.role}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} title="Sair" className="w-8 h-8 flex items-center justify-center rounded-lg transition flex-shrink-0 hover:bg-white/10 focus-visible:outline-none" style={{ color: "rgba(255,255,255,.65)" }}>
              <LogOut size={15} />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={logout} title="Sair" className="w-full flex items-center justify-center mt-1 py-1.5 rounded-lg transition hover:bg-white/10 focus-visible:outline-none" style={{ color: "rgba(255,255,255,.52)" }}>
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Overlay — mobile only */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — fixed mobile slide-in, static desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex flex-col flex-shrink-0 transform transition-all duration-300
          md:static md:translate-x-0 md:z-auto
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: sidebarW }}
      >
        <Sidebar />
      </div>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-3 md:px-5 gap-2 flex-shrink-0"
          style={{ height: "54px", background: "var(--glass-hi)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-xs)" }}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 rounded-lg transition flex-shrink-0 focus-visible:outline-none" onClick={() => setMobileOpen(!mobileOpen)} style={{ color: "var(--text-mid)" }}>
              <Menu size={18} />
            </button>
            {/* Desktop sidebar collapse toggle */}
            <button
              className="hidden md:flex p-2 rounded-lg transition flex-shrink-0 focus-visible:outline-none"
              onClick={toggleSidebar}
              title={collapsed ? "Expandir menu" : "Retrair menu"}
              style={{ color: "var(--text-mid)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--navy-alpha)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
            <img src={larfLogo} alt="LARF" className="h-4 md:hidden flex-shrink-0" style={{ filter: "brightness(0) invert(1)", maxWidth: "80px" }} />
            <span className="font-semibold text-xs hidden md:inline text-nowrap flex-shrink-0" style={{ color: "var(--text-lo)" }}>LARF</span>
            <ChevronRight size={12} className="hidden md:block flex-shrink-0" style={{ color: "var(--border-hi)" }} />
            <span className="font-bold text-xs md:text-base truncate" style={{ color: "var(--navy)" }}>{pageTitle}</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition flex-shrink-0 focus-visible:outline-none"
            style={{ color: "var(--text-lo)", border: "1px solid var(--border)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--navy-alpha)"; (e.currentTarget as HTMLElement).style.color = "var(--orange)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-lo)"; }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
