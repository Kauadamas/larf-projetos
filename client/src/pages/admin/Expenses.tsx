import { useState, useEffect } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { fmtCurrency, fmtDate, today } from "../../lib/utils";
import {
  SkeletonRow, ProgressBar, Avatar,
  Button, Modal, FormGroup, Input, Select, Textarea, EmptyState
} from "../../components/UI";
import { TrendingDown, Plus, TrendingUp, AlertCircle, CheckCircle, Filter } from "lucide-react";

const CATEGORIES = [
  "Software",
  "Infraestrutura",
  "Marketing",
  "Equipamento",
  "Escritório",
  "Pessoal",
  "Impostos",
  "Serviços",
  "Outro",
];

type FormData = {
  description: string;
  category: string;
  value: string;
  date: string;
  projectId: string;
  paid: "1" | "0";
  notes: string;
};
const empty: FormData = {
  description: "",
  category: "Software",
  value: "",
  date: today(),
  projectId: "",
  paid: "1",
  notes: "",
};

export default function Expenses() {
  const [mounted, setMounted] = useState(false);
  const [modal, setModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [form, setForm] = useState<FormData>(empty);
  const utils = trpc.useUtils();

  const { data: expenses = [], isLoading } = trpc.expenses.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const create = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("Despesa registrada!");
      utils.expenses.list.invalidate();
      utils.dashboard.stats.invalidate();
      close();
    },
  });
  const del = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      toast.success("Excluída.");
      utils.expenses.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.title]));
  const totalPago = expenses
    .filter((e) => e.paid)
    .reduce((s, e) => s + Number(e.value), 0);
  const totalPendente = expenses
    .filter((e) => !e.paid)
    .reduce((s, e) => s + Number(e.value), 0);

  const catTotals = expenses
    .filter((e) => e.paid)
    .reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.value);
        return acc;
      },
      {} as Record<string, number>
    );

  const filtered = expenses.filter((e) => {
    return filterCategory === "all" || e.category === filterCategory;
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
      projectId: form.projectId ? parseInt(form.projectId) : null,
      paid: form.paid === "1",
    } as any);
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--background)" }}>
      {/* Hero Section */}
      <div
        className="rounded-2xl p-8 mb-8"
        style={{
          background: `linear-gradient(135deg, rgba(239,68,68,.08) 0%, rgba(220,38,38,.03) 100%)`,
          border: "1px solid rgba(239,68,68,.1)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
              Despesas
            </h1>
            <p style={{ color: "var(--muted)" }}>
              Rastreie, categorize e gerencie todos os gastos
            </p>
          </div>
          <TrendingDown size={40} style={{ color: "#dc2626", opacity: 0.3 }} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[
            { label: "Pagas", value: fmtCurrency(totalPago), color: "#dc2626", icon: CheckCircle },
            { label: "A Pagar", value: fmtCurrency(totalPendente), color: "var(--yellow)", icon: AlertCircle },
            {
              label: "Total",
              value: fmtCurrency(totalPago + totalPendente),
              color: "var(--accent)",
              icon: TrendingDown,
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
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg text-sm bg-transparent focus:outline-none"
          style={{
            color: "var(--text)",
            border: "1px solid var(--border)",
            transition: "all 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <option value="all">Todas as categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
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
          Nova Despesa
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2">
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
                        Categoria
                      </th>
                      <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                        Data
                      </th>
                      <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                        Valor
                      </th>
                      <th className="px-6 py-4 text-left font-semibold" style={{ color: "var(--text)" }}>
                        Status
                      </th>
                      <th className="px-6 py-4 text-right font-semibold" style={{ color: "var(--text)" }}>
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((expense, idx) => (
                      <tr
                        key={expense.id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          transition: "all 0.2s",
                          animationDelay: `${idx * 0.05}s`,
                        }}
                        className="hover:bg-opacity-50 transition-colors animate-fade-in"
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.background =
                            "rgba(239,68,68,.05)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.background =
                            "transparent")
                        }
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                            {expense.description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-2 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              background: "rgba(255,255,255,.05)",
                              border: "1px solid var(--border)",
                              color: "var(--text)",
                            }}
                          >
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm" style={{ color: "var(--muted)" }}>
                            {fmtDate(expense.date)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold" style={{ color: "#dc2626" }}>
                            - {fmtCurrency(expense.value)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: expense.paid
                                ? "rgba(34,197,94,.2)"
                                : "rgba(249,115,22,.2)",
                              color: expense.paid ? "var(--green)" : "#f97316",
                            }}
                          >
                            {expense.paid ? "✓ Pago" : "⏱ Pendente"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            onClick={() => {
                              if (confirm("Excluir?")) del.mutate({ id: expense.id });
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
                        </td>
                      </tr>
                    ))}
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
                icon="💸"
                title="Nenhuma despesa nesta categoria"
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
                    Registrar Despesa
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {/* By Category Sidebar */}
        {Object.keys(catTotals).length > 0 && (
          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h3 className="font-bold mb-4" style={{ color: "var(--text)" }}>
              Por Categoria
            </h3>
            <div className="space-y-4">
              {Object.entries(catTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, val]) => (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {cat}
                      </span>
                      <span className="font-mono text-xs" style={{ color: "#dc2626" }}>
                        - {fmtCurrency(val)}
                      </span>
                    </div>
                    <ProgressBar
                      value={val}
                      max={totalPago}
                      style={{
                        background: "rgba(220,38,38,.1)",
                        height: "6px",
                      }}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modal}
        onClose={close}
        title="Nova Despesa"
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
            placeholder="Ex: Adobe Creative Cloud — mensal"
          />
        </FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Categoria">
            <Select value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Valor (R$) *">
            <Input
              type="number"
              step="0.01"
              value={form.value}
              onChange={set("value")}
              placeholder="0.00"
            />
          </FormGroup>
          <FormGroup label="Data">
            <Input type="date" value={form.date} onChange={set("date")} />
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
          <Select value={form.paid} onChange={set("paid")}>
            <option value="1">Pago</option>
            <option value="0">Pendente</option>
          </Select>
        </FormGroup>
        <FormGroup label="Observações">
          <Textarea
            value={form.notes}
            onChange={set("notes")}
            placeholder="Notas sobre esta despesa..."
          />
        </FormGroup>
      </Modal>
    </div>
  );
}
