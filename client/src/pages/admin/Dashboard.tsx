import { trpc } from "../../lib/trpc";
import { fmtCurrency, fmtDate, isOverdue } from "../../lib/utils";
import { KpiCard, Card, CardHeader, CardTitle, CardBody, Table, Th, Td, Tr, Badge, Button, EmptyState } from "../../components/UI";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();

  if (isLoading) return <div className="p-6 text-sm" style={{ color: "var(--text-lo)" }}>Carregando...</div>;

  const f = stats?.financial;
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-lo)" }}>Visão geral da operação LARF</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Receita Recebida" value={fmtCurrency(f?.recebido)} color="var(--green)" />
        <KpiCard label="A Receber" value={fmtCurrency(f?.pendente)} sub={`${stats?.financial.pendente ? "pendente(s)" : ""}`} color="var(--yellow)" />
        <KpiCard label="Resultado" value={fmtCurrency(f?.liquido)} color={(f?.liquido ?? 0) >= 0 ? "var(--green)" : "var(--red)"} />
        <KpiCard label="Projetos Ativos" value={stats?.projects.active ?? 0} sub={`de ${stats?.projects.total ?? 0} total`} color="var(--accent)" />
        <KpiCard label="Clientes Ativos" value={stats?.clients.active ?? 0} sub={`de ${stats?.clients.total ?? 0} total`} color="var(--blue)" />
        <KpiCard label="Horas Registradas" value={`${stats?.horas ?? 0}h`} color="var(--orange)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Active projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projetos em Andamento</CardTitle>
            <Button size="sm" onClick={() => navigate("/admin/projects")}>Ver todos</Button>
          </CardHeader>
          {stats?.recentProjects?.length ? (
            <Table>
              <thead><tr><Th>Projeto</Th><Th>Cliente</Th><Th>Prazo</Th><Th>Status</Th></tr></thead>
              <tbody>
                {stats.recentProjects.map(p => (
                  <Tr key={p.id} onClick={() => navigate("/admin/projects")}>
                    <Td><span className="font-semibold text-sm">{p.title}</span></Td>
                    <Td><span className="text-xs" style={{ color: "var(--text-lo)" }}>{clientMap[p.clientId ?? 0] || "—"}</span></Td>
                    <Td><span className={`text-xs ${isOverdue(p.deadline) ? "text-red-400" : ""}`}>{fmtDate(p.deadline)}</span></Td>
                    <Td><Badge status={p.status} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState icon="rocket" title="Nenhum projeto ativo" action={<Button variant="primary" size="sm" onClick={() => navigate("/admin/projects")}>+ Novo Projeto</Button>} />
          )}}
        </Card>

        {/* Pending invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Vencimentos</CardTitle>
            <Button size="sm" onClick={() => navigate("/admin/invoices")}>Ver todos</Button>
          </CardHeader>
          {stats?.recentInvoices?.length ? (
            <Table>
              <thead><tr><Th>Descrição</Th><Th>Valor</Th><Th>Vence</Th><Th>Status</Th></tr></thead>
              <tbody>
                {stats.recentInvoices.map(i => (
                  <Tr key={i.id} onClick={() => navigate("/admin/invoices")}>
                    <Td><span className="text-sm">{i.description}</span></Td>
                    <Td><span className="font-mono text-sm" style={{ color: "var(--green)" }}>{fmtCurrency(i.value)}</span></Td>
                    <Td><span className={`text-xs ${isOverdue(i.dueDate) ? "text-red-400" : ""}`}>{fmtDate(i.dueDate)}</span></Td>
                    <Td><Badge status={i.status} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState icon="check" title="Tudo em dia!" action={<Button variant="primary" size="sm" onClick={() => navigate("/admin/invoices")}>+ Lançamento</Button>} />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas Abertas</CardTitle>
            <Button size="sm" onClick={() => navigate("/admin/tasks")}>Ver kanban</Button>
          </CardHeader>
          {stats?.recentTasks?.length ? (
            <Table>
              <thead><tr><Th>Tarefa</Th><Th>Prioridade</Th><Th>Status</Th></tr></thead>
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
            <EmptyState icon="check" title="Sem tarefas pendentes" />
          )}
        </Card>

        {/* Financial summary */}
        <Card>
          <CardHeader><CardTitle>Resumo Financeiro</CardTitle></CardHeader>
          <CardBody>
            {(f?.recebido === 0 && f?.despesas === 0) ? (
              <EmptyState icon="money" title="Nenhum lançamento ainda" action={<Button variant="primary" size="sm" onClick={() => navigate("/admin/invoices")}>+ Lançamento</Button>} />
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Receita Recebida", value: fmtCurrency(f?.recebido), color: "var(--green)" },
                  { label: "Despesas Pagas", value: `- ${fmtCurrency(f?.despesas)}`, color: "var(--red)" },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--text-lo)" }}>{r.label}</span>
                    <span className="font-mono font-bold text-sm" style={{ color: r.color }}>{r.value}</span>
                  </div>
                ))}
                <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Resultado Líquido</span>
                    <span className="font-mono font-bold text-lg" style={{ color: (f?.liquido ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                      {fmtCurrency(f?.liquido)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs" style={{ color: "var(--text-lo)" }}>Pipeline em aberto</span>
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
