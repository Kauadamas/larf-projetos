import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { fmtCurrency, fmtDate, today } from "../../lib/utils";
import { PageHeader, Card, Table, Th, Td, Tr, Badge, Button, Modal, FormGroup, Input, Select, Textarea, EmptyState, KpiCard, ConfirmDialog } from "../../components/UI";

const CATEGORIES = ["Software", "Infraestrutura", "Marketing", "Equipamento", "Escritório", "Pessoal", "Impostos", "Serviços", "Outro"];

type FormData = { description: string; category: string; value: string; date: string; projectId: string; paid: "1" | "0"; notes: string };
const empty: FormData = { description: "", category: "Software", value: "", date: today(), projectId: "", paid: "1", notes: "" };

export default function Expenses() {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const utils = trpc.useUtils();

  const { data: expenses = [] } = trpc.expenses.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const create = trpc.expenses.create.useMutation({ onSuccess: () => { toast.success("Despesa registrada!"); utils.expenses.list.invalidate(); utils.dashboard.stats.invalidate(); close(); } });
  const del = trpc.expenses.delete.useMutation({ onSuccess: () => { toast.success("Excluída."); utils.expenses.list.invalidate(); utils.dashboard.stats.invalidate(); } });

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]));
  const totalPago = expenses.filter(e => e.paid).reduce((s, e) => s + Number(e.value), 0);
  const totalPendente = expenses.filter(e => !e.paid).reduce((s, e) => s + Number(e.value), 0);

  // By category
  const catTotals = expenses.filter(e => e.paid).reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.value);
    return acc;
  }, {} as Record<string, number>);

  function close() { setModal(false); }
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  function save() {
    if (!form.description.trim()) { toast.error("Descrição obrigatória"); return; }
    if (!form.value || isNaN(Number(form.value))) { toast.error("Valor inválido"); return; }
    create.mutate({ ...form, projectId: form.projectId ? parseInt(form.projectId) : null, paid: form.paid === "1" } as any);
  }

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader title="Despesas">
        <Button variant="primary" onClick={() => { setForm(empty); setModal(true); }}>+ Nova Despesa</Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <KpiCard label="Pagas" value={fmtCurrency(totalPago)} color="var(--red)" />
        <KpiCard label="A Pagar" value={fmtCurrency(totalPendente)} color="var(--yellow)" />
        <KpiCard label="Total" value={fmtCurrency(totalPago + totalPendente)} color="var(--orange)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <Card>
            {expenses.length ? (
              <Table>
                <thead><tr><Th>Descrição</Th><Th>Categoria</Th><Th>Data</Th><Th>Projeto</Th><Th>Valor</Th><Th>Status</Th><Th></Th></tr></thead>
                <tbody>
                  {expenses.map(e => (
                    <Tr key={e.id}>
                      <Td><span className="font-semibold text-sm">{e.description}</span></Td>
                      <Td><span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>{e.category}</span></Td>
                      <Td><span className="text-sm">{fmtDate(e.date)}</span></Td>
                      <Td><span className="text-xs" style={{ color: "var(--text-lo)" }}>{projectMap[e.projectId ?? 0] || "—"}</span></Td>
                      <Td><span className="font-mono font-bold" style={{ color: "var(--red)" }}>- {fmtCurrency(e.value)}</span></Td>
                      <Td>{e.paid ? <Badge status="ativo" /> : <Badge status="pendente" />}</Td>
                      <Td>
                        <Button size="sm" variant="danger" title="Excluir" onClick={() => setDeleteConfirm({ id: e.id, name: e.description })} icon={<Trash2 size={14} />} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState icon="money" title="Nenhuma despesa registrada ainda"
                action={<Button variant="primary" onClick={() => { setForm(empty); setModal(true); }}>+ Registrar Despesa</Button>} />
            )}
          </Card>
        </div>

        {/* By category */}
        {Object.keys(catTotals).length > 0 && (
          <Card>
            <div className="px-4 py-3 border-b text-sm font-semibold" style={{ borderColor: "var(--border)" }}>Por Categoria</div>
            <div className="p-4 space-y-3">
              {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">{cat}</span>
                    <span className="font-mono text-xs" style={{ color: "var(--red)" }}>- {fmtCurrency(val)}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "var(--glass)" }}>
                    <div className="h-full rounded-full" style={{ background: "var(--red)", opacity: 0.7, width: `${Math.round(val / totalPago * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Modal open={modal} onClose={close} title="Nova Despesa"
        footer={<><Button onClick={close}>Cancelar</Button><Button variant="primary" onClick={save} loading={create.isPending}>Salvar</Button></>}>
        <FormGroup label="Descrição *"><Input value={form.description} onChange={set("description")} placeholder="Ex: Adobe Creative Cloud — mensal" /></FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Categoria">
            <Select value={form.category} onChange={set("category")}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Valor (R$) *"><Input type="number" step="0.01" value={form.value} onChange={set("value")} placeholder="0.00" /></FormGroup>
          <FormGroup label="Data"><Input type="date" value={form.date} onChange={set("date")} /></FormGroup>
          <FormGroup label="Status">
            <Select value={form.paid} onChange={set("paid")}>
              <option value="1">Pago</option>
              <option value="0">Pendente</option>
            </Select>
          </FormGroup>
          <FormGroup label="Projeto (opcional)">
            <Select value={form.projectId} onChange={set("projectId")}>
              <option value="">— Selecione —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </FormGroup>
        </div>
        <FormGroup label="Observações"><Textarea value={form.notes} onChange={set("notes")} placeholder="Notas sobre esta despesa..." /></FormGroup>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir Despesa?"
        description="Esta ação não pode ser desfeita."
        itemName={deleteConfirm?.name}
        loading={del.isPending}
        onConfirm={() => deleteConfirm && del.mutate({ id: deleteConfirm.id })}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </div>
  );
}
