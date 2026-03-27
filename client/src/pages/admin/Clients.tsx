import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { Edit2, Trash2 } from "lucide-react";
import { PageHeader, Card, Table, Th, Td, Tr, Badge, Button, Modal, FormGroup, Input, Select, Textarea, SearchInput, EmptyState } from "../../components/UI";

const ORIGINS = ["Indicação", "Instagram", "Google", "Facebook", "LinkedIn", "Site", "Cold Outreach", "Outro"];
const STATUSES = [{ v: "lead", l: "Lead" }, { v: "ativo", l: "Ativo" }, { v: "inativo", l: "Inativo" }];

type FormData = { name: string; cnpj: string; email: string; phone: string; address: string; origin: string; status: "lead" | "ativo" | "inativo"; notes: string };
const empty: FormData = { name: "", cnpj: "", email: "", phone: "", address: "", origin: "Indicação", status: "ativo", notes: "" };

export default function Clients() {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const utils = trpc.useUtils();

  const { data: clients = [] } = trpc.clients.list.useQuery();
  const create = trpc.clients.create.useMutation({ onSuccess: () => { toast.success("Cliente cadastrado!"); utils.clients.list.invalidate(); utils.dashboard.stats.invalidate(); close(); } });
  const update = trpc.clients.update.useMutation({ onSuccess: () => { toast.success("Atualizado!"); utils.clients.list.invalidate(); close(); } });
  const del = trpc.clients.delete.useMutation({ onSuccess: () => { toast.success("Excluído."); utils.clients.list.invalidate(); utils.dashboard.stats.invalidate(); } });

  const filtered = clients.filter(c => (c.name + c.email + c.cnpj + "").toLowerCase().includes(search.toLowerCase()));

  function openCreate() { setEditId(null); setForm(empty); setModal(true); }
  function openEdit(c: typeof clients[0]) { setEditId(c.id); setForm({ name: c.name, cnpj: c.cnpj || "", email: c.email || "", phone: c.phone || "", address: c.address || "", origin: c.origin || "Indicação", status: c.status, notes: c.notes || "" }); setModal(true); }
  function close() { setModal(false); }
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  function save() {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (editId) update.mutate({ id: editId, ...form });
    else create.mutate(form);
  }

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader title="Clientes" count={filtered.length}>
        <SearchInput value={search} onChange={setSearch} />
        <Button variant="primary" onClick={openCreate}>+ Novo Cliente</Button>
      </PageHeader>

      <Card>
        {filtered.length ? (
          <Table>
            <thead><tr><Th>Nome</Th><Th>CNPJ</Th><Th>E-mail</Th><Th>Telefone</Th><Th>Origem</Th><Th>Status</Th><Th></Th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <Tr key={c.id}>
                  <Td><span className="font-semibold">{c.name}</span></Td>
                  <Td><span className="font-mono text-xs" style={{ color: "var(--text-lo)" }}>{c.cnpj || "—"}</span></Td>
                  <Td><span className="text-sm">{c.email || "—"}</span></Td>
                  <Td><span className="text-sm">{c.phone || "—"}</span></Td>
                  <Td><span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: "var(--glass)", border: "1px solid var(--border)" }}>{c.origin || "—"}</span></Td>
                  <Td><Badge status={c.status} /></Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" title="Editar" onClick={() => openEdit(c)} icon={<Edit2 size={14} />} />
                      <Button size="sm" variant="danger" title="Excluir" onClick={() => { if (confirm("Excluir?")) del.mutate({ id: c.id }); }} icon={<Trash2 size={14} />} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon="users" title={search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"}
            action={!search ? <Button variant="primary" onClick={openCreate}>+ Cadastrar Primeiro Cliente</Button> : undefined} />
        )}
      </Card>

      <Modal open={modal} onClose={close} title={editId ? "Editar Cliente" : "Novo Cliente"}
        footer={<><Button onClick={close}>Cancelar</Button><Button variant="primary" onClick={save} loading={create.isPending || update.isPending}>Salvar</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Nome / Razão Social *"><Input value={form.name} onChange={set("name")} placeholder="Nome da empresa" /></FormGroup>
          <FormGroup label="CNPJ / CPF"><Input value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0001-00" /></FormGroup>
          <FormGroup label="E-mail"><Input type="email" value={form.email} onChange={set("email")} placeholder="contato@empresa.com" /></FormGroup>
          <FormGroup label="WhatsApp / Telefone"><Input value={form.phone} onChange={set("phone")} placeholder="(64) 9 9999-0000" /></FormGroup>
          <FormGroup label="Origem">
            <Select value={form.origin} onChange={set("origin")}>{ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}</Select>
          </FormGroup>
          <FormGroup label="Status">
            <Select value={form.status} onChange={set("status")}>{STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}</Select>
          </FormGroup>
        </div>
        <FormGroup label="Endereço"><Input value={form.address} onChange={set("address")} placeholder="Rua, número, cidade — UF" /></FormGroup>
        <FormGroup label="Observações"><Textarea value={form.notes} onChange={set("notes")} placeholder="Notas internas sobre o cliente..." /></FormGroup>
      </Modal>
    </div>
  );
}
