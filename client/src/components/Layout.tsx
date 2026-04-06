import { useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useSidebar } from "../hooks/useSidebar";
import { trpc } from "../lib/trpc";
import larfLogo from "../assets/larflogo.svg";
import {
  LayoutGrid, Users, TrendingUp, FolderOpen, CheckSquare,
  Clock, FileText, CreditCard, DollarSign, BarChart3,
  LogOut, Settings, HelpCircle, ChevronRight, Menu, X,
  Sun, Moon,
} from "lucide-react";

type NavItem = { section: string } | { label: string; icon: React.ComponentType<any>; href: string; badge?: string };

const NAV: NavItem[] = [
  { section: "Principal" },
  { label: "Dashboard",    icon: LayoutGrid,   href: "/admin" },
  { section: "Clientes" },
  { label: "Clientes",     icon: Users,         href: "/admin/clients",  badge: "clients" },
  { label: "Pipeline",     icon: TrendingUp,    href: "/admin/pipeline" },
  { section: "Projetos" },
  { label: "Projetos",     icon: FolderOpen,    href: "/admin/projects", badge: "projects" },
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
  "/admin": "Dashboard", "/admin/clients": "Clientes", "/admin/pipeline": "Pipeline",
  "/admin/projects": "Projetos", "/admin/tasks": "Tarefas", "/admin/time": "Horas",
  "/admin/proposals": "Propostas", "/admin/invoices": "Recebimentos", "/admin/expenses": "Despesas",
  "/admin/reports": "Relatórios", "/admin/users": "Usuários", "/admin/tutorial": "Tutorial",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  // mobileOpen: controla o drawer no mobile
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  // collapsed: controla se o menu está visível no desktop (persiste em localStorage)
  const { collapsed, toggle: toggleSidebar } = useSidebar();
  const { data: stats } = trpc.dashboard.stats.useQuery();

  const badges: Record<string, number> = {
    clients: stats?.clients.active ?? 0,
    projects: stats?.projects.active ?? 0,
  };
  const isActive = (href: string) =>
    href === "/admin" ? location === "/admin" : location.startsWith(href);
  const pageTitle = PAGE_TITLES[location] || "LARF";
  const isDark = theme === "dark";

  const handleNavClick = (href: string) => {
    navigate(href);
    setMobileOpen(false);
  };

  // Sidebar is visible on desktop when !collapsed, on mobile when mobileOpen
  const sidebarVisible = {
    desktop: !collapsed,
    mobile: mobileOpen,
  };

  const SidebarContent = () => (
    <aside
      className="flex flex-col h-full w-full"
      style={{
        background: "linear-gradient(180deg, var(--navy-lo) 0%, var(--navy) 100%)",
        boxShadow: "4px 0 32px rgba(47,55,88,.2)",
        borderRight: "1px solid rgba(255,255,255,.06)",
      }}
    >
      {/* Logo + close button */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,.08)", flexShrink: 0, minHeight: "54px" }}
      >
        <img
          src={larfLogo}
          alt="LARF"
          style={{ height: "22px", width: "auto", maxWidth: "110px", filter: "brightness(0) invert(1)", objectFit: "contain" }}
        />
        {/* X button — visible on mobile OR when sidebar is open on desktop */}
        <button
          onClick={() => { setMobileOpen(false); if (!mobileOpen) toggleSidebar(); }}
          className="p-1 rounded-lg transition hover:bg-white/10 focus-visible:outline-none"
          title="Fechar menu"
        >
          <X size={16} style={{ color: "rgba(255,255,255,.65)" }} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2" style={{ scrollbarWidth: "none" }}>
        {NAV.map((item, i) => {
          if ("section" in item) return (
            <div key={i} className="px-3 pt-4 pb-1.5 font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.28)", fontSize: "8px" }}>
              {item.section}
            </div>
          );
          const Icon = item.icon;
          const active = isActive(item.href);
          const count = item.badge ? badges[item.badge] : null;
          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 transition text-left select-none text-sm"
              style={{
                fontWeight: active ? 700 : 400,
                color: active ? "#fff" : "rgba(255,255,255,.65)",
                background: active ? "rgba(255,122,0,.22)" : "transparent",
                border: active ? "1px solid rgba(255,122,0,.30)" : "1px solid transparent",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.07)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.8} className="flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {count !== null && count > 0 && (
                <span className="font-bold font-mono px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(255,122,0,.28)", color: "#FFB066", fontSize: "8px" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ height: "1px", background: "rgba(255,255,255,.07)", margin: "8px 12px" }} />

        {isAdmin && (
          <button
            onClick={() => handleNavClick("/admin/users")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 transition text-left text-sm focus-visible:outline-none"
            style={{
              fontWeight: location === "/admin/users" ? 700 : 400,
              color: location === "/admin/users" ? "#fff" : "rgba(255,255,255,.52)",
              background: location === "/admin/users" ? "rgba(255,122,0,.22)" : "transparent",
            }}
          >
            <Settings size={16} strokeWidth={1.8} className="flex-shrink-0" />
            <span className="flex-1 truncate">Usuários</span>
          </button>
        )}

        <button
          onClick={() => handleNavClick("/admin/tutorial")}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left text-sm focus-visible:outline-none"
          style={{
            fontWeight: location === "/admin/tutorial" ? 700 : 400,
            color: location === "/admin/tutorial" ? "#fff" : "rgba(255,255,255,.52)",
            background: location === "/admin/tutorial" ? "rgba(255,122,0,.22)" : "transparent",
          }}
        >
          <HelpCircle size={16} strokeWidth={1.8} className="flex-shrink-0" />
          <span className="flex-1 truncate">Tutorial</span>
          <span className="font-bold px-1 py-0.5 rounded-full" style={{ background: "rgba(255,122,0,.28)", color: "#FFB066", fontSize: "7px" }}>NOVO</span>
        </button>
      </nav>

      {/* User */}
      <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>
          <div className="flex items-center justify-center rounded-lg text-white font-bold flex-shrink-0" style={{ width: "32px", height: "32px", background: "var(--orange)", fontSize: "12px", boxShadow: "var(--shadow-orange)" }}>
            {user?.name?.charAt(0)?.toUpperCase() || "L"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate" style={{ color: "#fff" }}>{user?.name || "LARF"}</div>
            <div className="truncate" style={{ color: "rgba(255,255,255,.52)", fontSize: "8px" }}>{user?.role}</div>
          </div>
          <button
            onClick={logout}
            title="Sair"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition flex-shrink-0 hover:bg-white/10 focus-visible:outline-none"
            style={{ color: "rgba(255,255,255,.65)" }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Overlay — fecha ao clicar fora (mobile E desktop quando aberto) ── */}
      {(mobileOpen || (!collapsed)) && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: mobileOpen ? "rgba(0,0,0,.5)" : "transparent" }}
          onClick={() => { setMobileOpen(false); }}
        />
      )}

      {/* ── Sidebar desktop — estática, empurra o conteúdo ── */}
      <div
        className="hidden md:flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{ width: collapsed ? "0px" : "232px", minWidth: collapsed ? "0px" : "232px" }}
      >
        {!collapsed && <SidebarContent />}
      </div>

      {/* ── Sidebar mobile — drawer por cima ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: "232px" }}
      >
        <SidebarContent />
      </div>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-3 md:px-5 gap-2 flex-shrink-0"
          style={{ height: "54px", background: "var(--glass-hi)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-xs)" }}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {/* Mobile: hamburger */}
            <button
              className="md:hidden p-2 rounded-lg transition flex-shrink-0 focus-visible:outline-none"
              onClick={() => setMobileOpen(true)}
              style={{ color: "var(--text-mid)" }}
            >
              <Menu size={18} />
            </button>

            {/* Desktop: hamburger para abrir/fechar */}
            <button
              className="hidden md:flex p-2 rounded-lg transition flex-shrink-0 focus-visible:outline-none"
              onClick={toggleSidebar}
              title={collapsed ? "Abrir menu" : "Fechar menu"}
              style={{ color: "var(--text-mid)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--navy-alpha)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <Menu size={18} />
            </button>

            <img src={larfLogo} alt="LARF" className="h-4 md:hidden flex-shrink-0" style={{ filter: "brightness(0) invert(1)", maxWidth: "80px" }} />
            <span className="font-semibold text-xs hidden md:inline text-nowrap flex-shrink-0" style={{ color: "var(--text-lo)" }}>LARF</span>
            <ChevronRight size={12} className="hidden md:block flex-shrink-0" style={{ color: "var(--border-hi)" }} />
            <span className="font-bold text-xs md:text-base truncate" style={{ color: "var(--navy)" }}>{pageTitle}</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Tema claro" : "Tema escuro"}
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
