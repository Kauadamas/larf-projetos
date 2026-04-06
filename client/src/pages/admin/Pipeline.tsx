import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { Calendar } from "lucide-react";
import { fmtCurrency, today } from "../../lib/utils";
import { PageHeader, Button, Modal, FormGroup, Input, Select, Textarea, EmptyState, KanbanCol, ConfirmDialog } from "../../components/UI";

const STAGES = [
  { k: "lead", l: "Lead", c: "var(--text-lo)" },
  { k: "contato", l: "Contato Feito", c: "var(--blue)" },
  { k: "proposta", l: "Proposta Enviada", c: "var(--accent)" },
  { k: "negociacao", l: "Negociação", c: "var(--yellow)" },
  { k: "ganho", l: "Ganho ✓", c: "var(--green)" },
  { k: "perdido", l: "Perdido", c: "var(--red)" },
] as const;

type Stage = typeof STAGES[number]["k"];
type FormData = { clientName: string; clientId: string; value: string; stage: Stage; probability: string; expectedClose: string; notes: string };
const empty: FormData = { clientName: "", clientId: "", value: "", stage: "lead", probability: "50", expectedClose: "", notes: "" };

export default function Pipeline() {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const utils = trpc.useUtils();

  const { data: cards = [] } = trpc.pipeline.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const create = trpc.pipeline.create.useMutation({ onSuccess: () => { toast.success("Oportunidade criada!"); utils.pipeline.list.invalidate(); close(); } });
  const update = trpc.pipeline.update.useMutation({ onSuccess: () => { toast.success("Atualizado!"); utils.pipeline.list.invalidate(); close(); } });
  const del = trpc.pipeline.delete.useMutation({ onSuccess: () => { toast.success("Removido."); utils.pipeline.list.invalidate(); close(); } });

  const openTotal = cards.filter(c => !["ganho", "perdido"].includes(c.stage)).reduce((s, c) => s + Number(c.value || 0), 0);

  function openCreate(defaultStage: Stage = "lead") {
    setEditId(null); setForm({ ...empty, stage: defaultStage }); setModal(true);
  }
  function openEdit(c: typeof cards[0]) {
    setEditId(c.id);
    setForm({ clientName: c.clientName, clientId: c.clientId ? String(c.clientId) : "", value: c.value ? String(c.value) : "", stage: c.stage as Stage, probability: String(c.probability ?? 50), expectedClose: c.expectedClose || "", notes: c.notes || "" });
    setModal(true);
  }
  function close() { setModal(false); }
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  function save() {
    if (!form.clientName.trim()) { toast.error("Nome do cliente obrigatório"); return; }
    const d = { ...form, clientId: form.clientId ? parseInt(form.clientId) : undefined, probability: parseInt(form.probability) || 50 };
    if (editId) update.mutate({ id: editId, ...d });
    else create.mutate(d as any);
  }

  return (
    <div className="p-6">
      <PageHeader title={`Pipeline — ${fmtCurrency(openTotal)} em aberto`}>
        <Button variant="primary" onClick={() => openCreate()}>+ Nova Oportunidade</Button>
      </PageHeader>

      {cards.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <EmptyState icon="trending" title="Nenhuma oportunidade no pipeline"
            action={<Button variant="primary" onClick={() => openCreate()}>+ Adicionar Oportunidade</Button>} />
        </div>
      ) : (
        <div className="kanban-board pb-4">
          {STAGES.map(st => {
            const stCards = cards.filter(c => c.stage === st.k);
            const stTotal = stCards.reduce((s, c) => s + Number(c.value || 0), 0);
            return (
              <KanbanCol key={st.k} title={`${st.l} · ${fmtCurrency(stTotal)}`} color={st.c} count={stCards.length} onAdd={() => openCreate(st.k)}>
                {stCards.map(c => (
                  <div key={c.id} onClick={() => openEdit(c)}
                    className="p-3 rounded-xl mb-2 cursor-pointer transition-all"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                    <div className="font-semibold text-sm mb-1.5">{c.clientName}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs" style={{ color: "var(--green)" }}>{fmtCurrency(c.value)}</span>
                      <span className="text-xs" style={{ color: "var(--text-lo)" }}>{c.probability}% prob.</span>
                      {c.expectedClose && <span className="text-xs" style={{ color: "var(--text-lo)" }}><Calendar size={12} className="inline mr-1" />{c.expectedClose}</span>}
                    </div>
                    {c.notes && <div className="text-xs mt-1.5" style={{ color: "var(--text-lo)" }}>{c.notes.slice(0, 60)}</div>}
                  </div>
                ))}
              </KanbanCol>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={close} title={editId ? "Editar Oportunidade" : "Nova Oportunidade"}
        footer={
          <>
            <Button onClick={close}>Cancelar</Button>
            {editId && <Button variant="danger" onClick={() => setDeleteConfirm({ id: editId, name: form.clientName })}>Excluir</Button>}
            <Button variant="primary" onClick={save} loading={create.isPending || update.isPending}>Salvar</Button>
          </>
        }>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Cliente / Empresa *"><Input value={form.clientName} onChange={set("clientName")} placeholder="Nome do cliente" /></FormGroup>
          <FormGroup label="Cliente Cadastrado">
            <Select value={form.clientId} onChange={set("clientId")}>
              <option value="">— Vincular cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Valor Estimado (R$)"><Input type="number" value={form.value} onChange={set("value")} placeholder="0.00" /></FormGroup>
          <FormGroup label="Probabilidade (%)"><Input type="number" min="0" max="100" value={form.probability} onChange={set("probability")} /></FormGroup>
          <FormGroup label="Etapa">
            <Select value={form.stage} onChange={set("stage")}>
              {STAGES.map(s => <option key={s.k} value={s.k}>{s.l}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Previsão de Fechamento"><Input type="date" value={form.expectedClose} onChange={set("expectedClose")} /></FormGroup>
        </div>
        <FormGroup label="Observações"><Textarea value={form.notes} onChange={set("notes")} placeholder="Contexto, próximos passos..." /></FormGroup>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir Oportunidade?"
        description="Esta ação não pode ser desfeita."
        itemName={deleteConfirm?.name}
        loading={del.isPending}
        onConfirm={() => { if (deleteConfirm) { del.mutate({ id: deleteConfirm.id }); setDeleteConfirm(null); close(); } }}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </div>
  );
}
