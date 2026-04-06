import { useState, useEffect, useRef } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { fmtDate, today } from "../../lib/utils";
import { PageHeader, Card, CardHeader, CardTitle, CardBody, Table, Th, Td, Tr, Badge, Button, Modal, FormGroup, Input, Select, Textarea, EmptyState, ConfirmDialog } from "../../components/UI";

type FormData = { projectId: string; date: string; hours: string; description: string; billable: "1" | "0" };
const empty: FormData = { projectId: "", date: today(), hours: "", description: "", billable: "1" };

const TIMER_KEY = "larf_timer";

function loadTimer(): { startedAt: number; projectId: string } | null {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export default function Time() {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [timerProject, setTimerProject] = useState("");
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utils = trpc.useUtils();

  const { data: entries = [] } = trpc.time.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const create = trpc.time.create.useMutation({
    onSuccess: () => { toast.success("Horas registradas!"); utils.time.list.invalidate(); utils.dashboard.stats.invalidate(); close(); },
  });
  const del = trpc.time.delete.useMutation({
    onSuccess: () => { toast.success("Removida."); utils.time.list.invalidate(); utils.dashboard.stats.invalidate(); setDeleteConfirm(null); },
  });

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]));
  const totalHours = entries.reduce((s, e) => s + Number(e.hours), 0);

  useEffect(() => {
    const saved = loadTimer();
    if (saved) {
      setTimerProject(saved.projectId);
      setRunning(true);
      setSeconds(Math.floor((Date.now() - saved.startedAt) / 1000));
      intervalRef.current = setInterval(() => {
        const s = loadTimer();
        if (s) setSeconds(Math.floor((Date.now() - s.startedAt) / 1000));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function toggleTimer() {
    const saved = loadTimer();
    if (saved) {
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
      localStorage.removeItem(TIMER_KEY);
      setRunning(false);
      const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
      const h = Math.max(0.25, Math.round(elapsed / 900) * 0.25);
      if (saved.projectId) {
        create.mutate({ projectId: parseInt(saved.projectId), date: today(), hours: String(h), description: "Via timer", billable: true });
      } else {
        toast.error("Nenhum projeto selecionado");
      }
      setSeconds(0);
    } else {
      if (!timerProject) { toast.error("Selecione um projeto antes de iniciar"); return; }
      const startedAt = Date.now();
      localStorage.setItem(TIMER_KEY, JSON.stringify({ startedAt, projectId: timerProject }));
      setRunning(true);
      intervalRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    }
  }

  function fmtTime(s: number) {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  }

  function close() { setModal(false); }
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function save() {
    if (!form.projectId) { toast.error("Selecione um projeto"); return; }
    if (!form.hours || isNaN(Number(form.hours))) { toast.error("Informe as horas"); return; }
    create.mutate({ projectId: parseInt(form.projectId), date: form.date, hours: form.hours, description: form.description, billable: form.billable === "1" });
  }

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader title="Registro de Horas">
        <Button variant="primary" onClick={() => { setForm(empty); setModal(true); }}>+ Registrar</Button>
      </PageHeader>

      <Card className="mb-5">
        <CardBody>
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-lo)", fontSize: "10px" }}>Timer ao vivo</div>
              <div className={`text-4xl font-bold ${running ? "pulse" : ""}`}
                style={{ fontFamily: "var(--mono)", letterSpacing: "-2px", color: running ? "var(--green)" : "var(--accent)" }}>
                {fmtTime(seconds)}
              </div>
            </div>
            <div className="flex items-center gap-3 ml-auto flex-wrap">
              <Select value={timerProject} onChange={e => setTimerProject(e.target.value)} className="w-56 text-sm" disabled={running}>
                <option value="">— Selecione o projeto —</option>
                {projects.filter(p => p.status === "em_andamento").map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </Select>
              <Button variant={running ? "danger" : "primary"} onClick={toggleTimer}>
                {running ? "Parar e Registrar" : "Iniciar Timer"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entradas — {totalHours.toFixed(1)}h total</CardTitle>
        </CardHeader>
        {entries.length ? (
          <Table>
            <thead><tr><Th>Data</Th><Th>Projeto</Th><Th>Descrição</Th><Th>Horas</Th><Th>Faturável</Th><Th></Th></tr></thead>
            <tbody>
              {entries.map(e => (
                <Tr key={e.id}>
                  <Td><span className="text-sm">{fmtDate(e.date)}</span></Td>
                  <Td><span className="text-sm">{projectMap[e.projectId ?? 0] || "—"}</span></Td>
                  <Td><span className="text-sm" style={{ color: "var(--text-lo)" }}>{e.description || "—"}</span></Td>
                  <Td><span className="font-mono font-bold" style={{ color: "var(--accent)" }}>{e.hours}h</span></Td>
                  <Td>{e.billable ? <Badge status="ativo" /> : <Badge status="inativo" />}</Td>
                  <Td>
                    <Button size="sm" variant="danger" title="Remover" onClick={() => setDeleteConfirm({ id: e.id })} icon={<Trash2 size={14} />} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon="clock" title="Nenhuma hora registrada ainda. Use o timer acima ou registre manualmente." />
        )}
      </Card>

      <Modal open={modal} onClose={close} title="Registrar Horas Manualmente"
        footer={<><Button onClick={close}>Cancelar</Button><Button variant="primary" onClick={save} loading={create.isPending}>Registrar</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Projeto *">
            <Select value={form.projectId} onChange={set("projectId")}>
              <option value="">— Selecione —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Data"><Input type="date" value={form.date} onChange={set("date")} /></FormGroup>
          <FormGroup label="Horas *"><Input type="number" step="0.25" min="0.25" value={form.hours} onChange={set("hours")} placeholder="Ex: 2.5" /></FormGroup>
          <FormGroup label="Faturável">
            <Select value={form.billable} onChange={set("billable")}>
              <option value="1">Sim</option>
              <option value="0">Não</option>
            </Select>
          </FormGroup>
        </div>
        <FormGroup label="Descrição do Trabalho"><Textarea value={form.description} onChange={set("description")} placeholder="O que foi feito nessas horas?" /></FormGroup>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Remover Entrada?"
        description="Esta entrada de horas será removida permanentemente."
        loading={del.isPending}
        onConfirm={() => deleteConfirm && del.mutate({ id: deleteConfirm.id })}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </div>
  );
}
