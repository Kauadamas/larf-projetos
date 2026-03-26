import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { fmtDate } from "../../lib/utils";
import {
  Card, Table, Th, Td, Tr,
  Badge, Button, Modal, FormGroup, Input, Select, EmptyState, KpiCard,
} from "../../components/UI";
import { useAuth } from "../../hooks/useAuth";

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState<"viewer"|"member"|"admin">("member");
  const [sent,  setSent]  = useState<string | null>(null);
  const utils = trpc.useUtils();

  const send = trpc.auth.invite.send.useMutation({
    onSuccess: (d) => {
      setSent(d.inviteUrl);
      utils.auth.invite.list.invalidate();
      toast.success(`Convite criado para ${email}`);
    },
    onError: e => toast.error(e.message),
  });

  function close() { onClose(); setEmail(""); setRole("member"); setSent(null); }

  return (
    <Modal open={open} onClose={close} title="Enviar Convite"
      footer={sent ? <Button onClick={close}>Fechar</Button> :
        <><Button onClick={close}>Cancelar</Button>
          <Button variant="primary" onClick={() => send.mutate({ email, role })} loading={send.isPending}>Enviar Convite</Button>
        </>}>
      {sent ? (
        <div className="space-y-3">
          <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.2)", color: "var(--green)" }}>
            ✓ Convite gerado com sucesso!
          </div>
          <FormGroup label="Link do Convite (válido por 48h)">
            <div className="flex gap-2">
              <input readOnly value={sent} className="flex-1 px-3 py-2 rounded-lg text-xs"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)" }} />
              <Button size="sm" onClick={() => { navigator.clipboard.writeText(sent); toast.success("Copiado!"); }}>
                Copiar
              </Button>
            </div>
          </FormGroup>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Envie este link diretamente para o usuário por um canal seguro. Não publique em ambientes abertos.
          </p>
        </div>
      ) : (
        <>
          <FormGroup label="E-mail *">
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@empresa.com" />
          </FormGroup>
          <FormGroup label="Papel">
            <Select value={role} onChange={e => setRole(e.target.value as any)}>
              <option value="viewer">Visualizador — somente leitura</option>
              <option value="member">Membro — leitura e edição</option>
              <option value="admin">Administrador — acesso total</option>
            </Select>
          </FormGroup>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            O convite expira em 48 horas. O usuário cria a própria senha ao aceitar o link.
          </p>
        </>
      )}
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Users() {
  const { user: me } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pwModal,    setPwModal]    = useState(false);
  const [pwUserId,   setPwUserId]   = useState<number | null>(null);
  const [newPw,      setNewPw]      = useState("");
  const [tab,        setTab]        = useState<"users" | "invites" | "audit">("users");
  const utils = trpc.useUtils();

  const { data: users   = [] } = trpc.auth.users.list.useQuery();
  const { data: invites = [] } = trpc.auth.invite.list.useQuery();
  const { data: audit   = [] } = trpc.auth.users.auditLog.useQuery({ limit: 200 });

  const setRole  = trpc.auth.users.setRole.useMutation({ onSuccess: () => { toast.success("Papel atualizado!"); utils.auth.users.list.invalidate(); } });
  const setPw    = trpc.auth.users.setPassword.useMutation({ onSuccess: () => { toast.success("Senha alterada!"); setPwModal(false); setNewPw(""); } });
  const suspend  = trpc.auth.users.suspend.useMutation({ onSuccess: () => { toast.success("Usuário suspenso."); utils.auth.users.list.invalidate(); } });
  const del      = trpc.auth.users.delete.useMutation({ onSuccess: () => { toast.success("Usuário excluído."); utils.auth.users.list.invalidate(); } });

  const statusColors: Record<string, string> = { active: "var(--green)", pending: "var(--yellow)", suspended: "var(--red)" };
  const statusLabels: Record<string, string> = { active: "Ativo", pending: "Pendente", suspended: "Suspenso" };

  return (
    <div className="p-6 max-w-6xl">
      {/* Hero Section */}
      <div style={{ background: `linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(59, 130, 246, 0.1))` }} className="rounded-2xl p-6 pt-8 mb-6 border border-red-500/20">
        <h1 className="text-2xl font-bold mb-1">Gerenciamento de Usuários</h1>
        <div style={{ color: "var(--muted)" }} className="text-sm mb-4">Controle de acesso, papéis, convites e auditoria de segurança</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Usuários Ativos" value={users.filter(u => u.status === "active").length} color="var(--green)" />
          <KpiCard label="Pendentes" value={users.filter(u => u.status === "pending").length} color="var(--yellow)" />
          <KpiCard label="Suspensos" value={users.filter(u => u.status === "suspended").length} color="var(--red)" />
          <Button variant="primary" onClick={() => setInviteOpen(true)}>+ Convidar Usuário</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: "var(--surface2)" }} className="animation-fade-in">
        {(["users", "invites", "audit"] as const).map((t, idx) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all animation-fade-in"
            style={{
              background: tab === t ? "var(--surface)" : "transparent",
              color: tab === t ? "var(--text)" : "var(--muted)",
              border: tab === t ? "1px solid var(--border)" : "1px solid transparent",
              animationDelay: `${idx * 0.05}s`,
            }}>
            {{ users: "👥 Usuários", invites: "📨 Convites", audit: "📋 Auditoria" }[t]}
          </button>
        ))}
      </div>

      {/* ── Usuários ── */}
      {tab === "users" && (
        <Card className="animation-fade-in">
          {users.length ? (
            <Table>
              <thead><tr><Th>Usuário</Th><Th>E-mail</Th><Th>Papel</Th><Th>Status</Th><Th>Último login</Th><Th></Th></tr></thead>
              <tbody>
                {users.map((u: any) => (
                  <Tr key={u.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: "var(--accent)" }}>
                          {u.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{u.name}</div>
                          {u.id === me?.id && <div className="text-xs" style={{ color: "var(--accent)" }}>você</div>}
                        </div>
                      </div>
                    </Td>
                    <Td><span className="text-sm" style={{ color: "var(--muted)" }}>{u.email}</span></Td>
                    <Td>
                      {u.id !== me?.id ? (
                        <select value={u.role}
                          onChange={e => setRole.mutate({ userId: u.id, role: e.target.value as any })}
                          className="text-xs px-2 py-1 rounded-lg outline-none"
                          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>
                          <option value="viewer">viewer</option>
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                      ) : <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>{u.role}</span>}
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColors[u.status] || "var(--muted)" }} />
                        {statusLabels[u.status] || u.status}
                      </span>
                    </Td>
                    <Td><span className="text-xs" style={{ color: "var(--muted)" }}>{u.lastLoginAt ? fmtDate(u.lastLoginAt) : "Nunca"}</span></Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => { setPwUserId(u.id); setNewPw(""); setPwModal(true); }}>🔑</Button>
                        {u.id !== me?.id && u.status !== "suspended" && (
                          <Button size="sm" variant="danger" onClick={() => { if (confirm(`Suspender ${u.name}?`)) suspend.mutate({ userId: u.id }); }}>⛔</Button>
                        )}
                        {u.id !== me?.id && (
                          <Button size="sm" variant="danger" onClick={() => { if (confirm(`Excluir ${u.name}? Esta ação é irreversível.`)) del.mutate({ userId: u.id }); }}>🗑️</Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : <EmptyState icon="👥" title="Nenhum usuário cadastrado" action={<Button variant="primary" onClick={() => setInviteOpen(true)}>+ Convidar Usuário</Button>} />}
        </Card>
      )}

      {/* ── Convites ── */}
      {tab === "invites" && (
        <Card className="animation-fade-in">
          {invites.length ? (
            <Table>
              <thead><tr><Th>E-mail</Th><Th>Papel</Th><Th>Status</Th><Th>Expira em</Th><Th>Criado</Th></tr></thead>
              <tbody>
                {invites.map((i: any) => (
                  <Tr key={i.id}>
                    <Td><span className="font-medium text-sm">{i.email}</span></Td>
                    <Td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>{i.role}</span></Td>
                    <Td>
                      {i.used    ? <Badge status="ativo" />      : null}
                      {i.expired && !i.used ? <Badge status="vencido" /> : null}
                      {i.pending ? <Badge status="pendente" />   : null}
                    </Td>
                    <Td><span className="text-xs" style={{ color: "var(--muted)" }}>{fmtDate(i.expiresAt)}</span></Td>
                    <Td><span className="text-xs" style={{ color: "var(--muted)" }}>{fmtDate(i.createdAt)}</span></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : <EmptyState icon="📨" title="Nenhum convite enviado ainda" action={<Button variant="primary" onClick={() => setInviteOpen(true)}>+ Convidar Usuário</Button>} />}
        </Card>
      )}

      {/* ── Audit Log ── */}
      {tab === "audit" && (
        <Card className="animation-fade-in">
          {audit.length ? (
            <Table>
              <thead><tr><Th>Ação</Th><Th>Usuário ID</Th><Th>Detalhe</Th><Th>IP</Th><Th>Data</Th></tr></thead>
              <tbody>
                {(audit as any[]).map((a: any) => (
                  <Tr key={a.id}>
                    <Td><span className="font-mono text-xs" style={{ color: a.action.includes("fail") || a.action.includes("suspend") ? "var(--red)" : a.action.includes("success") ? "var(--green)" : "var(--muted2)" }}>{a.action}</span></Td>
                    <Td><span className="text-xs font-mono">{a.userId ?? "—"}</span></Td>
                    <Td><span className="text-xs" style={{ color: "var(--muted)" }}>{a.detail || "—"}</span></Td>
                    <Td><span className="text-xs font-mono" style={{ color: "var(--muted)" }}>{a.ipAddress || "—"}</span></Td>
                    <Td><span className="text-xs" style={{ color: "var(--muted)" }}>{fmtDate(a.createdAt)}</span></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : <EmptyState icon="📋" title="Nenhuma entrada no audit log" />}
        </Card>
      )}

      {/* ── Modais ── */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <Modal open={pwModal} onClose={() => setPwModal(false)} title="Redefinir Senha"
        footer={<>
          <Button onClick={() => setPwModal(false)}>Cancelar</Button>
          <Button variant="primary" loading={setPw.isPending}
            onClick={() => { if (newPw.length < 8) { toast.error("Mínimo 8 caracteres"); return; } setPw.mutate({ userId: pwUserId!, password: newPw }); }}>
            Salvar
          </Button>
        </>}>
        <FormGroup label="Nova Senha (mín. 8 caracteres)">
          <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
        </FormGroup>
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          Todas as sessões ativas do usuário serão encerradas.
        </p>
      </Modal>
    </div>
  );
}
