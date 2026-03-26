import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { fmtCurrency, fmtDate, isOverdue, today } from "../../lib/utils";
import { PageHeader, Card, Table, Th, Td, Tr, Badge, Button, Modal, FormGroup, Input, Select, Textarea, EmptyState, KpiCard } from "../../components/UI";

type FormData = { description: string; value: string; clientId: string; projectId: string; status: string; dueDate: string; notes: string };
const empty: FormData = { description: "", value: "", clientId: "", projectId: "", status: "pendente", dueDate: "", notes: "" };

export default function Invoices() {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormData>(empty);
  const utils = trpc.useUtils();

  const { data: invoices = [] } = trpc.invoices.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const create = trpc.invoices.create.useMutation({ onSuccess: () => { toast.success("Lançamento criado!"); utils.invoices.list.invalidate(); utils.dashboard.stats.invalidate(); close(); } });
  const markPaid = trpc.invoices.markPaid.useMutation({ onSuccess: () => { toast.success("Marcado como recebido!"); utils.invoices.list.invalidate(); utils.dashboard.stats.invalidate(); } });
  const del = trpc.invoices.delete.useMutation({ onSuccess: () => { toast.success("Excluído."); utils.invoices.list.invalidate(); utils.dashboard.stats.invalidate(); } });

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]));

  const recebido = invoices.filter(i => i.status === "recebido").reduce((s, i) => s + Number(i.value), 0);
  const pendente = invoices.filter(i => i.status === "pendente").reduce((s, i) => s + Number(i.value), 0);

  function close() { setModal(false); }
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  function save() {
    if (!form.description.trim()) { toast.error("Descrição obrigatória"); return; }
    if (!form.value || isNaN(Number(form.value))) { toast.error("Valor inválido"); return; }
    create.mutate({ ...form, clientId: form.clientId ? parseInt(form.clientId) : null, projectId: form.projectId ? parseInt(form.projectId) : null } as any);
  }

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader title="Recebimentos">
        <Button variant="primary" onClick={() => { setForm(empty); setModal(true); }}>+ Novo Lançamento</Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <KpiCard label="Recebido" value={fmtCurrency(recebido)} color="var(--green)" />
        <KpiCard label="A Receber" value={fmtCurrency(pendente)} color="var(--yellow)" />
        <KpiCard label="Total" value={fmtCurrency(recebido + pendente)} color="var(--accent)" />
      </div>

      <Card>
        {invoices.length ? (
          <Table>
            <thead><tr><Th>Descrição</Th><Th>Cliente</Th><Th>Projeto</Th><Th>Valor</Th><Th>Vencimento</Th><Th>Recebido em</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {invoices.map(i => (
                <Tr key={i.id}>
                  <Td><span className="font-semibold text-sm">{i.description}</span></Td>
                  <Td><span className="text-xs" style={{ color: "var(--muted)" }}>{clientMap[i.clientId ?? 0] || "—"}</span></Td>
                  <Td><span className="text-xs" style={{ color: "var(--muted)" }}>{projectMap[i.projectId ?? 0] || "—"}</span></Td>
                  <Td><span className="font-mono font-bold" style={{ color: "var(--green)" }}>{fmtCurrency(i.value)}</span></Td>
                  <Td><span className={`text-sm ${isOverdue(i.dueDate) && i.status === "pendente" ? "text-red-400 font-semibold" : ""}`}>{fmtDate(i.dueDate)}</span></Td>
                  <Td><span className="text-sm">{i.paidAt ? fmtDate(i.paidAt) : "—"}</span></Td>
                  <Td><Badge status={i.status} /></Td>
                  <Td>
                    <div className="flex gap-1.5">
                      {i.status === "pendente" && (
                        <Button size="sm" variant="success" onClick={() => markPaid.mutate({ id: i.id })}>✓ Recebido</Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => { if (confirm("Excluir lançamento?")) del.mutate({ id: i.id }); }}>🗑️</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon="💳" title="Nenhum lançamento registrado ainda"
            action={<Button variant="primary" onClick={() => { setForm(empty); setModal(true); }}>+ Novo Lançamento</Button>} />
        )}
      </Card>

      <Modal open={modal} onClose={close} title="Novo Lançamento"
        footer={<><Button onClick={close}>Cancelar</Button><Button variant="primary" onClick={save} loading={create.isPending}>Salvar</Button></>}>
        <FormGroup label="Descrição *"><Input value={form.description} onChange={set("description")} placeholder="Ex: Site Institucional — 50% entrada" /></FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Valor (R$) *"><Input type="number" step="0.01" value={form.value} onChange={set("value")} placeholder="0.00" /></FormGroup>
          <FormGroup label="Vencimento"><Input type="date" value={form.dueDate} onChange={set("dueDate")} /></FormGroup>
          <FormGroup label="Cliente">
            <Select value={form.clientId} onChange={set("clientId")}>
              <option value="">— Selecione —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Projeto">
            <Select value={form.projectId} onChange={set("projectId")}>
              <option value="">— Selecione —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Status">
            <Select value={form.status} onChange={set("status")}>
              <option value="pendente">Pendente</option>
              <option value="recebido">Recebido</option>
            </Select>
          </FormGroup>
        </div>
        <FormGroup label="Observações"><Textarea value={form.notes} onChange={set("notes")} placeholder="Notas sobre este lançamento..." /></FormGroup>
      </Modal>
    </div>
  );
}
