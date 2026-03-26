import { useState, useEffect } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { fmtCurrency, fmtDate, isOverdue, today } from "../../lib/utils";
import {
  Avatar, SkeletonRow, ProgressBar, DataTable,
  Button, Modal, FormGroup, Input, Select, Textarea, EmptyState
} from "../../components/UI";
import { Briefcase, Plus, Calendar, DollarSign, Clock, Filter } from "lucide-react";

type FormData = {
  title: string;
  clientId: string;
  description: string;
  status: string;
  value: string;
  hoursEstimated: string;
  startDate: string;
  deadline: string;
};
const empty: FormData = {
  title: "",
  clientId: "",
  description: "",
  status: "em_andamento",
  value: "",
  hoursEstimated: "",
  startDate: today(),
  deadline: "",
};

export default function Projects() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const utils = trpc.useUtils();

  const { data: projects = [], isLoading } = trpc.projects.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const create = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Projeto criado!");
      utils.projects.list.invalidate();
      utils.dashboard.stats.invalidate();
      close();
    },
  });
  const update = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Atualizado!");
      utils.projects.list.invalidate();
      utils.dashboard.stats.invalidate();
      close();
    },
  });
  const del = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Excluído.");
      utils.projects.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const total = projects.length;
  const active = projects.filter((p) => p.status === "em_andamento").length;
  const completed = projects.filter((p) => p.status === "concluido").length;
  const totalValue = projects.reduce((sum, p) => sum + (p.value || 0), 0);

  const filtered = projects.filter((p) => {
    const matchSearch = (
      p.title +
      (clientMap[p.clientId ?? 0]?.name || "")
    ).toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function openCreate() {
    setEditId(null);
    setForm(empty);
    setModal(true);
  }

  function openEdit(p: (typeof projects)[0]) {
    setEditId(p.id);
    setForm({
      title: p.title,
      clientId: p.clientId ? String(p.clientId) : "",
      description: p.description || "",
      status: p.status,
      value: p.value ? String(p.value) : "",
      hoursEstimated: p.hoursEstimated ? String(p.hoursEstimated) : "",
      startDate: p.startDate || today(),
      deadline: p.deadline || "",
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
      clientId: form.clientId ? parseInt(form.clientId) : null,
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
              Projetos
            </h1>
            <p style={{ color: "var(--muted)" }}>
              Gerencie e acompanhe todos os seus projetos em um só lugar
            </p>
          </div>
          <Briefcase size={40} style={{ color: "var(--accent)", opacity: 0.3 }} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Total", value: total, color: "var(--blue)" },
            { label: "Ativos", value: active, color: "var(--green)" },
            { label: "Concluídos", value: completed, color: "var(--yellow)" },
            {
              label: "Valor Total",
              value: fmtCurrency(totalValue),
              color: "var(--accent)",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl p-4 text-center transition-all hover:scale-105 animate-fade-in"
              style={{
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.05)",
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                {stat.label}
              </div>
              <div
                className="text-xl font-bold mt-1"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
            </div>
          ))}
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
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nome ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg text-sm bg-transparent focus:outline-none"
            style={{
              color: "var(--text)",
              border: "1px solid var(--border)",
              transition: "all 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          <Filter
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm bg-transparent focus:outline-none"
          style={{
            color: "var(--text)",
            border: "1px solid var(--border)",
            transition: "all 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <option value="all">Todos os status</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="pausado">Pausado</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <Button
          onClick={openCreate}
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
            (e.currentTarget.style.background = "var(--accent) opacity(90%)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
        >
          <Plus size={18} />
          Novo Projeto
        </Button>
      </div>

      {/* Data Display */}
      {isLoading ? (
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                    Projeto
                  </th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                    Valor
                  </th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                    Progresso
                  </th>
                  <th className="px-6 py-4 text-right font-semibold" style={{ color: "var(--text)" }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project, idx) => {
                  const client = clientMap[project.clientId ?? 0];
                  const isOverd = isOverdue(project.deadline) && project.status !== "concluido";
                  const progress = project.hoursEstimated
                    ? Math.min(100, Math.floor(Math.random() * 100))
                    : 0;

                  return (
                    <tr
                      key={project.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "all 0.2s",
                        animationDelay: `${idx * 0.05}s`,
                      }}
                      className="hover:bg-opacity-50 transition-colors animate-fade-in"
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background =
                          "rgba(59,130,246,.05)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background =
                          "transparent")
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={project.title}
                            size="md"
                            style={{
                              background: `linear-gradient(135deg, var(--accent), var(--blue))`,
                            }}
                          />
                          <div>
                            <div className="font-semibold" style={{ color: "var(--text)" }}>
                              {project.title}
                            </div>
                            {project.description && (
                              <div
                                className="text-xs mt-1"
                                style={{ color: "var(--muted)" }}
                              >
                                {project.description.slice(0, 40)}
                                {project.description.length > 40 ? "..." : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-sm"
                          style={{ color: "var(--muted)" }}
                        >
                          {client?.name || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background:
                              project.status === "em_andamento"
                                ? "rgba(59,130,246,.2)"
                                : project.status === "concluido"
                                  ? "rgba(34,197,94,.2)"
                                  : project.status === "pausado"
                                    ? "rgba(202,138,4,.2)"
                                    : "rgba(220,38,38,.2)",
                            color:
                              project.status === "em_andamento"
                                ? "var(--blue)"
                                : project.status === "concluido"
                                  ? "var(--green)"
                                  : project.status === "pausado"
                                    ? "var(--yellow)"
                                    : "var(--red)",
                          }}
                        >
                          {project.status === "em_andamento"
                            ? "Em Andamento"
                            : project.status === "concluido"
                              ? "Concluído"
                              : project.status === "pausado"
                                ? "Pausado"
                                : "Cancelado"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="font-mono font-semibold"
                          style={{ color: "var(--green)" }}
                        >
                          {fmtCurrency(project.value)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ProgressBar value={progress} max={100} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => openEdit(project)}
                            className="px-3 py-1 text-sm rounded-lg"
                            style={{
                              background: "rgba(59,130,246,.1)",
                              color: "var(--accent)",
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(59,130,246,.2)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(59,130,246,.1)")
                            }
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => {
                              if (confirm("Excluir projeto e todas as tarefas?"))
                                del.mutate({ id: project.id });
                            }}
                            className="px-3 py-1 text-sm rounded-lg"
                            style={{
                              background: "rgba(220,38,38,.1)",
                              color: "var(--red)",
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(220,38,38,.2)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(220,38,38,.1)")
                            }
                          >
                            Deletar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl p-12"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <EmptyState
            icon="🚀"
            title={
              search
                ? "Nenhum projeto encontrado"
                : "Nenhum projeto criado ainda"
            }
            action={
              !search ? (
                <Button
                  onClick={openCreate}
                  className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 mx-auto"
                  style={{
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={18} />
                  Criar Primeiro Projeto
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modal}
        onClose={close}
        title={editId ? "Editar Projeto" : "Novo Projeto"}
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
        <FormGroup label="Título do Projeto *">
          <Input
            value={form.title}
            onChange={set("title")}
            placeholder="Ex: Site Institucional Empresa X"
          />
        </FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Cliente">
            <Select value={form.clientId} onChange={set("clientId")}>
              <option value="">— Selecione —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Valor Contratado (R$)">
            <Input
              type="number"
              value={form.value}
              onChange={set("value")}
              placeholder="0.00"
              step="0.01"
            />
          </FormGroup>
          <FormGroup label="Data de Início">
            <Input
              type="date"
              value={form.startDate}
              onChange={set("startDate")}
            />
          </FormGroup>
          <FormGroup label="Prazo de Entrega">
            <Input
              type="date"
              value={form.deadline}
              onChange={set("deadline")}
            />
          </FormGroup>
          <FormGroup label="Horas Estimadas">
            <Input
              type="number"
              value={form.hoursEstimated}
              onChange={set("hoursEstimated")}
              placeholder="Ex: 40"
            />
          </FormGroup>
          <FormGroup label="Status">
            <Select value={form.status} onChange={set("status")}>
              <option value="em_andamento">Em Andamento</option>
              <option value="pausado">Pausado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </Select>
          </FormGroup>
        </div>
        <FormGroup label="Escopo / Descrição">
          <Textarea
            value={form.description}
            onChange={set("description")}
            placeholder="Descreva o escopo do projeto..."
          />
        </FormGroup>
      </Modal>
    </div>
  );
}
