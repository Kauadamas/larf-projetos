import { useEffect, useState } from "react";
import { trpc } from "../../lib/trpc";
import { fmtCurrency, fmtDate, isOverdue } from "../../lib/utils";
import {
  KpiCard, Card, CardHeader, CardTitle, CardBody, Table, Th, Td, Tr, Badge,
  Button, EmptyState, StatsGrid, Tabs, Alert, ProgressBar, Avatar, Tag, DataTable
} from "../../components/UI";
import { useLocation } from "wouter";
import { TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle2, DollarSign, Users, FolderOpen } from "lucide-react";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const f = stats?.financial;
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));

  // Prepare stats for grid
  const statsData = [
    { label: "Total Recebido", value: fmtCurrency(f?.recebido), color: "var(--green)", icon: TrendingUp },
    { label: "Pendente", value: fmtCurrency(f?.pendente), color: "var(--yellow)", icon: Clock },
    { label: "Resultado", value: fmtCurrency(f?.liquido), color: (f?.liquido ?? 0) >= 0 ? "var(--green)" : "var(--red)", icon: TrendingDown },
    { label: "Projetos Ativos", value: stats?.projects.active ?? 0, color: "var(--accent)", icon: FolderOpen },
    { label: "Clientes", value: stats?.clients.active ?? 0, color: "var(--blue)", icon: Users },
    { label: "Horas", value: `${stats?.horas ?? 0}h`, color: "var(--orange)", icon: Clock },
  ];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* ═══════════════════════════════════════════════════════════════════ 
          HERO SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="px-6 pt-8 pb-6 animate-fade"
        style={{
          background: `linear-gradient(135deg, rgba(59,130,246,.05) 0%, rgba(0,217,255,.02) 100%)`,
          borderBottom: "1px solid rgba(59,130,246,.1)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
              <p style={{ color: "var(--muted)" }} className="text-sm">
                Visão em tempo real da operação LARF — últimas 24 horas
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate("/admin/projects")}>
                Projetos
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate("/admin/invoices")}>
                + Novo
              </Button>
            </div>
          </div>

          {/* Alert Section */}
          {isOverdue(stats?.recentInvoices?.[0]?.dueDate) && (
            <Alert
              type="warning"
              title="Ação necessária"
              message={`${stats?.recentInvoices?.filter(i => isOverdue(i.dueDate)).length || 0} faturas vencidas aguardando revisão`}
              action={{ label: "Revisar", onClick: () => navigate("/admin/invoices") }}
            />
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ 
          MAIN CONTENT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <StatsGrid stats={statsData} isLoading={isLoading} />
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Tabs
            tabs={[
              { id: "overview", label: "Visão Geral", icon: TrendingUp },
              { id: "financial", label: "Financeiro", icon: DollarSign },
              { id: "projects", label: "Projetos", icon: FolderOpen },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Content Sections */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => navigate("/admin/invoices")}
                    className="p-4 rounded-lg text-left transition-all hover:bg-opacity-50"
                    style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.1)" }}
                  >
                    <div style={{ color: "var(--muted)" }} className="text-xs">Adicionar Fatura</div>
                    <div className="font-bold text-sm mt-2">+ Lançamento</div>
                  </button>
                  <button
                    onClick={() => navigate("/admin/projects")}
                    className="p-4 rounded-lg text-left transition-all hover:bg-opacity-50"
                    style={{ background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.1)" }}
                  >
                    <div style={{ color: "var(--muted)" }} className="text-xs">Novo Projeto</div>
                    <div className="font-bold text-sm mt-2">+ Criar</div>
                  </button>
                  <button
                    onClick={() => navigate("/admin/tasks")}
                    className="p-4 rounded-lg text-left transition-all hover:bg-opacity-50"
                    style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.1)" }}
                  >
                    <div style={{ color: "var(--muted)" }} className="text-xs">Gerenciar Tarefas</div>
                    <div className="font-bold text-sm mt-2">Kanban</div>
                  </button>
                  <button
                    onClick={() => navigate("/admin/clients")}
                    className="p-4 rounded-lg text-left transition-all hover:bg-opacity-50"
                    style={{ background: "rgba(249,115,22,.08)", border: "1px solid rgba(249,115,22,.1)" }}
                  >
                    <div style={{ color: "var(--muted)" }} className="text-xs">Clientes</div>
                    <div className="font-bold text-sm mt-2">Gerenciar</div>
                  </button>
                </div>
              </CardBody>
            </Card>

            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Projetos em Andamento</CardTitle>
                <Button size="sm" onClick={() => navigate("/admin/projects")}>
                  Ver todos
                </Button>
              </CardHeader>
              {isLoading ? (
                <CardBody>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skeleton skeleton-text" />
                    ))}
                  </div>
                </CardBody>
              ) : stats?.recentProjects?.length ? (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <Th>Projeto</Th>
                        <Th>Cliente</Th>
                        <Th>Progresso</Th>
                        <Th>Prazo</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentProjects.map((p: any) => (
                        <tr key={p.id} onClick={() => navigate("/admin/projects")} style={{ cursor: "pointer" }}>
                          <Td>
                            <span className="font-semibold text-sm">{p.title}</span>
                          </Td>
                          <Td>
                            <span className="text-xs" style={{ color: "var(--muted)" }}>
                              {clientMap[p.clientId ?? 0] || "—"}
                            </span>
                          </Td>
                          <Td>
                            <ProgressBar value={p.progress ?? 0} max={100} />
                          </Td>
                          <Td>
                            <span className={`text-xs ${isOverdue(p.deadline) ? "text-red-500" : ""}`}>
                              {fmtDate(p.deadline)}
                            </span>
                          </Td>
                          <Td>
                            <Badge status={p.status} />
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <CardBody>
                  <EmptyState
                    icon="🚀"
                    title="Nenhum projeto ativo"
                    action={
                      <Button variant="primary" size="sm" onClick={() => navigate("/admin/projects")}>
                        + Novo Projeto
                      </Button>
                    }
                  />
                </CardBody>
              )}
            </Card>
          </div>
        )}

        {activeTab === "financial" && (
          <div className="space-y-6 animate-fade">
            {/* Financial Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardBody>
                  {f?.recebido === 0 && f?.despesas === 0 ? (
                    <EmptyState
                      icon="💰"
                      title="Nenhum lançamento"
                      action={
                        <Button variant="primary" size="sm" onClick={() => navigate("/admin/invoices")}>
                          + Lançamento
                        </Button>
                      }
                    />
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm" style={{ color: "var(--muted)" }}>
                            Receita
                          </span>
                          <span className="font-mono font-bold text-lg" style={{ color: "var(--green)" }}>
                            {fmtCurrency(f?.recebido)}
                          </span>
                        </div>
                        <ProgressBar value={f?.recebido ?? 0} max={(f?.recebido ?? 0) + (f?.pendente ?? 0)} color="var(--green)" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm" style={{ color: "var(--muted)" }}>
                            Despesas
                          </span>
                          <span className="font-mono font-bold text-lg" style={{ color: "var(--red)" }}>
                            - {fmtCurrency(f?.despesas)}
                          </span>
                        </div>
                        <ProgressBar value={f?.despesas ?? 0} max={(f?.recebido ?? 0) + (f?.despesas ?? 0)} color="var(--red)" />
                      </div>
                      <div style={{ borderTop: "1px solid rgba(59,130,246,.1)", paddingTop: "16px" }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">Resultado Líquido</span>
                          <span className="font-mono font-bold text-xl" style={{ color: (f?.liquido ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                            {fmtCurrency(f?.liquido)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Pending Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Vencimentos</CardTitle>
                  <Button size="sm" onClick={() => navigate("/admin/invoices")}>
                    Ver todos
                  </Button>
                </CardHeader>
                {stats?.recentInvoices?.length ? (
                  <CardBody className="space-y-3">
                    {stats.recentInvoices.slice(0, 4).map((i: any) => (
                      <div
                        key={i.id}
                        className="p-3 rounded-lg border transition-all hover:border-accent"
                        style={{ borderColor: "rgba(59,130,246,.2)", background: "rgba(59,130,246,.03)" }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{i.description}</span>
                          <Tag label={isOverdue(i.dueDate) ? "VENCIDO" : "Pendente"} variant={isOverdue(i.dueDate) ? "primary" : "secondary"} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: "var(--muted)" }}>
                            Vence em {fmtDate(i.dueDate)}
                          </span>
                          <span className="font-mono font-bold" style={{ color: "var(--accent)" }}>
                            {fmtCurrency(i.value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardBody>
                ) : (
                  <CardBody>
                    <EmptyState icon="✅" title="Tudo em dia!" />
                  </CardBody>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-6 animate-fade">
            <Card>
              <CardHeader>
                <CardTitle>Projetos</CardTitle>
                <Button size="sm" variant="primary" onClick={() => navigate("/admin/projects")}>
                  Gerenciar
                </Button>
              </CardHeader>
              {projects.length ? (
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.slice(0, 6).map((p: any) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-lg border transition-all hover:border-accent cursor-pointer"
                        onClick={() => navigate("/admin/projects")}
                        style={{ borderColor: "rgba(59,130,246,.2)", background: "rgba(59,130,246,.03)" }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">{p.title}</h4>
                          <Badge status={p.status} />
                        </div>
                        <p style={{ color: "var(--muted)", fontSize: "12px" }} className="mb-3">
                          {clientMap[p.clientId ?? 0] || "—"}
                        </p>
                        <ProgressBar value={p.progress ?? 0} max={100} label="Progresso" />
                      </div>
                    ))}
                  </div>
                </CardBody>
              ) : (
                <CardBody>
                  <EmptyState
                    icon="📦"
                    title="Sem projetos"
                    action={
                      <Button variant="primary" size="sm" onClick={() => navigate("/admin/projects")}>
                        + Novo
                      </Button>
                    }
                  />
                </CardBody>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
