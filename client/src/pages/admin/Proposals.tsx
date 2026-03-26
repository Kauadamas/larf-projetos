import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { fmtCurrency, fmtDate } from "../../lib/utils";
import { Card, Table, Th, Td, Tr, Badge, Button, Modal, FormGroup, Input, Select, Textarea, EmptyState, KpiCard } from "../../components/UI";

type Item = { desc: string; qty: number; unit: string; value: number };
type FormData = { title: string; clientId: string; projectId: string; status: string; validityDays: string; discount: string; notes: string };
const empty: FormData = { title: "", clientId: "", projectId: "", status: "rascunho", validityDays: "15", discount: "0", notes: "" };

export default function Proposals() {
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [items, setItems] = useState<Item[]>([{ desc: "", qty: 1, unit: "serviço", value: 0 }]);
  const utils = trpc.useUtils();

  const { data: proposals = [] } = trpc.proposals.list.useQuery();
  const { data: viewData } = trpc.proposals.getById.useQuery({ id: viewId! }, { enabled: !!viewId });
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const create = trpc.proposals.create.useMutation({ onSuccess: () => { toast.success("Proposta criada!"); utils.proposals.list.invalidate(); closeModal(); } });
  const update = trpc.proposals.update.useMutation({ onSuccess: () => { toast.success("Atualizada!"); utils.proposals.list.invalidate(); closeModal(); } });
  const del = trpc.proposals.delete.useMutation({ onSuccess: () => { toast.success("Excluída."); utils.proposals.list.invalidate(); } });

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: proposals.length,
    rascunho: proposals.filter(p => p.status === "rascunho").length,
    enviada: proposals.filter(p => p.status === "enviada").length,
    aprovada: proposals.filter(p => p.status === "aprovada").reduce((s, p) => s + Number(p.total || 0), 0),
  };

  function openCreate() {
    setEditId(null); setForm(empty); setItems([{ desc: "", qty: 1, unit: "serviço", value: 0 }]); setModal(true);
  }
  function openEdit(p: typeof proposals[0]) {
    setEditId(p.id);
    setForm({ title: p.title, clientId: p.clientId ? String(p.clientId) : "", projectId: p.projectId ? String(p.projectId) : "", status: p.status, validityDays: String(p.validityDays || 15), discount: String(p.discount || "0"), notes: p.notes || "" });
    try { setItems(JSON.parse(p.items || "[]")); } catch { setItems([]); }
    setModal(true);
  }
  function closeModal() { setModal(false); }
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const subtotal = items.reduce((s, i) => s + (i.qty * i.value), 0);
  const discount = parseFloat(form.discount) || 0;
  const total = subtotal - discount;

  function save() {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    const d = {
      title: form.title, clientId: form.clientId ? parseInt(form.clientId) : null,
      projectId: form.projectId ? parseInt(form.projectId) : null,
      status: form.status as any, validityDays: parseInt(form.validityDays) || 15,
      items: JSON.stringify(items), subtotal: String(subtotal), discount: String(discount), total: String(total), notes: form.notes,
    };
    if (editId) update.mutate({ id: editId, ...d });
    else create.mutate(d);
  }

  function updateItem(i: number, k: keyof Item, v: string | number) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: k === "desc" || k === "unit" ? v : Number(v) } : item));
  }

  return (
    <div className="p-6 max-w-7xl">
      {/* Hero Section */}
      <div style={{ background: `linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))` }} className="rounded-2xl p-6 pt-8 mb-6 border border-blue-500/20">
        <h1 className="text-2xl font-bold mb-1">Propostas Comerciais</h1>
        <div style={{ color: "var(--muted)" }} className="text-sm mb-4">Gerenciador de propostas, orçamentos e cotações</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total" value={stats.total} color="var(--blue)" />
          <KpiCard label="Rascunhos" value={stats.rascunho} color="var(--muted2)" />
          <KpiCard label="Enviadas" value={stats.enviada} color="var(--accent)" />
          <KpiCard label="Aprovadas" value={fmtCurrency(stats.aprovada)} color="var(--green)" />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Buscar proposta..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 min-w-64 px-4 py-2 rounded-lg text-sm transition-all"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-48 px-3 py-2 rounded-lg text-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
        >
          <option value="">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="enviada">Enviada</option>
          <option value="aprovada">Aprovada</option>
          <option value="recusada">Recusada</option>
          <option value="vencida">Vencida</option>
        </select>
        <Button variant="primary" onClick={openCreate}>+ Nova Proposta</Button>
      </div>

      <Card>
        {filteredProposals.length ? (
          <Table>
            <thead><tr><Th>Título</Th><Th>Cliente</Th><Th>Total</Th><Th>Validade</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {filteredProposals.map(p => (
                <Tr key={p.id}>
                  <Td><span className="font-semibold text-sm">{p.title}</span></Td>
                  <Td><span className="text-sm" style={{ color: "var(--muted)" }}>{clientMap[p.clientId ?? 0] || "—"}</span></Td>
                  <Td><span className="font-mono text-sm" style={{ color: "var(--green)" }}>{fmtCurrency(p.total)}</span></Td>
                  <Td><span className="text-sm">{fmtDate(p.createdAt ? new Date(new Date(p.createdAt).getTime() + (p.validityDays || 15) * 86400000).toISOString().split("T")[0] : undefined)}</span></Td>
                  <Td><Badge status={p.status} /></Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => { setViewId(p.id); setViewModal(true); }}>👁️</Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>✏️</Button>
                      <Button size="sm" variant="danger" onClick={() => { if (confirm("Excluir proposta?")) del.mutate({ id: p.id }); }}>🗑️</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon="📄" title={searchTerm || statusFilter ? "Nenhuma proposta encontrada" : "Nenhuma proposta criada ainda"}
            action={<Button variant="primary" onClick={openCreate}>+ Criar Proposta</Button>} />
        )}
      </Card>

      {/* Edit Modal */}
      <Modal open={modal} onClose={closeModal} title={editId ? "Editar Proposta" : "Nova Proposta"} size="lg"
        footer={<><Button onClick={closeModal}>Cancelar</Button><Button variant="primary" onClick={save} loading={create.isPending || update.isPending}>Salvar</Button></>}>
        <FormGroup label="Título da Proposta *"><Input value={form.title} onChange={set("title")} placeholder="Ex: Desenvolvimento Site + SEO" /></FormGroup>
        <div className="grid grid-cols-2 gap-4">
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
              {["rascunho","enviada","aprovada","recusada","vencida"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Validade (dias)"><Input type="number" value={form.validityDays} onChange={set("validityDays")} /></FormGroup>
        </div>

        {/* Items */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted2)", fontSize: "10px" }}>Itens da Proposta</label>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="grid gap-2" style={{ gridTemplateColumns: "1fr 60px 80px 100px 30px" }}>
                <Input value={item.desc} onChange={e => updateItem(i, "desc", e.target.value)} placeholder="Descrição do serviço" />
                <Input type="number" value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)} placeholder="Qtd" />
                <Input value={item.unit} onChange={e => updateItem(i, "unit", e.target.value)} placeholder="Unidade" />
                <Input type="number" step="0.01" value={item.value} onChange={e => updateItem(i, "value", e.target.value)} placeholder="R$" />
                <button onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                  className="text-xs font-bold transition-colors" style={{ color: "var(--red)" }}>✕</button>
              </div>
            ))}
            <button onClick={() => setItems(prev => [...prev, { desc: "", qty: 1, unit: "serviço", value: 0 }])}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ border: "1.5px dashed var(--border)", color: "var(--muted)", background: "none" }}>
              + Adicionar Item
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-6 text-sm">
            <span style={{ color: "var(--muted)" }}>Subtotal</span>
            <span className="font-mono">{fmtCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "var(--muted)" }}>Desconto (R$)</span>
            <Input type="number" value={form.discount} onChange={set("discount")} className="w-28 text-sm" />
          </div>
          <div className="flex items-center gap-6 font-bold">
            <span>Total</span>
            <span className="font-mono text-lg" style={{ color: "var(--green)" }}>{fmtCurrency(total)}</span>
          </div>
        </div>

        <FormGroup label="Observações / Condições"><Textarea value={form.notes} onChange={set("notes")} placeholder="Condições de pagamento, prazo de entrega, garantias..." /></FormGroup>
      </Modal>

      {/* View Modal */}
      <Modal open={viewModal} onClose={() => { setViewModal(false); setViewId(null); }} title="Visualizar Proposta" size="lg">
        {viewData ? (() => {
          let parsedItems: Item[] = [];
          try { parsedItems = JSON.parse(viewData.items || "[]"); } catch {}
          const sub = parsedItems.reduce((s, i) => s + i.qty * i.value, 0);
          const disc = Number(viewData.discount || 0);
          return (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-6">
                <div><div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>CLIENTE</div><div className="font-bold mt-0.5">{clientMap[viewData.clientId ?? 0] || "—"}</div></div>
                <div><div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>STATUS</div><div className="mt-0.5"><Badge status={viewData.status} /></div></div>
                <div><div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>VALIDADE</div><div className="text-sm mt-0.5">{viewData.validityDays} dias</div></div>
              </div>
              <div style={{ borderTop: "1px solid var(--border)" }} className="pt-3">
                <Table>
                  <thead><tr><Th>Descrição</Th><Th>Qtd</Th><Th>Unidade</Th><Th>Valor Unit.</Th><Th>Total</Th></tr></thead>
                  <tbody>
                    {parsedItems.map((item, i) => (
                      <Tr key={i}>
                        <Td>{item.desc || "—"}</Td>
                        <Td><span className="font-mono">{item.qty}</span></Td>
                        <Td>{item.unit}</Td>
                        <Td><span className="font-mono">{fmtCurrency(item.value)}</span></Td>
                        <Td><span className="font-mono font-bold">{fmtCurrency(item.qty * item.value)}</span></Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="flex flex-col items-end gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex gap-8 text-sm"><span style={{ color: "var(--muted)" }}>Subtotal</span><span className="font-mono">{fmtCurrency(sub)}</span></div>
                {disc > 0 && <div className="flex gap-8 text-sm"><span style={{ color: "var(--muted)" }}>Desconto</span><span className="font-mono text-red-400">- {fmtCurrency(disc)}</span></div>}
                <div className="flex gap-8 font-bold"><span>Total</span><span className="font-mono text-xl" style={{ color: "var(--green)" }}>{fmtCurrency(Number(viewData.total))}</span></div>
              </div>
              {viewData.notes && <div className="rounded-lg p-3 text-sm" style={{ background: "var(--surface2)", color: "var(--muted)" }}>{viewData.notes}</div>}
            </div>
          );
        })() : <div className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>Carregando...</div>}
      </Modal>
    </div>
  );
}
