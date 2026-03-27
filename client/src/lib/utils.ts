export const fmtCurrency = (v: number | string | null | undefined) =>
  "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d + (d.length === 10 ? "T12:00" : "")) : d;
  return date.toLocaleDateString("pt-BR");
};

export const today = () => new Date().toISOString().split("T")[0];
export const isOverdue = (d: string | null | undefined) => !!d && new Date(d) < new Date(today());

const BADGE_CLASS: Record<string, string> = {
  ativo:"green", inativo:"gray", lead:"blue", suspended:"gray",
  em_andamento:"blue", concluido:"green", pausado:"yellow", cancelado:"gray",
  aprovada:"green", recusada:"red", enviada:"blue", rascunho:"gray", vencida:"orange",
  recebido:"green", pendente:"yellow", vencido:"red",
  todo:"gray", doing:"blue", review:"yellow", done:"green",
  baixa:"gray", media:"yellow", alta:"orange", urgente:"red",
  proposta:"blue", negociacao:"yellow", ganho:"green", perdido:"red", contato:"blue",
  active:"green", pending:"yellow",
  viewer:"gray", member:"blue", admin:"orange", superadmin:"accent",
};
const BADGE_LABEL: Record<string, string> = {
  em_andamento:"Em Andamento", concluido:"Concluído", pausado:"Pausado", cancelado:"Cancelado",
  todo:"A Fazer", doing:"Em Andamento", review:"Em Revisão", done:"Concluído",
  baixa:"Baixa", media:"Média", alta:"Alta", urgente:"Urgente",
  negociacao:"Negociação", ganho:"Ganho", perdido:"Perdido",
  rascunho:"Rascunho", enviada:"Enviada", aprovada:"Aprovada", recusada:"Recusada", vencida:"Vencida",
  recebido:"Recebido", pendente:"Pendente", vencido:"Vencido",
  ativo:"Ativo", inativo:"Inativo", lead:"Lead",
  active:"Ativo", pending:"Pendente", suspended:"Suspenso",
};
export const getBadgeClass  = (s: string) => BADGE_CLASS[s]  || "gray";
export const getBadgeLabel  = (s: string) => BADGE_LABEL[s]  || s;
