export const fmtCurrency = (v: number | string | null | undefined) =>
  "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d + "T12:00").toLocaleDateString("pt-BR") : "—";

export const today = () => new Date().toISOString().split("T")[0];

export const isOverdue = (d: string | null | undefined) =>
  !!d && new Date(d) < new Date(today());

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

type StatusKey = string;
const BADGE_CLASSES: Record<StatusKey, string> = {
  ativo: "badge-green", inativo: "badge-gray", lead: "badge-blue",
  em_andamento: "badge-blue", concluido: "badge-green", pausado: "badge-yellow", cancelado: "badge-gray",
  aprovada: "badge-green", recusada: "badge-red", enviada: "badge-blue", rascunho: "badge-gray", vencida: "badge-orange",
  recebido: "badge-green", pendente: "badge-yellow", vencido: "badge-red", cancelado2: "badge-gray",
  todo: "badge-gray", doing: "badge-blue", review: "badge-yellow", done: "badge-green",
  alta: "badge-red", media: "badge-yellow", baixa: "badge-gray", urgente: "badge-red",
  proposta: "badge-blue", negociacao: "badge-yellow", ganho: "badge-green", perdido: "badge-red", contato: "badge-blue",
};

const BADGE_LABELS: Record<StatusKey, string> = {
  em_andamento: "Em Andamento", concluido: "Concluído", todo: "A Fazer",
  doing: "Em Andamento", review: "Em Revisão", done: "Concluído",
  alta: "Alta", media: "Média", baixa: "Baixa", urgente: "Urgente",
  negociacao: "Negociação", proposta: "Proposta", ganho: "Ganho", perdido: "Perdido",
  vencida: "Vencida", vencido: "Vencido",
};

export function getBadgeClass(s: string) { return BADGE_CLASSES[s] || "badge-gray"; }
export function getBadgeLabel(s: string) { return BADGE_LABELS[s] || s; }
