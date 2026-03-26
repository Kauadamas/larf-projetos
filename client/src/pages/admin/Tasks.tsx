import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { fmtDate, isOverdue } from "../../lib/utils";
import { PageHeader, Badge, Button, Modal, FormGroup, Input, Select, Textarea, KanbanCol, EmptyState } from "../../components/UI";

const COLS = [
  { k: "todo", l: "A Fazer", c: "var(--muted)" },
  { k: "doing", l: "Em Andamento", c: "var(--blue)" },
  { k: "review", l: "Em Revisão", c: "var(--yellow)" },
  { k: "done", l: "Concluído", c: "var(--green)" },
] as const;

type Status = "todo" | "doing" | "review" | "done";
type Priority = "baixa" | "media" | "alta" | "urgente";
type FormData = { title: string; projectId: string; description: string; status: Status; priority: Priority; assignee: string; deadline: string };
const empty: FormData = { title: "", projectId: "", description: "", status: "todo", priority: "media", assignee: "", deadline: "" };

export default function Tasks() {
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [projectFilter, setProjectFilter] = useState("");
  const utils = trpc.useUtils();

  const { data: tasks = [] } = trpc.tasks.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const create = trpc.tasks.create.useMutation({ onSuccess: () => { toast.success("Tarefa criada!"); utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); close(); } });
  const update = trpc.tasks.update.useMutation({ onSuccess: () => { toast.success("Atualizado!"); utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); close(); } });
  const del = trpc.tasks.delete.useMutation({ onSuccess: () => { toast.success("Excluída."); utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); close(); } });

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]));
  const filtered = projectFilter ? tasks.filter(t => t.projectId === parseInt(projectFilter)) : tasks;

  function openCreate(defaultStatus: Status = "todo") {
    setEditId(null); setForm({ ...empty, status: defaultStatus }); setModal(true);
  }
  function openEdit(t: typeof tasks[0]) {
    setEditId(t.id);
    setForm({ title: t.title, projectId: t.projectId ? String(t.projectId) : "", description: t.description || "", status: t.status as Status, priority: t.priority as Priority, assignee: t.assignee || "", deadline: t.deadline || "" });
    setModal(true);
  }
  function close() { setModal(false); }
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  function save() {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
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
        <div className="rounded-xl p-12" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <EmptyState icon="📋" title="Crie um projeto primeiro para organizar tarefas" />
        </div>
      ) : (
        <div className="kanban-board pb-4">
          {COLS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.k);
            return (
              <KanbanCol key={col.k} title={col.l} color={col.c} count={colTasks.length} onAdd={() => openCreate(col.k)}>
                {colTasks.map(t => (
                  <div key={t.id} onClick={() => openEdit(t)}
                    className="p-3 rounded-xl mb-2 cursor-pointer transition-all"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                    <div className="font-semibold text-sm mb-2 leading-snug">{t.title}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge status={t.priority} />
                      {t.projectId && <span className="text-xs" style={{ color: "var(--muted)" }}>{projectMap[t.projectId]?.slice(0, 20)}</span>}
                    </div>
                    {t.assignee && <div className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>👤 {t.assignee}</div>}
                    {t.deadline && (
                      <div className={`text-xs mt-1 ${isOverdue(t.deadline) && t.status !== "done" ? "text-red-400 font-semibold" : ""}`}
                        style={{ color: isOverdue(t.deadline) && t.status !== "done" ? undefined : "var(--muted)" }}>
                        📅 {fmtDate(t.deadline)}
                      </div>
                    )}
                  </div>
                ))}
              </KanbanCol>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={close} title={editId ? "Editar Tarefa" : "Nova Tarefa"}
        footer={
          <>
            <Button onClick={close}>Cancelar</Button>
            {editId && <Button variant="danger" onClick={() => { if (confirm("Excluir tarefa?")) del.mutate({ id: editId }); }}>Excluir</Button>}
            <Button variant="primary" onClick={save} loading={create.isPending || update.isPending}>Salvar</Button>
          </>
        }>
        <FormGroup label="Título da Tarefa *"><Input value={form.title} onChange={set("title")} placeholder="O que precisa ser feito?" /></FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Projeto">
            <Select value={form.projectId} onChange={set("projectId")}>
              <option value="">— Selecione —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Responsável"><Input value={form.assignee} onChange={set("assignee")} placeholder="Nome do responsável" /></FormGroup>
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
        </div>
        <FormGroup label="Prazo"><Input type="date" value={form.deadline} onChange={set("deadline")} /></FormGroup>
        <FormGroup label="Descrição"><Textarea value={form.description} onChange={set("description")} placeholder="Detalhes, critérios de aceitação..." /></FormGroup>
      </Modal>
    </div>
  );
}
