import { useState, useEffect } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { fmtCurrency, fmtDate, isOverdue, today } from "../../lib/utils";
import {
  SkeletonRow, ProgressBar, Avatar,
  Button, Modal, FormGroup, Input, Select, Textarea, EmptyState
} from "../../components/UI";
import { CreditCard, Plus, TrendingUp, AlertCircle, CheckCircle, Clock, Filter } from "lucide-react";

type FormData = {
  description: string;
  value: string;
  clientId: string;
  projectId: string;
  status: string;
  dueDate: string;
  notes: string;
};
const empty: FormData = {
  description: "",
  value: "",
  clientId: "",
  projectId: "",
  status: "pendente",
  dueDate: "",
  notes: "",
};

export default function Invoices() {
  const [mounted, setMounted] = useState(false);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [filterStatus, setFilterStatus] = useState("all");
  const utils = trpc.useUtils();

  const { data: invoices = [], isLoading } = trpc.invoices.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const create = trpc.invoices.create.useMutation({
    onSuccess: () => {
      toast.success("Lançamento criado!");
      utils.invoices.list.invalidate();
      utils.dashboard.stats.invalidate();
      close();
    },
  });
  const markPaid = trpc.invoices.markPaid.useMutation({
    onSuccess: () => {
      toast.success("Marcado como recebido!");
      utils.invoices.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });
  const del = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Excluído.");
      utils.invoices.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.title]));

  const recebido = invoices
    .filter((i) => i.status === "recebido")
    .reduce((s, i) => s + Number(i.value), 0);
  const pendente = invoices
    .filter((i) => i.status === "pendente")
    .reduce((s, i) => s + Number(i.value), 0);
  const atrasado = invoices
    .filter((i) => i.status === "pendente" && isOverdue(i.dueDate))
    .reduce((s, i) => s + Number(i.value), 0);

  const filtered = invoices.filter((i) => {
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchStatus;
  });

  function close() {
    setModal(false);
  }

  const set = (k: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function save() {
    if (!form.description.trim()) {
      toast.error("Descrição obrigatória");
      return;
    }
    if (!form.value || isNaN(Number(form.value))) {
      toast.error("Valor inválido");
      return;
    }
    create.mutate({
      ...form,
      clientId: form.clientId ? parseInt(form.clientId) : null,
      projectId: form.projectId ? parseInt(form.projectId) : null,
    } as any);
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--background)" }}>
      {/* Hero Section */}
      <div
        className="rounded-2xl p-8 mb-8"
        style={{
          background: `linear-gradient(135deg, rgba(34,197,94,.08) 0%, rgba(16,185,129,.03) 100%)`,
          border: "1px solid rgba(34,197,94,.1)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
              Recebimentos
            </h1>
            <p style={{ color: "var(--muted)" }}>
              Controle e acompanhe todos os seus recebimentos
            </p>
          </div>
          <CreditCard size={40} style={{ color: "var(--green)", opacity: 0.3 }} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Recebido", value: fmtCurrency(recebido), color: "var(--green)", icon: CheckCircle },
            { label: "A Receber", value: fmtCurrency(pendente), color: "var(--blue)", icon: Clock },
            { label: "Atrasado", value: fmtCurrency(atrasado), color: "#dc2626", icon: AlertCircle },
            {
              label: "Total",
              value: fmtCurrency(recebido + pendente),
              color: "var(--accent)",
              icon: TrendingUp,
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="rounded-xl p-4 transition-all hover:scale-105 animate-fade-in"
                style={{
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.05)",
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
                    {stat.label}
                  </div>
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <div
                  className="text-xl font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.value}
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
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por descrição..."
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
          <option value="all">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="recebido">Recebido</option>
        </select>
        <Button
          onClick={() => {
            setForm(empty);
            setModal(true);
          }}
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
          Novo Lançamento
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
                    Descrição
                  </th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                    Projeto
                  </th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                    Valor
                  </th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                    Vencimento
                  </th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-right font-semibold" style={{ color: "var(--text)" }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice, idx) => {
                  const client = clientMap[invoice.clientId ?? 0];
                  const isOverd =
                    isOverdue(invoice.dueDate) &&
                    invoice.status === "pendente";

                  return (
                    <tr
                      key={invoice.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "all 0.2s",
                        animationDelay: `${idx * 0.05}s`,
                      }}
                      className="hover:bg-opacity-50 transition-colors animate-fade-in"
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background =
                          isOverd
                            ? "rgba(220,38,38,.05)"
                            : "rgba(59,130,246,.05)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background =
                          "transparent")
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              background: "linear-gradient(135deg, var(--green), var(--blue))",
                            }}
                          >
                            <CreditCard size={18} style={{ color: "white" }} />
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: "var(--text)" }}>
                              {invoice.description}
                            </div>
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
                          className="text-sm"
                          style={{ color: "var(--muted)" }}
                        >
                          {projectMap[invoice.projectId ?? 0] || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="font-mono font-bold"
                          style={{ color: "var(--green)" }}
                        >
                          {fmtCurrency(invoice.value)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-sm"
                          style={{
                            color: isOverd ? "#dc2626" : "var(--muted)",
                            fontWeight: isOverd ? "600" : "400",
                          }}
                        >
                          {fmtDate(invoice.dueDate)}
                          {isOverd && (
                            <span style={{ marginLeft: "0.5rem" }}>⚠️</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background:
                              invoice.status === "recebido"
                                ? "rgba(34,197,94,.2)"
                                : "rgba(249,115,22,.2)",
                            color:
                              invoice.status === "recebido"
                                ? "var(--green)"
                                : "#f97316",
                          }}
                        >
                          {invoice.status === "recebido"
                            ? "✓ Recebido"
                            : "⏱ Pendente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status === "pendente" && (
                            <Button
                              onClick={() =>
                                markPaid.mutate({ id: invoice.id })
                              }
                              className="px-3 py-1 text-sm rounded-lg"
                              style={{
                                background: "rgba(34,197,94,.1)",
                                color: "var(--green)",
                                border: "none",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(34,197,94,.2)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "rgba(34,197,94,.1)")
                              }
                            >
                              Marcar como Recebido
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              if (confirm("Excluir lançamento?"))
                                del.mutate({ id: invoice.id });
                            }}
                            className="px-3 py-1 text-sm rounded-lg"
                            style={{
                              background: "rgba(220,38,38,.1)",
                              color: "#dc2626",
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
            icon="💳"
            title="Nenhum lançamento registrado ainda"
            action={
              <Button
                onClick={() => {
                  setForm(empty);
                  setModal(true);
                }}
                className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 mx-auto"
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Plus size={18} />
                Novo Lançamento
              </Button>
            }
          />
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={modal}
        onClose={close}
        title="Novo Lançamento"
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
                opacity: create.isPending ? 0.7 : 1,
              }}
              disabled={create.isPending}
            >
              {create.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <FormGroup label="Descrição *">
          <Input
            value={form.description}
            onChange={set("description")}
            placeholder="Ex: Site Institucional — 50% entrada"
          />
        </FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Valor (R$) *">
            <Input
              type="number"
              step="0.01"
              value={form.value}
              onChange={set("value")}
              placeholder="0.00"
            />
          </FormGroup>
          <FormGroup label="Vencimento">
            <Input
              type="date"
              value={form.dueDate}
              onChange={set("dueDate")}
            />
          </FormGroup>
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
        </div>
        <FormGroup label="Status">
          <Select value={form.status} onChange={set("status")}>
            <option value="pendente">Pendente</option>
            <option value="recebido">Recebido</option>
          </Select>
        </FormGroup>
        <FormGroup label="Observações">
          <Textarea
            value={form.notes}
            onChange={set("notes")}
            placeholder="Notas sobre este lançamento..."
          />
        </FormGroup>
      </Modal>
    </div>
  );
}
