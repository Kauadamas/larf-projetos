import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { trpc } from "../lib/trpc";
import { useState, useEffect } from "react";
import {
  LayoutGrid, Users, TrendingUp, FolderOpen, CheckSquare, Clock,
  FileText, CreditCard, DollarSign, BarChart3, LogOut, Settings,
  ChevronRight, Menu, X,
} from "lucide-react";

const navItems = [
  { section: "Overview" },
  { label: "Dashboard", icon: LayoutGrid, href: "/admin" },
  { section: "Clients" },
  { label: "Clients", icon: Users, href: "/admin/clients", badge: "clients" },
  { label: "Sales Pipeline", icon: TrendingUp, href: "/admin/pipeline" },
  { section: "Projects" },
  { label: "Projects", icon: FolderOpen, href: "/admin/projects", badge: "projects" },
  { label: "Tasks", icon: CheckSquare, href: "/admin/tasks" },
  { label: "Time Tracking", icon: Clock, href: "/admin/time" },
  { section: "Financial" },
  { label: "Proposals", icon: FileText, href: "/admin/proposals" },
  { label: "Invoices", icon: CreditCard, href: "/admin/invoices" },
  { label: "Expenses", icon: DollarSign, href: "/admin/expenses" },
  { section: "Analytics" },
  { label: "Reports", icon: BarChart3, href: "/admin/reports" },
] as const;

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const badges: Record<string, number> = {
    clients: stats?.clients.active ?? 0,
    projects: stats?.projects.active ?? 0,
  };

  const Sidebar = ({ className = "" }: { className?: string }) => (
    <aside
      className={`${className} w-56 flex-shrink-0 flex flex-col h-screen transition-smooth`}
      style={{
        background: "var(--surface)",
        borderRight: "1px solid rgba(59,130,246,.1)",
      }}
    >
      {/* Logo */}
      <div
        className="p-4 flex items-center gap-3 transition-smooth"
        style={{ borderBottom: "1px solid rgba(59,130,246,.1)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 transition-smooth hover:scale-110"
          style={{
            background: "linear-gradient(135deg, var(--accent) 0%, #00d9ff 100%)",
            boxShadow: "0 0 16px rgba(59,130,246,.3)",
          }}
        >
          L
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight">LARF</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Platform
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item, i) => {
          if ("section" in item) {
            return (
              <div
                key={i}
                className="text-xs font-semibold uppercase tracking-widest px-3 pt-5 pb-2"
                style={{ color: "var(--muted)", fontSize: "10px", letterSpacing: "0.5px" }}
              >
                {item.section}
              </div>
            );
          }
          const Icon = item.icon;
          const active =
            location === item.href ||
            (item.href !== "/admin" && location.startsWith(item.href));
          const count = "badge" in item ? badges[item.badge as string] : null;
          return (
            <button
              key={item.href}
              onClick={() => {
                navigate(item.href);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth hover:bg-opacity-50 group"
              style={{
                color: active ? "var(--accent)" : "var(--muted)",
                background: active
                  ? "rgba(59,130,246,.1)"
                  : "transparent",
              }}
            >
              <Icon size={16} className="flex-shrink-0 transition-smooth group-hover:scale-110" />
              <span className="flex-1 text-left">{item.label}</span>
              {count !== null && count > 0 && (
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full text-white text-center"
                  style={{
                    background: "var(--accent)",
                    fontSize: "10px",
                    minWidth: "20px",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
        {isAdmin && (
          <button
            onClick={() => {
              navigate("/admin/users");
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth hover:bg-opacity-50 group"
            style={{
              color:
                location === "/admin/users" ? "var(--accent)" : "var(--muted)",
            }}
          >
            <Settings size={16} className="flex-shrink-0 transition-smooth group-hover:scale-110" />
            <span className="flex-1 text-left">Users</span>
          </button>
        )}
      </nav>

      {/* User Profile */}
      <div
        className="p-3 transition-smooth"
        style={{
          borderTop: "1px solid rgba(59,130,246,.1)",
          background: "rgba(59,130,246,.05)",
        }}
      >
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth hover:bg-opacity-50 group"
          style={{
            background: "rgba(59,130,246,.1)",
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-smooth group-hover:scale-110"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, #00d9ff 100%)",
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "L"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{user?.name || "LARF"}</div>
            <div
              className="text-xs"
              style={{ color: "var(--muted)", fontSize: "10px" }}
            >
              {user?.role
                ? user.role.charAt(0).toUpperCase() +
                  user.role.slice(1).toLowerCase()
                : "—"}
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-lg transition-smooth hover:bg-opacity-70"
            style={{
              color: "var(--muted)",
              background: "rgba(59,130,246,.1)",
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden animate-fade"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className="fixed inset-y-0 left-0 w-56 z-50 lg:hidden transform transition-transform"
        style={{
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div
          className="lg:hidden flex items-center justify-between p-4 border-b transition-smooth"
          style={{
            background: "var(--surface)",
            borderColor: "rgba(59,130,246,.1)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-smooth hover:bg-opacity-50"
            style={{ background: "rgba(59,130,246,.1)" }}
          >
            {sidebarOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, var(--accent) 0%, #00d9ff 100%)",
            }}
          >
            L
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
