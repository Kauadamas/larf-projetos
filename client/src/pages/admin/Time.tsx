import { useState, useEffect, useRef } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { fmtDate, today } from "../../lib/utils";
import { PageHeader, Card, CardHeader, CardTitle, CardBody, Table, Th, Td, Tr, Badge, Button, Modal, FormGroup, Input, Select, Textarea, EmptyState } from "../../components/UI";

type FormData = { projectId: string; date: string; hours: string; description: string; billable: "1" | "0" };
const empty: FormData = { projectId: "", date: today(), hours: "", description: "", billable: "1" };

export default function Time() {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormData>(empty);
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerProject, setTimerProject] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const utils = trpc.useUtils();

  const { data: entries = [] } = trpc.time.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const create = trpc.time.create.useMutation({ onSuccess: () => { toast.success("Horas registradas!"); utils.time.list.invalidate(); utils.dashboard.stats.invalidate(); close(); } });
  const del = trpc.time.delete.useMutation({ onSuccess: () => { toast.success("Removida."); utils.time.list.invalidate(); utils.dashboard.stats.invalidate(); } });

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.title]));
  const totalHours = entries.reduce((s, e) => s + Number(e.hours), 0);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function toggleTimer() {
    if (running) {
      clearInterval(intervalRef.current!); intervalRef.current = null;
      setRunning(false);
      const h = Math.max(0.25, Math.round(seconds / 900) * 0.25);
      if (h > 0 && timerProject) {
        create.mutate({ projectId: parseInt(timerProject), date: today(), hours: String(h), description: "Via timer", billable: true });
      } else if (!timerProject) toast.error("Selecione um projeto antes de parar o timer");
      setSeconds(0);
    } else {
      startRef.current = Date.now() - seconds * 1000;
      intervalRef.current = setInterval(() => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
      setRunning(true);
    }
  }

  function fmtTime(s: number) {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  }

  function close() { setModal(false); }
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

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

      {/* Timer Card */}
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
              <Select value={timerProject} onChange={e => setTimerProject(e.target.value)} className="w-56 text-sm">
                <option value="">— Selecione o projeto —</option>
                {projects.filter(p => p.status === "em_andamento").map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </Select>
              <Button variant={running ? "danger" : "primary"} onClick={toggleTimer}>
                {running ? "⏹ Parar e Registrar" : "▶ Iniciar Timer"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Entries */}
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
                    <Button size="sm" variant="danger" onClick={() => { if (confirm("Remover?")) del.mutate({ id: e.id }); }}>🗑️</Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon="⏱" title="Nenhuma hora registrada ainda. Use o timer acima ou registre manualmente." />
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
    </div>
  );
}
