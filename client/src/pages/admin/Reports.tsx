import { trpc } from "../../lib/trpc";
import { fmtCurrency } from "../../lib/utils";
import { Card, CardHeader, CardTitle, CardBody, Table, Th, Td, Tr, Badge, KpiCard } from "../../components/UI";

export default function Reports() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: invoices = [] } = trpc.invoices.list.useQuery();
  const { data: expenses = [] } = trpc.expenses.list.useQuery();
  const { data: timeEntries = [] } = trpc.time.list.useQuery();

  const recebido = invoices.filter(i => i.status === "recebido").reduce((s, i) => s + Number(i.value), 0);
  const totalExp = expenses.filter(e => e.paid).reduce((s, e) => s + Number(e.value), 0);
  const totalHours = timeEntries.reduce((s, e) => s + Number(e.hours), 0);
  const liq = recebido - totalExp;
  const avgRate = totalHours > 0 ? recebido / totalHours : 0;
  const margin = recebido > 0 ? (liq / recebido) * 100 : 0;

  // Revenue per client
  const clientRevenue = clients.map(c => ({
    ...c,
    revenue: invoices.filter(i => i.clientId === c.id && i.status === "recebido").reduce((s, i) => s + Number(i.value), 0),
    projects: projects.filter(p => p.clientId === c.id).length,
  })).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  // Per project
  const projData = projects.map(p => {
    const hours = timeEntries.filter(e => e.projectId === p.id).reduce((s, e) => s + Number(e.hours), 0);
    const rev = invoices.filter(i => i.projectId === p.id && i.status === "recebido").reduce((s, i) => s + Number(i.value), 0);
    return { ...p, hours, revenue: rev, rate: hours > 0 ? rev / hours : 0 };
  });

  // Expenses by category
  const expCats = expenses.filter(e => e.paid).reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.value);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold">Relatórios</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-lo)" }}>Análise completa da operação LARF</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Receita Total" value={fmtCurrency(recebido)} color="var(--green)" />
        <KpiCard label="Despesas Totais" value={fmtCurrency(totalExp)} color="var(--red)" />
        <KpiCard label="Margem Líquida" value={`${margin.toFixed(1)}%`} sub={fmtCurrency(liq)} color={liq >= 0 ? "var(--green)" : "var(--red)"} />
        <KpiCard label="R$/hora Médio" value={fmtCurrency(avgRate)} sub={`${totalHours.toFixed(1)}h registradas`} color="var(--accent)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader><CardTitle>Receita por Cliente</CardTitle></CardHeader>
          {clientRevenue.length ? (
            <Table>
              <thead><tr><Th>Cliente</Th><Th>Projetos</Th><Th>Receita</Th><Th>% Total</Th></tr></thead>
              <tbody>
                {clientRevenue.map(c => (
                  <Tr key={c.id}>
                    <Td><span className="font-semibold text-sm">{c.name}</span></Td>
                    <Td><span className="font-mono text-sm">{c.projects}</span></Td>
                    <Td><span className="font-mono text-sm" style={{ color: "var(--green)" }}>{fmtCurrency(c.revenue)}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--glass)", width: "60px" }}>
                          <div className="h-full rounded-full" style={{ background: "var(--green)", width: `${Math.round(c.revenue / recebido * 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono" style={{ color: "var(--text-lo)" }}>{Math.round(c.revenue / recebido * 100)}%</span>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : <CardBody><p className="text-sm text-center py-6" style={{ color: "var(--text-lo)" }}>Nenhuma receita registrada ainda</p></CardBody>}
        </Card>

        <Card>
          <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
          <CardBody>
            {Object.keys(expCats).length ? (
              <div className="space-y-3">
                {Object.entries(expCats).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium">{cat}</span>
                      <span className="font-mono text-sm" style={{ color: "var(--red)" }}>- {fmtCurrency(val)}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--glass)" }}>
                      <div className="h-full rounded-full" style={{ background: "var(--red)", opacity: 0.65, width: `${Math.round(val / totalExp * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm py-6 text-center" style={{ color: "var(--text-lo)" }}>Nenhuma despesa registrada</p>}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Análise por Projeto</CardTitle></CardHeader>
        <Table>
          <thead><tr><Th>Projeto</Th><Th>Status</Th><Th>Valor Contratado</Th><Th>Receita Recebida</Th><Th>Horas</Th><Th>R$/hora</Th></tr></thead>
          <tbody>
            {projData.length ? projData.map(p => (
              <Tr key={p.id}>
                <Td><span className="font-semibold text-sm">{p.title}</span></Td>
                <Td><Badge status={p.status} /></Td>
                <Td><span className="font-mono text-sm">{fmtCurrency(p.value)}</span></Td>
                <Td><span className="font-mono text-sm" style={{ color: "var(--green)" }}>{fmtCurrency(p.revenue)}</span></Td>
                <Td><span className="font-mono text-sm">{p.hours.toFixed(1)}h</span></Td>
                <Td><span className="font-mono text-sm" style={{ color: p.rate > 0 ? "var(--accent)" : "var(--text-lo)" }}>{p.rate > 0 ? fmtCurrency(p.rate) + "/h" : "—"}</span></Td>
              </Tr>
            )) : (
              <tr><td colSpan={6}><p className="text-sm text-center py-8" style={{ color: "var(--text-lo)" }}>Nenhum projeto registrado</p></td></tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
