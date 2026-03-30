import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { fmtCurrency, fmtDate, isOverdue, today } from "../../lib/utils";
import { PageHeader, Card, Table, Th, Td, Tr, Badge, Button, Modal, FormGroup, FormGrid, Input, Select, Textarea, SearchInput, EmptyState, ConfirmDialog, FieldError, Edit2, Trash2 } from "../../components/UI";

type FormData = { title: string; clientId: string; description: string; status: string; value: string; hoursEstimated: string; startDate: string; deadline: string };
type FormErrors = Record<string, string>;
const empty: FormData = { title: "", clientId: "", description: "", status: "em_andamento", value: "", hoursEstimated: "", startDate: today(), deadline: "" };

export default function Projects() {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const utils = trpc.useUtils();

  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const create = trpc.projects.create.useMutation({ onSuccess: () => { toast.success("Projeto criado!"); utils.projects.list.invalidate(); utils.dashboard.stats.invalidate(); close(); } });
  const update = trpc.projects.update.useMutation({ onSuccess: () => { toast.success("Atualizado!"); utils.projects.list.invalidate(); utils.dashboard.stats.invalidate(); close(); } });
  const del = trpc.projects.delete.useMutation({ onSuccess: () => { toast.success("Excluído."); utils.projects.list.invalidate(); utils.dashboard.stats.invalidate(); setDeleteConfirm(null); } });

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
  const filtered = projects.filter(p => (p.title + (clientMap[p.clientId ?? 0] || "")).toLowerCase().includes(search.toLowerCase()));

  function openCreate() { setEditId(null); setForm(empty); setErrors({}); setModal(true); }
  function openEdit(p: typeof projects[0]) {
    setEditId(p.id);
    setForm({ title: p.title, clientId: p.clientId ? String(p.clientId) : "", description: p.description || "", status: p.status, value: p.value ? String(p.value) : "", hoursEstimated: p.hoursEstimated ? String(p.hoursEstimated) : "", startDate: p.startDate || today(), deadline: p.deadline || "" });
    setErrors({});
    setModal(true);
  }
  function close() { setModal(false); setErrors({}); }
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: "" }));
  };

  const validate = (field: keyof FormData) => {
    const newErrors = { ...errors };
    if (field === "title" && !form.title.trim()) {
      newErrors.title = "Título é obrigatório";
    } else if (field === "title") {
      delete newErrors.title;
    }
    if (field === "value" && form.value && isNaN(parseFloat(form.value))) {
      newErrors.value = "Valor inválido";
    } else if (field === "value") {
      delete newErrors.value;
    }
    if (field === "hoursEstimated" && form.hoursEstimated && isNaN(parseFloat(form.hoursEstimated))) {
      newErrors.hoursEstimated = "Horas inválidas";
    } else if (field === "hoursEstimated") {
      delete newErrors.hoursEstimated;
    }
    setErrors(newErrors);
  };

  const isFormValid = form.title.trim() && (!form.value || !isNaN(parseFloat(form.value))) && (!form.hoursEstimated || !isNaN(parseFloat(form.hoursEstimated)));

  function save() {
    if (!isFormValid) {
      if (!form.title.trim()) validate("title");
      if (form.value && isNaN(parseFloat(form.value))) validate("value");
      if (form.hoursEstimated && isNaN(parseFloat(form.hoursEstimated))) validate("hoursEstimated");
      return;
    }
    const d = { ...form, clientId: form.clientId ? parseInt(form.clientId) : null };
    if (editId) update.mutate({ id: editId, ...d });
    else create.mutate(d as any);
  }

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader title="Projetos" count={filtered.length}>
        <SearchInput value={search} onChange={setSearch} />
        <Button variant="primary" onClick={openCreate}>+ Novo Projeto</Button>
      </PageHeader>

      <Card>
        {filtered.length ? (
          <Table>
            <thead><tr><Th>Projeto</Th><Th>Cliente</Th><Th>Valor</Th><Th>Prazo</Th><Th>Horas Est.</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <Tr key={p.id}>
                  <Td>
                    <span className="font-semibold">{p.title}</span>
                    {p.description && <div className="text-xs mt-0.5" style={{ color: "var(--text-lo)" }}>{p.description.slice(0, 60)}{p.description.length > 60 ? "..." : ""}</div>}
                  </Td>
                  <Td><span className="text-sm" style={{ color: "var(--text-lo)" }}>{clientMap[p.clientId ?? 0] || "—"}</span></Td>
                  <Td><span className="font-mono text-sm" style={{ color: "var(--green)" }}>{fmtCurrency(p.value)}</span></Td>
                  <Td><span className={`text-sm ${isOverdue(p.deadline) && p.status !== "concluido" ? "text-red-400 font-semibold" : ""}`}>{fmtDate(p.deadline)}</span></Td>
                  <Td><span className="font-mono text-sm">{p.hoursEstimated ? `${p.hoursEstimated}h` : "—"}</span></Td>
                  <Td><Badge status={p.status} /></Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" title="Editar" onClick={() => openEdit(p)} icon={<Edit2 size={14} />} />
                      <Button size="sm" variant="danger" title="Excluir" onClick={() => setDeleteConfirm({ id: p.id, name: p.title })} icon={<Trash2 size={14} />} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon="rocket" title={search ? "Nenhum projeto encontrado" : "Nenhum projeto criado ainda"}
            action={!search ? <Button variant="primary" onClick={openCreate}>+ Criar Primeiro Projeto</Button> : undefined} />
        )}
      </Card>

      <Modal open={modal} onClose={close} title={editId ? "Editar Projeto" : "Novo Projeto"}
        footer={<><Button onClick={close}>Cancelar</Button><Button variant="primary" onClick={save} loading={create.isPending || update.isPending} disabled={!isFormValid}>Salvar</Button></>}>
        <FormGroup label="Título do Projeto *" required error={errors.title}>
          <Input value={form.title} onChange={set("title")} onBlur={() => validate("title")} placeholder="Ex: Site Institucional Empresa X" style={{ borderColor: errors.title ? "#ef4444" : undefined }} />
        </FormGroup>
        <FormGrid cols={2}>
          <FormGroup label="Cliente">
            <Select value={form.clientId} onChange={set("clientId")}>
              <option value="">— Selecione —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Valor Contratado (R$)" error={errors.value}>
            <Input type="number" value={form.value} onChange={set("value")} onBlur={() => validate("value")} placeholder="0.00" step="0.01" style={{ borderColor: errors.value ? "#ef4444" : undefined }} />
          </FormGroup>
          <FormGroup label="Data de Início">
            <Input type="date" value={form.startDate} onChange={set("startDate")} />
          </FormGroup>
          <FormGroup label="Prazo de Entrega">
            <Input type="date" value={form.deadline} onChange={set("deadline")} />
          </FormGroup>
          <FormGroup label="Horas Estimadas" error={errors.hoursEstimated}>
            <Input type="number" value={form.hoursEstimated} onChange={set("hoursEstimated")} onBlur={() => validate("hoursEstimated")} placeholder="Ex: 40" style={{ borderColor: errors.hoursEstimated ? "#ef4444" : undefined }} />
          </FormGroup>
          <FormGroup label="Status">
            <Select value={form.status} onChange={set("status")}>
              <option value="em_andamento">Em Andamento</option>
              <option value="pausado">Pausado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </Select>
          </FormGroup>
        </FormGrid>
        <FormGroup label="Escopo / Descrição">
          <Textarea value={form.description} onChange={set("description")} placeholder="Descreva o escopo do projeto..." />
        </FormGroup>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir Projeto?"
        description="Esta ação não pode ser desfeita. O projeto e todas as tarefas associadas serão removidos permanentemente."
        itemName={deleteConfirm?.name}
        loading={del.isPending}
        onConfirm={() => deleteConfirm && del.mutate({ id: deleteConfirm.id })}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </div>
  );
}
