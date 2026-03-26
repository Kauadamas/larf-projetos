import { useLocation } from "wouter";
import { trpc } from "../../lib/trpc";
import { fmtCurrency, fmtDate, isOverdue } from "../../lib/utils";
import { KpiCard, Card, CardHeader, CardTitle, CardBody, Table, Th, Td, Tr, Badge, Button, EmptyState, ProgressBar } from "../../components/UI";
import { TrendingUp, DollarSign, FolderOpen, Users, Clock, Activity } from "lucide-react";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
  const f = stats?.financial;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 gap-3 mb-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton rounded-lg" style={{ height: "88px" }} />
          ))}
        </div>
      </div>
    );
  }

  const liquido = (f?.liquido ?? 0);

  return (
    <div className="p-6 max-w-7xl animate-fade">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-hi)" }}>Dashboard</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-lo)" }}>Visão geral da operação LARF</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <KpiCard label="Receita Recebida"  value={fmtCurrency(f?.recebido)}  color="var(--green)"  icon={<DollarSign size={16}/>} />
        <KpiCard label="A Receber"         value={fmtCurrency(f?.pendente)}  color="var(--yellow)" icon={<TrendingUp size={16}/>} sub={`${(stats?.financial.pendente ?? 0) > 0 ? "pendente" : "em dia"}`} />
        <KpiCard label="Resultado Líquido" value={fmtCurrency(liquido)}      color={liquido >= 0 ? "var(--green)" : "var(--red)"} icon={<Activity size={16}/>} />
        <KpiCard label="Projetos Ativos"   value={stats?.projects.active ?? 0} color="var(--accent)" icon={<FolderOpen size={16}/>} sub={`de ${stats?.projects.total ?? 0} total`} />
        <KpiCard label="Clientes Ativos"   value={stats?.clients.active ?? 0}  color="var(--blue)"   icon={<Users size={16}/>}      sub={`de ${stats?.clients.total ?? 0} total`} />
        <KpiCard label="Horas Registradas" value={`${stats?.horas ?? 0}h`}     color="var(--orange)" icon={<Clock size={16}/>} />
      </div>

      {/* Main grid */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* Active projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projetos em Andamento</CardTitle>
            <Button size="xs" variant="ghost" onClick={() => navigate("/admin/projects")}>Ver todos →</Button>
          </CardHeader>
          {stats?.recentProjects?.length ? (
            <Table>
              <thead>
                <tr><Th>Projeto</Th><Th>Cliente</Th><Th>Prazo</Th><Th>Status</Th></tr>
              </thead>
              <tbody>
                {stats.recentProjects.map(p => (
                  <Tr key={p.id} onClick={() => navigate("/admin/projects")}>
                    <Td><span className="font-medium text-sm" style={{ color: "var(--text-hi)" }}>{p.title}</span></Td>
                    <Td><span className="text-xs" style={{ color: "var(--text-lo)" }}>{clientMap[p.clientId ?? 0] || "—"}</span></Td>
                    <Td><span className={`text-xs ${isOverdue(p.deadline) ? "text-red" : ""}`} style={{ color: isOverdue(p.deadline) ? undefined : "var(--text-lo)" }}>{fmtDate(p.deadline)}</span></Td>
                    <Td><Badge status={p.status} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState icon="🚀" title="Nenhum projeto ativo"
              action={<Button variant="primary" size="xs" onClick={() => navigate("/admin/projects")}>+ Novo Projeto</Button>} />
          )}
        </Card>

        {/* Pending invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Vencimentos Pendentes</CardTitle>
            <Button size="xs" variant="ghost" onClick={() => navigate("/admin/invoices")}>Ver todos →</Button>
          </CardHeader>
          {stats?.recentInvoices?.length ? (
            <Table>
              <thead>
                <tr><Th>Descrição</Th><Th right>Valor</Th><Th>Vence</Th></tr>
              </thead>
              <tbody>
                {stats.recentInvoices.map(i => (
                  <Tr key={i.id} onClick={() => navigate("/admin/invoices")}>
                    <Td><span className="text-sm">{i.description}</span></Td>
                    <Td right mono><span className="text-green">{fmtCurrency(i.value)}</span></Td>
                    <Td><span className={`text-xs ${isOverdue(i.dueDate) ? "text-red" : ""}`} style={{ color: isOverdue(i.dueDate) ? undefined : "var(--text-lo)" }}>{fmtDate(i.dueDate)}</span></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState icon="✅" title="Tudo em dia!"
              action={<Button variant="primary" size="xs" onClick={() => navigate("/admin/invoices")}>+ Lançamento</Button>} />
          )}
        </Card>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas Abertas</CardTitle>
            <Button size="xs" variant="ghost" onClick={() => navigate("/admin/tasks")}>Ver kanban →</Button>
          </CardHeader>
          {stats?.recentTasks?.length ? (
            <Table>
              <thead>
                <tr><Th>Tarefa</Th><Th>Prioridade</Th><Th>Status</Th></tr>
              </thead>
              <tbody>
                {stats.recentTasks.map(t => (
                  <Tr key={t.id} onClick={() => navigate("/admin/tasks")}>
                    <Td><span className="text-sm">{t.title}</span></Td>
                    <Td><Badge status={t.priority} /></Td>
                    <Td><Badge status={t.status} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState icon="✅" title="Sem tarefas pendentes" />
          )}
        </Card>

        {/* Financial summary */}
        <Card>
          <CardHeader><CardTitle>Resultado Financeiro</CardTitle></CardHeader>
          <CardBody>
            {(f?.recebido === 0 && f?.despesas === 0) ? (
              <EmptyState icon="💰" title="Nenhum lançamento ainda"
                action={<Button variant="primary" size="xs" onClick={() => navigate("/admin/invoices")}>+ Lançamento</Button>} />
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Receita Recebida", value: fmtCurrency(f?.recebido), color: "var(--green)" },
                  { label: "Despesas Pagas",   value: `- ${fmtCurrency(f?.despesas)}`, color: "var(--red)" },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--text-lo)" }}>{r.label}</span>
                    <span className="font-mono font-semibold text-sm" style={{ color: r.color }}>{r.value}</span>
                  </div>
                ))}

                <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-hi)" }}>Resultado</span>
                  <span className="font-mono font-bold text-lg" style={{ color: liquido >= 0 ? "var(--green)" : "var(--red)" }}>
                    {fmtCurrency(liquido)}
                  </span>
                </div>

                {(f?.recebido ?? 0) > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span style={{ color: "var(--text-lo)" }}>Margem</span>
                      <span style={{ color: "var(--text-mid)" }}>{Math.round(((f?.recebido ?? 0) - (f?.despesas ?? 0)) / (f?.recebido ?? 1) * 100)}%</span>
                    </div>
                    <ProgressBar value={Math.max(0, liquido)} max={f?.recebido ?? 1} color="var(--green)" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs" style={{ color: "var(--text-lo)" }}>Pipeline aberto</span>
                  <span className="font-mono text-sm" style={{ color: "var(--yellow)" }}>{fmtCurrency(f?.pipelineTotal)}</span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
