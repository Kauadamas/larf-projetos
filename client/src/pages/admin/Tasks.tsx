import { useState, useEffect } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { fmtDate, isOverdue } from "../../lib/utils";
import {
  Badge, Button, Modal, FormGroup, Input, Select, Textarea, EmptyState, Avatar, ProgressBar
} from "../../components/UI";
import {
  CheckCircle2, Circle, AlertCircle, Clock, Zap, Plus, Filter, ChevronDown
} from "lucide-react";

const COLS = [
  { k: "todo", l: "A Fazer", c: "#6b7280", icon: Circle },
  { k: "doing", l: "Em Andamento", c: "#3b82f6", icon: Clock },
  { k: "review", l: "Em Revisão", c: "#f59e0b", icon: AlertCircle },
  { k: "done", l: "Concluído", c: "#10b981", icon: CheckCircle2 },
] as const;

type Status = "todo" | "doing" | "review" | "done";
type Priority = "baixa" | "media" | "alta" | "urgente";
type FormData = {
  title: string;
  projectId: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string;
  deadline: string;
};
const empty: FormData = {
  title: "",
  projectId: "",
  description: "",
  status: "todo",
  priority: "media",
  assignee: "",
  deadline: "",
};

export default function Tasks() {
  const [mounted, setMounted] = useState(false);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [projectFilter, setProjectFilter] = useState("");
  const utils = trpc.useUtils();

  const { data: tasks = [] } = trpc.tasks.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const create = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada!");
      utils.tasks.list.invalidate();
      utils.dashboard.stats.invalidate();
      close();
    },
  });
  const update = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Atualizado!");
      utils.tasks.list.invalidate();
      utils.dashboard.stats.invalidate();
      close();
    },
  });
  const del = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Excluída.");
      utils.tasks.list.invalidate();
      utils.dashboard.stats.invalidate();
      close();
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.title]));
  const filtered = projectFilter
    ? tasks.filter((t) => t.projectId === parseInt(projectFilter))
    : tasks;

  const stats = COLS.map((col) => ({
    ...col,
    count: filtered.filter((t) => t.status === col.k).length,
  }));

  function openCreate(defaultStatus: Status = "todo") {
    setEditId(null);
    setForm({ ...empty, status: defaultStatus });
    setModal(true);
  }

  function openEdit(t: (typeof tasks)[0]) {
    setEditId(t.id);
    setForm({
      title: t.title,
      projectId: t.projectId ? String(t.projectId) : "",
      description: t.description || "",
      status: t.status as Status,
      priority: t.priority as Priority,
      assignee: t.assignee || "",
      deadline: t.deadline || "",
    });
    setModal(true);
  }

  function close() {
    setModal(false);
  }

  const set = (k: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function save() {
    if (!form.title.trim()) {
      toast.error("Título obrigatório");
      return;
    }
    const d = {
      ...form,
      projectId: form.projectId ? parseInt(form.projectId) : null,
    };
    if (editId) update.mutate({ id: editId, ...d });
    else create.mutate(d as any);
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--background)" }}>
      {/* Hero Section */}
      <div
        className="rounded-2xl p-8 mb-8"
        style={{
          background: `linear-gradient(135deg, rgba(59,130,246,.08) 0%, rgba(0,217,255,.03) 100%)`,
          border: "1px solid rgba(59,130,246,.1)",
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
              Tarefas & Kanban
            </h1>
            <p style={{ color: "var(--muted)" }}>
              Visualize o fluxo de trabalho e acompanhe o progresso das tarefas
            </p>
          </div>
          <Zap size={40} style={{ color: "var(--accent)", opacity: 0.3 }} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="rounded-xl p-4 text-center transition-all hover:scale-105 animate-fade-in"
                style={{
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.05)",
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <div className="flex items-center justify-center mb-2">
                  <Icon size={20} style={{ color: stat.c }} />
                </div>
                <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                  {stat.l}
                </div>
                <div
                  className="text-2xl font-bold mt-1"
                  style={{ color: stat.c }}
                >
                  {stat.count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Section */}
      <div
        className="rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg text-sm bg-transparent focus:outline-none"
          style={{
            color: "var(--text)",
            border: "1px solid var(--border)",
            transition: "all 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <option value="">Todos os projetos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <Button
          onClick={() => openCreate()}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
          style={{
            background: "var(--accent)",
            color: "white",
            padding: "0.5rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            cursor: "pointer",
            fontWeight: "500",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(59,130,246,.9)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          <Plus size={18} />
          Nova Tarefa
        </Button>
      </div>

      {/* Kanban Board */}
      {projects.length === 0 ? (
        <div
          className="rounded-xl p-12"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <EmptyState
            icon="📋"
            title="Crie um projeto primeiro para organizar tarefas"
          />
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-max"
          style={{ minHeight: "600px" }}
        >
          {COLS.map((col, colIdx) => {
            const colTasks = filtered.filter((t) => t.status === col.k);
            const Icon = col.icon;

            return (
              <div
                key={col.k}
                className="rounded-xl overflow-hidden animate-fade-in"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  animationDelay: `${colIdx * 0.1}s`,
                }}
              >
                {/* Column Header */}
                <div
                  className="px-4 py-4 border-b"
                  style={{
                    borderColor: "var(--border)",
                    background: `linear-gradient(90deg, ${col.c}15, transparent)`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={18} style={{ color: col.c }} />
                      <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                        {col.l}
                      </h3>
                    </div>
                    <span
                      className="rounded-full px-2 py-1 text-xs font-semibold"
                      style={{
                        background: `${col.c}20`,
                        color: col.c,
                      }}
                    >
                      {colTasks.length}
                    </span>
                  </div>
                  <Button
                    onClick={() => openCreate(col.k)}
                    className="w-full mt-3 px-3 py-2 text-xs rounded-lg"
                    style={{
                      background: `${col.c}20`,
                      color: col.c,
                      border: `1px solid ${col.c}40`,
                      cursor: "pointer",
                      fontWeight: "500",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = `${col.c}30`)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = `${col.c}20`)
                    }
                  >
                    <Plus size={14} className="inline mr-1" />
                    Adicionar
                  </Button>
                </div>

                {/* Tasks List */}
                <div className="p-4 space-y-3 max-h-[700px] overflow-y-auto">
                  {colTasks.length > 0 ? (
                    colTasks.map((task, idx) => (
                      <div
                        key={task.id}
                        onClick={() => openEdit(task)}
                        className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg animate-fade-in"
                        style={{
                          background: "rgba(255,255,255,.03)",
                          border: "1px solid var(--border)",
                          animationDelay: `${idx * 0.05}s`,
                          transform: "translateY(0)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(59,130,246,.08)";
                          e.currentTarget.style.borderColor = "var(--accent)";
                          e.currentTarget.style.transform = "scale(1.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,.03)";
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {/* Title */}
                        <div className="font-semibold text-sm mb-2" style={{ color: "var(--text)" }}>
                          {task.title}
                        </div>

                        {/* Priority Badge */}
                        {task.priority && (
                          <div className="mb-3">
                            <span
                              className="px-2 py-1 rounded-full text-xs font-semibold"
                              style={{
                                background:
                                  task.priority === "urgente"
                                    ? "rgba(220,38,38,.2)"
                                    : task.priority === "alta"
                                      ? "rgba(249,115,22,.2)"
                                      : task.priority === "media"
                                        ? "rgba(59,130,246,.2)"
                                        : "rgba(100,116,139,.2)",
                                color:
                                  task.priority === "urgente"
                                    ? "#dc2626"
                                    : task.priority === "alta"
                                      ? "#f97316"
                                      : task.priority === "media"
                                        ? "#3b82f6"
                                        : "#64748b",
                              }}
                            >
                              {task.priority === "urgente"
                                ? "🔴 Urgente"
                                : task.priority === "alta"
                                  ? "🟠 Alta"
                                  : task.priority === "media"
                                    ? "🟡 Média"
                                    : "🟢 Baixa"}
                            </span>
                          </div>
                        )}

                        {/* Footer Info */}
                        <div className="space-y-2 text-xs" style={{ color: "var(--muted)" }}>
                          {task.projectId && (
                            <div
                              className="truncate"
                              style={{ color: "var(--muted)" }}
                            >
                              📁 {projectMap[task.projectId]?.slice(0, 25)}
                            </div>
                          )}
                          {task.assignee && (
                            <div className="flex items-center gap-1">
                              <Avatar name={task.assignee} size="sm" />
                              <span className="truncate">{task.assignee}</span>
                            </div>
                          )}
                          {task.deadline && (
                            <div
                              style={{
                                color: isOverdue(task.deadline) && task.status !== "done"
                                  ? "#dc2626"
                                  : "var(--muted)",
                                fontWeight: isOverdue(task.deadline) && task.status !== "done"
                                  ? "600"
                                  : "400",
                              }}
                            >
                              📅 {fmtDate(task.deadline)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      className="text-center py-8"
                      style={{ color: "var(--muted)" }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                        ✨
                      </div>
                      <div className="text-xs">Sem tarefas</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modal}
        onClose={close}
        title={editId ? "Editar Tarefa" : "Nova Tarefa"}
        footer={
          <>
            <Button
              onClick={close}
              className="px-4 py-2 rounded-lg"
              style={{
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Cancelar
            </Button>
            {editId && (
              <Button
                onClick={() => {
                  if (confirm("Excluir tarefa?")) del.mutate({ id: editId });
                }}
                className="px-4 py-2 rounded-lg font-semibold"
                style={{
                  background: "rgba(220,38,38,.1)",
                  color: "#dc2626",
                  border: "1px solid rgba(220,38,38,.2)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Excluir
              </Button>
            )}
            <Button
              onClick={save}
              className="px-4 py-2 rounded-lg font-semibold"
              style={{
                background: "var(--accent)",
                color: "white",
                border: "none",
                cursor: "pointer",
                opacity: create.isPending || update.isPending ? 0.7 : 1,
              }}
              disabled={create.isPending || update.isPending}
            >
              {create.isPending || update.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <FormGroup label="Título da Tarefa *">
          <Input
            value={form.title}
            onChange={set("title")}
            placeholder="O que precisa ser feito?"
          />
        </FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Projeto">
            <Select value={form.projectId} onChange={set("projectId")}>
              <option value="">— Selecione —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Responsável">
            <Input
              value={form.assignee}
              onChange={set("assignee")}
              placeholder="Nome do responsável"
            />
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
        </div>
        <FormGroup label="Prazo">
          <Input
            type="date"
            value={form.deadline}
            onChange={set("deadline")}
          />
        </FormGroup>
        <FormGroup label="Descrição">
          <Textarea
            value={form.description}
            onChange={set("description")}
            placeholder="Detalhes, critérios de aceitação..."
          />
        </FormGroup>
      </Modal>
    </div>
  );
}
