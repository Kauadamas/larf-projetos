import { useState, useEffect } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import {
  Card, CardHeader, CardTitle, CardBody, Button, Modal, FormGroup, Input, Select,
  Textarea, EmptyState, Badge, DataTable, Avatar, Tag
} from "../../components/UI";
import { Search, Plus, Edit2, Trash2, Mail, MapPin, Phone } from "lucide-react";

const ORIGINS = ["Indicação", "Instagram", "Google", "Facebook", "LinkedIn", "Site", "Cold Outreach", "Outro"];
const STATUSES = [
  { value: "lead", label: "Lead", color: "var(--yellow)" },
  { value: "ativo", label: "Ativo", color: "var(--green)" },
  { value: "inativo", label: "Inativo", color: "var(--muted)" },
];

type FormData = {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  origin: string;
  status: "lead" | "ativo" | "inativo";
  notes: string;
};
const empty: FormData = {
  name: "",
  cnpj: "",
  email: "",
  phone: "",
  address: "",
  origin: "Indicação",
  status: "ativo",
  notes: "",
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [mounted, setMounted] = useState(false);
  const utils = trpc.useUtils();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: clients = [], isLoading } = trpc.clients.list.useQuery();
  const create = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado!");
      utils.clients.list.invalidate();
      utils.dashboard.stats.invalidate();
      close();
    },
  });
  const update = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado!");
      utils.clients.list.invalidate();
      close();
    },
  });
  const del = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Cliente removido.");
      utils.clients.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });

  const filtered = clients.filter(c => {
    const matchSearch =
      (c.name + c.email + c.cnpj + "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function openCreate() {
    setEditId(null);
    setForm(empty);
    setModal(true);
  }

  function openEdit(c: typeof clients[0]) {
    setEditId(c.id);
    setForm({
      name: c.name,
      cnpj: c.cnpj || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      origin: c.origin || "Indicação",
      status: c.status,
      notes: c.notes || "",
    });
    setModal(true);
  }

  function close() {
    setModal(false);
  }

  const set = (k: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [k]: e.target.value }));

  function save() {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (editId) update.mutate({ id: editId, ...form });
    else create.mutate(form);
  }

  if (!mounted) return null;

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === "ativo").length,
    leads: clients.filter(c => c.status === "lead").length,
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* ═══════════════════════════════════════════════════════════════════ 
          HERO SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="px-6 pt-8 pb-6 animate-fade"
        style={{
          background: `linear-gradient(135deg, rgba(59,130,246,.05) 0%, rgba(0,217,255,.02) 100%)`,
          borderBottom: "1px solid rgba(59,130,246,.1)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Clientes</h1>
              <p style={{ color: "var(--muted)" }} className="text-sm">
                Gerencie todas as relações comerciais da empresa
              </p>
            </div>
            <Button
              variant="primary"
              onClick={openCreate}
              className="flex items-center gap-2 self-start md:self-auto"
            >
              <Plus size={18} />
              Novo Cliente
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ background: "rgba(59,130,246,.1)", border: "1px solid rgba(59,130,246,.2)" }}>
              <div style={{ color: "var(--muted)" }} className="text-xs mb-1">
                Total
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="p-4 rounded-lg" style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.2)" }}>
              <div style={{ color: "var(--muted)" }} className="text-xs mb-1">
                Ativos
              </div>
              <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            </div>
            <div className="p-4 rounded-lg" style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)" }}>
              <div style={{ color: "var(--muted)" }} className="text-xs mb-1">
                Leads
              </div>
              <div className="text-2xl font-bold text-yellow-500">{stats.leads}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ 
          MAIN CONTENT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Filters & Search */}
        <Card className="mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted)" }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar cliente, email ou CNPJ..."
                  className="input pl-10 w-full"
                />
              </div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="input px-3 py-2 w-40"
              >
                <option value="all">Todos os status</option>
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </CardBody>
        </Card>

        {/* Table View */}
        {view === "table" && (
          <Card className="animate-fade">
            <CardHeader>
              <CardTitle>{filtered.length} Cliente{filtered.length !== 1 ? "s" : ""}</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={view === "table" ? "primary" : "secondary"}
                  onClick={() => setView("table")}
                >
                  Tabela
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setView("grid")}>
                  Cards
                </Button>
              </div>
            </CardHeader>

            {isLoading ? (
              <CardBody>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton skeleton-text" />
                  ))}
                </div>
              </CardBody>
            ) : filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "2px solid rgba(59,130,246,.1)", color: "var(--muted2)" }}>
                        Cliente
                      </th>
                      <th style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "2px solid rgba(59,130,246,.1)", color: "var(--muted2)" }}>
                        Email
                      </th>
                      <th style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "2px solid rgba(59,130,246,.1)", color: "var(--muted2)" }}>
                        Telefone
                      </th>
                      <th style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "2px solid rgba(59,130,246,.1)", color: "var(--muted2)" }}>
                        Origem
                      </th>
                      <th style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "2px solid rgba(59,130,246,.1)", color: "var(--muted2)" }}>
                        Status
                      </th>
                      <th style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "2px solid rgba(59,130,246,.1)", color: "var(--muted2)", width: "100px" }}>
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id}>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(59,130,246,.1)" }}>
                          <div className="flex items-center gap-2">
                            <Avatar name={c.name} size="sm" />
                            <div>
                              <div className="font-semibold text-sm">{c.name}</div>
                              {c.cnpj && (
                                <div className="text-xs" style={{ color: "var(--muted)" }}>
                                  {c.cnpj}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(59,130,246,.1)" }}>
                          <a
                            href={`mailto:${c.email}`}
                            className="text-xs hover:underline"
                            style={{ color: "var(--accent)" }}
                          >
                            {c.email || "—"}
                          </a>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(59,130,246,.1)" }}>
                          <span className="text-xs">{c.phone || "—"}</span>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(59,130,246,.1)" }}>
                          <span
                            className="text-xs px-2 py-1 rounded-lg font-medium"
                            style={{ background: "rgba(59,130,246,.1)", color: "var(--accent)" }}
                          >
                            {c.origin || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(59,130,246,.1)" }}>
                          <Badge status={c.status} />
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(59,130,246,.1)" }}>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => openEdit(c)}
                              className="p-1.5 rounded transition-all hover:bg-opacity-50"
                              style={{ background: "rgba(59,130,246,.1)", color: "var(--accent)" }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Excluir cliente?")) del.mutate({ id: c.id });
                              }}
                              className="p-1.5 rounded transition-all hover:bg-opacity-50"
                              style={{ background: "rgba(239,68,68,.1)", color: "var(--red)" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <CardBody>
                <EmptyState
                  icon="👥"
                  title={search ? "Nenhum cliente encontrado" : "Sem clientes"}
                  action={
                    !search ? (
                      <Button variant="primary" onClick={openCreate}>
                        + Cadastrar
                      </Button>
                    ) : undefined
                  }
                />
              </CardBody>
            )}
          </Card>
        )}

        {/* Grid View */}
        {view === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade">
            {filtered.map((c, i) => (
              <Card key={c.id} style={{ animationDelay: `${i * 0.05}s` }} className="animate-slide-up">
                <CardBody>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={c.name} size="md" />
                      <div className="flex-1">
                        <h3 className="font-bold text-sm mb-1">{c.name}</h3>
                        <Badge status={c.status} />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded transition-all hover:bg-opacity-50"
                        style={{ background: "rgba(59,130,246,.1)", color: "var(--accent)" }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Excluir cliente?")) del.mutate({ id: c.id });
                        }}
                        className="p-1.5 rounded transition-all hover:bg-opacity-50"
                        style={{ background: "rgba(239,68,68,.1)", color: "var(--red)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
                        style={{ color: "var(--accent)" }}
                      >
                        <Mail size={14} />
                        {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
                        <Phone size={14} />
                        {c.phone}
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-start gap-2 text-sm" style={{ color: "var(--muted)" }}>
                        <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{c.address}</span>
                      </div>
                    )}
                  </div>

                  {c.notes && (
                    <div
                      className="mt-3 p-3 rounded-lg border text-xs"
                      style={{
                        background: "rgba(59,130,246,.03)",
                        borderColor: "rgba(59,130,246,.1)",
                        color: "var(--muted)",
                      }}
                    >
                      {c.notes}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modal}
        onClose={close}
        title={editId ? "Editar Cliente" : "Novo Cliente"}
        footer={
          <>
            <Button onClick={close}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={save}
              loading={create.isPending || update.isPending}
            >
              Salvar
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Nome / Razão Social *">
            <Input
              value={form.name}
              onChange={set("name")}
              placeholder="Nome da empresa"
              autoFocus
            />
          </FormGroup>
          <FormGroup label="CNPJ / CPF">
            <Input
              value={form.cnpj}
              onChange={set("cnpj")}
              placeholder="00.000.000/0001-00"
            />
          </FormGroup>
          <FormGroup label="E-mail">
            <Input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="contato@empresa.com"
            />
          </FormGroup>
          <FormGroup label="Telefone">
            <Input
              value={form.phone}
              onChange={set("phone")}
              placeholder="(64) 9 9999-0000"
            />
          </FormGroup>
          <FormGroup label="Origem">
            <Select value={form.origin} onChange={set("origin")}>
              {ORIGINS.map(o => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Status">
            <Select value={form.status} onChange={set("status")}>
              <option value="lead">Lead</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </Select>
          </FormGroup>
        </div>
        <FormGroup label="Endereço">
          <Input
            value={form.address}
            onChange={set("address")}
            placeholder="Rua, número, cidade — UF"
          />
        </FormGroup>
        <FormGroup label="Observações">
          <Textarea
            value={form.notes}
            onChange={set("notes")}
            placeholder="Notas internas sobre o cliente..."
          />
        </FormGroup>
      </Modal>
    </div>
  );
}
