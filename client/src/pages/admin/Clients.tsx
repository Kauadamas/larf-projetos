import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { PageHeader, Card, Table, Th, Td, Tr, Badge, Button, IconButton, Modal, FormGroup, Input, Select, Textarea, SearchInput, EmptyState, Tag } from "../../components/UI";
import { Edit2, Trash2, UserPlus } from "lucide-react";

const ORIGINS = ["Indicação","Instagram","Google","Facebook","LinkedIn","Site","Cold Outreach","Outro"];

type Form = { name:string; cnpj:string; email:string; phone:string; address:string; origin:string; status:"lead"|"ativo"|"inativo"; notes:string };
const blank: Form = { name:"", cnpj:"", email:"", phone:"", address:"", origin:"Indicação", status:"ativo", notes:"" };

export default function Clients() {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState<Form>(blank);
  const utils = trpc.useUtils();

  const { data: clients = [] } = trpc.clients.list.useQuery();
  const create = trpc.clients.create.useMutation({ onSuccess: () => { toast.success("Cliente cadastrado!"); utils.clients.list.invalidate(); utils.dashboard.stats.invalidate(); close(); }});
  const update = trpc.clients.update.useMutation({ onSuccess: () => { toast.success("Atualizado!"); utils.clients.list.invalidate(); close(); }});
  const del    = trpc.clients.delete.useMutation({ onSuccess: () => { toast.success("Excluído."); utils.clients.list.invalidate(); utils.dashboard.stats.invalidate(); }});

  const filtered = clients.filter(c => (c.name + c.email + (c.cnpj||"")).toLowerCase().includes(search.toLowerCase()));

  function openCreate() { setEditId(null); setForm(blank); setModal(true); }
  function openEdit(c: typeof clients[0]) {
    setEditId(c.id);
    setForm({ name:c.name, cnpj:c.cnpj||"", email:c.email||"", phone:c.phone||"", address:c.address||"", origin:c.origin||"Indicação", status:c.status, notes:c.notes||"" });
    setModal(true);
  }
  function close() { setModal(false); }
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  function save() {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (editId) update.mutate({ id: editId, ...form });
    else create.mutate(form);
  }

  return (
    <div className="p-6 max-w-7xl animate-fade">
      <PageHeader title="Clientes" count={filtered.length}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente..." />
        <Button variant="primary" onClick={openCreate} icon={<UserPlus size={14}/>}>Novo Cliente</Button>
      </PageHeader>

      <Card>
        {filtered.length ? (
          <Table>
            <thead>
              <tr><Th>Nome</Th><Th>CNPJ</Th><Th>E-mail</Th><Th>Telefone</Th><Th>Origem</Th><Th>Status</Th><Th></Th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <Tr key={c.id}>
                  <Td><span className="font-semibold text-sm" style={{ color: "var(--text-hi)" }}>{c.name}</span></Td>
                  <Td mono><span className="text-xs" style={{ color: "var(--text-lo)" }}>{c.cnpj || "—"}</span></Td>
                  <Td><span className="text-sm" style={{ color: "var(--text-mid)" }}>{c.email || "—"}</span></Td>
                  <Td><span className="text-sm" style={{ color: "var(--text-mid)" }}>{c.phone || "—"}</span></Td>
                  <Td><Tag>{c.origin || "—"}</Tag></Td>
                  <Td><Badge status={c.status} /></Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <IconButton title="Editar" onClick={() => openEdit(c)}><Edit2 size={13}/></IconButton>
                      <IconButton title="Excluir" variant="danger" onClick={() => { if (confirm("Excluir cliente?")) del.mutate({ id: c.id }); }}><Trash2 size={13}/></IconButton>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon="👥" title={search ? "Nenhum resultado" : "Nenhum cliente cadastrado"}
            description={!search ? "Cadastre seu primeiro cliente para começar." : undefined}
            action={!search ? <Button variant="primary" size="xs" onClick={openCreate}>+ Cadastrar Cliente</Button> : undefined} />
        )}
      </Card>

      <Modal open={modal} onClose={close} title={editId ? "Editar Cliente" : "Novo Cliente"}
        footer={<><Button onClick={close}>Cancelar</Button><Button variant="primary" loading={create.isPending||update.isPending} onClick={save}>Salvar</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Nome *"><Input value={form.name} onChange={set("name")} placeholder="Razão social" /></FormGroup>
          <FormGroup label="CNPJ / CPF"><Input value={form.cnpj} onChange={set("cnpj")} placeholder="00.000.000/0001-00" /></FormGroup>
          <FormGroup label="E-mail"><Input type="email" value={form.email} onChange={set("email")} placeholder="contato@empresa.com" /></FormGroup>
          <FormGroup label="WhatsApp"><Input value={form.phone} onChange={set("phone")} placeholder="(64) 9 9999-0000" /></FormGroup>
          <FormGroup label="Origem">
            <Select value={form.origin} onChange={set("origin")}>{ORIGINS.map(o => <option key={o}>{o}</option>)}</Select>
          </FormGroup>
          <FormGroup label="Status">
            <Select value={form.status} onChange={set("status")}>
              <option value="lead">Lead</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </Select>
          </FormGroup>
        </div>
        <FormGroup label="Endereço"><Input value={form.address} onChange={set("address")} placeholder="Rua, número, cidade — UF" /></FormGroup>
        <FormGroup label="Observações"><Textarea value={form.notes} onChange={set("notes")} placeholder="Notas internas..." /></FormGroup>
      </Modal>
    </div>
  );
}
