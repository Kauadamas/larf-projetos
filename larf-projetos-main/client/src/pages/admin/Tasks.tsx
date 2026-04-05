import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { User, Calendar } from "lucide-react";
import { fmtDate, isOverdue } from "../../lib/utils";
import { PageHeader, Badge, Button, Modal, FormGroup, FormGrid, Input, Select, Textarea, KanbanCol, EmptyState, ConfirmDialog } from "../../components/UI";

const COLS = [
  { k: "todo", l: "A Fazer", c: "var(--text-lo)" },
  { k: "doing", l: "Em Andamento", c: "var(--blue)" },
  { k: "review", l: "Em Revisão", c: "var(--yellow)" },
  { k: "done", l: "Concluído", c: "var(--green)" },
] as const;

type Status = "todo" | "doing" | "review" | "done";
type Priority = "baixa" | "media" | "alta" | "urgente";
type FormData = { title: string; projectId: string; description: string; status: Status; priority: Priority; assignee: string; deadline: string };
type FormErrors = Record<string, string>;
const empty: FormData = { title: "", projectId: "", description: "", status: "todo", priority: "media", assignee: "", deadline: "" };

export default function Tasks() {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [projectFilter, setProjectFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  const utils = trpc.useUtils();

  const { data: tasks = [] } = trpc.tasks.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const create = trpc.tasks.create.useMutation({ onSuccess: () => { toast.success("Tarefa criada!"); utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); close(); } });
  const update = trpc.tasks.update.useMutation({ onSuccess: () => { toast.success("Atualizado!"); utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); close(); } });
  const del = trpc.tasks.delete.useMutation({ onSuccess: () => { toast.success("Excluída."); utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); setDeleteConfirm(null); } });

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]));
  const filtered = projectFilter ? tasks.filter(t => t.projectId === parseInt(projectFilter)) : tasks;

  function openCreate(defaultStatus: Status = "todo") {
    setEditId(null); setForm({ ...empty, status: defaultStatus }); setErrors({}); setModal(true);
  }
  function openEdit(t: typeof tasks[0]) {
    setEditId(t.id);
    setForm({ title: t.title, projectId: t.projectId ? String(t.projectId) : "", description: t.description || "", status: t.status as Status, priority: t.priority as Priority, assignee: t.assignee || "", deadline: t.deadline || "" });
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
    setErrors(newErrors);
  };

  const isFormValid = form.title.trim();

  function save() {
    if (!isFormValid) {
      if (!form.title.trim()) validate("title");
      return;
    }
    const d = { ...form, projectId: form.projectId ? parseInt(form.projectId) : null };
    if (editId) update.mutate({ id: editId, ...d });
    else create.mutate(d as any);
  }

  return (
    <div className="p-6">
      <PageHeader title="Tarefas">
        <Select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="w-52 text-sm">
          <option value="">Todos os projetos</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </Select>
        <Button variant="primary" onClick={() => openCreate()}>+ Nova Tarefa</Button>
      </PageHeader>

      {projects.length === 0 ? (
        <div className="rounded-xl p-12" style={{ background: "var(--glass-hi)", border: "1px solid var(--border)" }}>
          <EmptyState icon="task" title="Crie um projeto primeiro para organizar tarefas" />
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6 pb-2">
          <div className="kanban-board pb-4 min-w-min">
            {COLS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.k);
              return (
                <KanbanCol key={col.k} title={col.l} color={col.c} count={colTasks.length} onAdd={() => openCreate(col.k)}>
                  {colTasks.map(t => (
                    <div key={t.id} onClick={() => openEdit(t)}
                      className="p-3 rounded-xl mb-2 cursor-pointer transition-all"
                      style={{ background: "var(--glass-hi)", border: "1px solid var(--border)" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                      <div className="font-semibold text-sm mb-2 leading-snug">{t.title}</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge status={t.priority} />
                        {t.projectId && <span className="text-xs" style={{ color: "var(--text-lo)" }}>{projectMap[t.projectId]?.slice(0, 20)}</span>}
                      </div>
                      {t.assignee && <div className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--text-lo)" }}><User size={12} /> {t.assignee}</div>}
                      {t.deadline && (
                        <div className={`text-xs mt-1 flex items-center gap-1 ${isOverdue(t.deadline) && t.status !== "done" ? "text-red-400 font-semibold" : ""}`}
                          style={{ color: isOverdue(t.deadline) && t.status !== "done" ? undefined : "var(--text-lo)" }}>
                          <Calendar size={12} /> {fmtDate(t.deadline)}
                        </div>
                      )}
                    </div>
                  ))}
                </KanbanCol>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={modal} onClose={close} title={editId ? "Editar Tarefa" : "Nova Tarefa"}
        footer={
          <>
            <Button onClick={close}>Cancelar</Button>
            {editId && <Button variant="danger" onClick={() => setDeleteConfirm({ id: editId, name: form.title })}>Excluir</Button>}
            <Button variant="primary" onClick={save} loading={create.isPending || update.isPending} disabled={!isFormValid}>Salvar</Button>
          </>
        }>
        <FormGroup label="Título da Tarefa *" required error={errors.title}>
          <Input value={form.title} onChange={set("title")} onBlur={() => validate("title")} placeholder="O que precisa ser feito?" style={{ borderColor: errors.title ? "#ef4444" : undefined }} />
        </FormGroup>
        <FormGrid cols={2}>
          <FormGroup label="Projeto">
            <Select value={form.projectId} onChange={set("projectId")}>
              <option value="">— Selecione —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Responsável">
            <Input value={form.assignee} onChange={set("assignee")} placeholder="Nome do responsável" />
          </FormGroup>
          <FormGroup label="Status">
            <Select value={form.status} onChange={set("status")}>
              <option value="todo">A Fazer</option>
              <option value="doing">Em Andamento</option>
              <option value="review">Em Revisão</option>
              <option value="done">Concluído</option>
            </Select>
          </FormGroup>
          <FormGroup label="Prioridade">
            <Select value={form.priority} onChange={set("priority")}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </Select>
          </FormGroup>
        </FormGrid>
        <FormGroup label="Prazo">
          <Input type="date" value={form.deadline} onChange={set("deadline")} />
        </FormGroup>
        <FormGroup label="Descrição">
          <Textarea value={form.description} onChange={set("description")} placeholder="Detalhes, critérios de aceitação..." />
        </FormGroup>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir Tarefa?"
        description="Esta ação não pode ser desfeita. A tarefa será permanentemente removida do sistema."
        itemName={deleteConfirm?.name}
        loading={del.isPending}
        onConfirm={() => deleteConfirm && del.mutate({ id: deleteConfirm.id })}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </div>
  );
}
