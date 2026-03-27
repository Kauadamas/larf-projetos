import { useState } from "react";
import {
  LayoutGrid, Users, TrendingUp, FolderOpen, CheckSquare, Clock,
  FileText, CreditCard, DollarSign, BarChart3, Settings, ChevronRight,
  ChevronDown, Play, Lightbulb, Target, Zap, Star,
} from "lucide-react";

interface Topic {
  id: string; icon: React.ComponentType<any>; label: string;
  subs: { id: string; label: string; content: React.ReactNode }[];
}

function MockupScreen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="tut-mockup mt-4 mb-2">
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "var(--navy)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div className="flex gap-1.5">
          {["#EF4444","#F59E0B","#10B981"].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }}/>)}
        </div>
        <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,.45)" }}>{title}</span>
      </div>
      <div className="p-5" style={{ background: "var(--bg-hi)" }}>{children}</div>
    </div>
  );
}

function MockKpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--glass-hi)", border: "1px solid var(--border)", borderTop: `3px solid ${color}` }}>
      <div className="text-xs font-bold uppercase" style={{ color: "var(--text-lo)" }}>{label}</div>
      <div className="text-xl font-extrabold font-mono mt-1" style={{ color: "var(--navy)" }}>{value}</div>
    </div>
  );
}

const TOPICS: Topic[] = [
  {
    id: "dashboard", icon: LayoutGrid, label: "Dashboard",
    subs: [
      { id: "overview", label: "Visão geral", content: (
        <>
          <p className="tut-p">O Dashboard é a tela principal da plataforma. Ele concentra os <strong>indicadores mais importantes</strong> da sua operação em tempo real.</p>
          <div className="tut-step"><div className="tut-step-num">1</div><div><strong style={{color:"var(--navy)"}}>KPIs principais</strong><p className="tut-p" style={{marginBottom:0}}>Os cards no topo mostram receita recebida, valores a receber, resultado líquido, projetos ativos, clientes e horas registradas.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">2</div><div><strong style={{color:"var(--navy)"}}>Projetos em andamento</strong><p className="tut-p" style={{marginBottom:0}}>Lista os projetos com status "Em Andamento" com prazo e cliente vinculado.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">3</div><div><strong style={{color:"var(--navy)"}}>Vencimentos pendentes</strong><p className="tut-p" style={{marginBottom:0}}>Recebimentos com data de vencimento próxima ou já vencida são destacados em vermelho.</p></div></div>
          <MockupScreen title="larf.app/admin">
            <div className="grid grid-cols-3 gap-2">
              <MockKpi label="Receita" value="R$ 18.500" color="var(--green)"/>
              <MockKpi label="A Receber" value="R$ 4.200" color="var(--yellow)"/>
              <MockKpi label="Resultado" value="R$ 14.300" color="var(--orange)"/>
            </div>
          </MockupScreen>
          <div className="tut-tip"><strong>Dica:</strong> Clique em qualquer item do dashboard para navegar diretamente para o módulo correspondente.</div>
        </>
      )},
      { id: "kpis", label: "Entendendo os KPIs", content: (
        <>
          <p className="tut-p">Cada KPI (Key Performance Indicator) mostra um aspecto crítico do negócio. Veja o que cada um significa:</p>
          {[
            ["Receita Recebida", "Total de recebimentos com status 'Recebido' no período atual.","var(--green)"],
            ["A Receber", "Total de recebimentos pendentes — aqui entra o que ainda não chegou no caixa.","var(--yellow)"],
            ["Resultado Líquido", "Receita Recebida menos Despesas Pagas. Negativo = prejuízo.","var(--orange)"],
            ["Projetos Ativos", "Projetos com status 'Em Andamento'.","var(--navy)"],
          ].map(([t,d,c]) => (
            <div key={t} className="tut-step"><div className="tut-step-num" style={{background:c as string}}>→</div><div><strong style={{color:"var(--navy)"}}>{t}</strong><p className="tut-p" style={{marginBottom:0}}>{d}</p></div></div>
          ))}
        </>
      )},
    ],
  },
  {
    id: "clients", icon: Users, label: "Clientes",
    subs: [
      { id: "add-client", label: "Cadastrar cliente", content: (
        <>
          <p className="tut-p">A gestão de clientes centraliza todas as informações de contato, histórico e status de cada empresa ou pessoa com quem você trabalha.</p>
          <div className="tut-step"><div className="tut-step-num">1</div><div><strong style={{color:"var(--navy)"}}>Clique em "Novo Cliente"</strong><p className="tut-p" style={{marginBottom:0}}>O botão laranja no canto superior direito abre o formulário de cadastro.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">2</div><div><strong style={{color:"var(--navy)"}}>Preencha os dados</strong><p className="tut-p" style={{marginBottom:0}}>Nome é obrigatório. CNPJ, e-mail, telefone, endereço e origem são opcionais mas ajudam muito no acompanhamento.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">3</div><div><strong style={{color:"var(--navy)"}}>Status do cliente</strong><p className="tut-p" style={{marginBottom:0}}><strong>Lead</strong> = contato inicial, <strong>Ativo</strong> = cliente atual, <strong>Inativo</strong> = não trabalha mais com você.</p></div></div>
          <MockupScreen title="Novo Cliente">
            <div className="grid grid-cols-2 gap-3">
              {[["Nome *","LARF Marketing"],["CNPJ","12.345.678/0001-90"],["E-mail","contato@larf.com"],["Telefone","(64) 9 9876-5432"]].map(([l,v]) => (
                <div key={l}><div className="text-xs font-bold uppercase" style={{color:"var(--text-lo)"}}>{l}</div><div className="rounded-md px-3 py-2 text-sm mt-1" style={{background:"var(--glass-hi)",border:"1.5px solid var(--orange)",color:"var(--text)"}}>{v}</div></div>
              ))}
            </div>
          </MockupScreen>
          <div className="tut-tip"><strong>Dica:</strong> Use o campo "Origem" para saber de onde veio o cliente (Indicação, Instagram, Google...). Isso ajuda a entender quais canais trazem mais negócios.</div>
        </>
      )},
      { id: "contacts", label: "Contatos vinculados", content: (
        <>
          <p className="tut-p">Cada cliente pode ter múltiplos contatos — gerentes, diretores, responsáveis financeiros. Isso facilita saber com quem falar em cada situação.</p>
          <div className="tut-step"><div className="tut-step-num">1</div><div><strong style={{color:"var(--navy)"}}>Abra o cliente</strong><p className="tut-p" style={{marginBottom:0}}>Clique no cliente na lista para ver seus detalhes e contatos vinculados.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">2</div><div><strong style={{color:"var(--navy)"}}>Adicionar contato</strong><p className="tut-p" style={{marginBottom:0}}>Clique em "+ Adicionar Contato" e preencha nome, cargo, e-mail e telefone.</p></div></div>
          <div className="tut-tip"><strong>Dica:</strong> Registrar o cargo do contato é importante para saber se você precisa falar com o decisor ou com o operacional.</div>
        </>
      )},
    ],
  },
  {
    id: "pipeline", icon: TrendingUp, label: "Pipeline",
    subs: [
      { id: "pipeline-intro", label: "O que é o Pipeline?", content: (
        <>
          <p className="tut-p">O Pipeline de Vendas mostra todas as oportunidades comerciais organizadas por etapa. É uma visualização Kanban que deixa claro onde cada negócio está no processo.</p>
          <div className="grid grid-cols-3 gap-2 my-4">
            {[["Lead","var(--text-lo)"],["Proposta","var(--blue)"],["Ganho","var(--green)"]].map(([s,c])=>(
              <div key={s} className="rounded-lg px-3 py-2 text-center text-xs font-bold" style={{background:"var(--glass-hi)",border:`2px solid ${c}`,color:c as string}}>{s}</div>
            ))}
          </div>
          {[["Lead","Primeiro contato realizado."],["Contato","Está em negociação ativa."],["Proposta","Proposta enviada, aguardando resposta."],["Negociação","Discutindo valores e condições."],["Ganho","Fechado!"],["Perdido","Não avançou."]].map(([s,d])=>(
            <div key={s} className="tut-step"><div className="tut-step-num" style={{background:"var(--navy)",fontSize:"10px"}}>{s.slice(0,2).toUpperCase()}</div><div><strong style={{color:"var(--navy)"}}>{s}</strong><p className="tut-p" style={{marginBottom:0}}>{d}</p></div></div>
          ))}
          <div className="tut-tip"><strong>Dica:</strong> Sempre atualize o estágio dos negócios. Um pipeline desatualizado não serve de nada!</div>
        </>
      )},
    ],
  },
  {
    id: "projects", icon: FolderOpen, label: "Projetos",
    subs: [
      { id: "create-project", label: "Criar um projeto", content: (
        <>
          <p className="tut-p">Projetos conectam clientes, tarefas, horas registradas, propostas e recebimentos em um único lugar.</p>
          <div className="tut-step"><div className="tut-step-num">1</div><div><strong style={{color:"var(--navy)"}}>Nome e Cliente</strong><p className="tut-p" style={{marginBottom:0}}>Dê um nome claro ao projeto e vincule a um cliente cadastrado.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">2</div><div><strong style={{color:"var(--navy)"}}>Valor e Horas</strong><p className="tut-p" style={{marginBottom:0}}>Informe o valor contratado e a estimativa de horas para controlar a rentabilidade.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">3</div><div><strong style={{color:"var(--navy)"}}>Prazo</strong><p className="tut-p" style={{marginBottom:0}}>A data de deadline aparece em vermelho no Dashboard quando vencida.</p></div></div>
          <div className="tut-tip"><strong>Dica:</strong> O campo "Horas Estimadas" é fundamental para calcular o valor por hora do projeto. Sem ele, não dá pra saber se o projeto foi lucrativo.</div>
        </>
      )},
      { id: "project-status", label: "Status do projeto", content: (
        <>
          <p className="tut-p">Mantenha o status sempre atualizado para que o Dashboard reflita a realidade.</p>
          {[["Em Andamento","Projeto ativo, trabalho em curso.","var(--blue)"],["Pausado","Temporariamente parado — aguardando cliente ou recursos.","var(--yellow)"],["Concluído","Entregue e finalizado.","var(--green)"],["Cancelado","Não será mais executado.","var(--text-lo)"]].map(([s,d,c])=>(
            <div key={s} className="tut-step"><div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{background:c as string}}/><div><strong style={{color:"var(--navy)"}}>{s}</strong><p className="tut-p" style={{marginBottom:0}}>{d}</p></div></div>
          ))}
        </>
      )},
    ],
  },
  {
    id: "tasks", icon: CheckSquare, label: "Tarefas",
    subs: [
      { id: "kanban", label: "Usando o Kanban", content: (
        <>
          <p className="tut-p">O Kanban de tarefas organiza o trabalho em quatro colunas que representam o fluxo de execução.</p>
          <MockupScreen title="Tarefas — Kanban">
            <div className="flex gap-3 overflow-x-auto">
              {[["A Fazer","var(--text-lo)","2"],["Em Andamento","var(--blue)","1"],["Em Revisão","var(--yellow)","1"],["Concluído","var(--green)","4"]].map(([col,c,n])=>(
                <div key={col} style={{minWidth:"120px"}}>
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-md mb-2" style={{background:"var(--glass-hi)",borderLeft:`3px solid ${c}`}}>
                    <span className="text-xs font-bold" style={{color:c as string}}>{col}</span>
                    <span className="text-xs font-mono" style={{color:c as string}}>{n}</span>
                  </div>
                  <div className="rounded-md p-2 text-xs" style={{background:"var(--glass-hi)",border:"1px solid var(--border)"}}>Tarefa exemplo</div>
                </div>
              ))}
            </div>
          </MockupScreen>
          <div className="tut-step"><div className="tut-step-num">1</div><div><strong style={{color:"var(--navy)"}}>Criar tarefa</strong><p className="tut-p" style={{marginBottom:0}}>Clique em "+" na coluna ou no botão "Nova Tarefa". Defina nome, prioridade e projeto.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">2</div><div><strong style={{color:"var(--navy)"}}>Mover entre colunas</strong><p className="tut-p" style={{marginBottom:0}}>Edite a tarefa e mude o status, ou use os botões de ação rápida.</p></div></div>
          <div className="tut-tip"><strong>Dica:</strong> Use a prioridade <strong>Urgente</strong> com moderação — quando tudo é urgente, nada é urgente.</div>
        </>
      )},
    ],
  },
  {
    id: "time", icon: Clock, label: "Horas",
    subs: [
      { id: "time-tracking", label: "Registrar horas", content: (
        <>
          <p className="tut-p">O registro de horas permite calcular o custo real de cada projeto e o valor cobrado por hora.</p>
          <div className="tut-step"><div className="tut-step-num">1</div><div><strong style={{color:"var(--navy)"}}>Nova entrada</strong><p className="tut-p" style={{marginBottom:0}}>Clique em "+ Registrar Horas" e selecione o projeto, data e quantidade de horas.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">2</div><div><strong style={{color:"var(--navy)"}}>Faturável?</strong><p className="tut-p" style={{marginBottom:0}}>Marque se as horas são faturáveis (cobradas do cliente) ou não (overhead interno).</p></div></div>
          <div className="tut-step"><div className="tut-step-num">3</div><div><strong style={{color:"var(--navy)"}}>Descrição</strong><p className="tut-p" style={{marginBottom:0}}>Adicione uma descrição do que foi feito. Isso ajuda a gerar relatórios mais detalhados.</p></div></div>
          <div className="tut-tip"><strong>Dica:</strong> Compare as horas registradas com as horas estimadas no projeto para saber se está dentro do orçamento de tempo.</div>
        </>
      )},
    ],
  },
  {
    id: "proposals", icon: FileText, label: "Propostas",
    subs: [
      { id: "create-proposal", label: "Criar uma proposta", content: (
        <>
          <p className="tut-p">O módulo de propostas permite criar orçamentos profissionais com múltiplos itens, desconto e prazo de validade.</p>
          <div className="tut-step"><div className="tut-step-num">1</div><div><strong style={{color:"var(--navy)"}}>Título e Vínculo</strong><p className="tut-p" style={{marginBottom:0}}>Dê um nome e vincule a um cliente e/ou projeto existente.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">2</div><div><strong style={{color:"var(--navy)"}}>Adicionar Itens</strong><p className="tut-p" style={{marginBottom:0}}>Cada item tem descrição, quantidade e valor unitário. O total é calculado automaticamente.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">3</div><div><strong style={{color:"var(--navy)"}}>Desconto e Validade</strong><p className="tut-p" style={{marginBottom:0}}>Aplique desconto global e defina por quantos dias a proposta é válida.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">4</div><div><strong style={{color:"var(--navy)"}}>Mudar status para "Enviada"</strong><p className="tut-p" style={{marginBottom:0}}>Quando enviar a proposta ao cliente, mude o status para registrar a data de envio.</p></div></div>
          <div className="tut-tip"><strong>Dica:</strong> Quando uma proposta for aprovada, converta-a em Recebimento diretamente para não perder o vínculo entre os documentos.</div>
        </>
      )},
    ],
  },
  {
    id: "invoices", icon: CreditCard, label: "Recebimentos",
    subs: [
      { id: "invoice-management", label: "Gerenciar recebimentos", content: (
        <>
          <p className="tut-p">O módulo de recebimentos controla tudo que entra no caixa — cobranças emitidas, pagas e vencidas.</p>
          <div className="tut-step"><div className="tut-step-num">1</div><div><strong style={{color:"var(--navy)"}}>Novo Recebimento</strong><p className="tut-p" style={{marginBottom:0}}>Crie um lançamento com descrição, valor, data de vencimento e vínculo com cliente/projeto.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">2</div><div><strong style={{color:"var(--navy)"}}>Marcar como Recebido</strong><p className="tut-p" style={{marginBottom:0}}>Clique no botão de check para registrar o recebimento com a data de hoje.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">3</div><div><strong style={{color:"var(--navy)"}}>Vencimentos em atraso</strong><p className="tut-p" style={{marginBottom:0}}>Lançamentos com vencimento passado ficam destacados no Dashboard para ação rápida.</p></div></div>
          <div className="tut-tip"><strong>Dica:</strong> Mantenha os recebimentos sempre atualizados — eles são a base do cálculo do Resultado Líquido no Dashboard.</div>
        </>
      )},
    ],
  },
  {
    id: "expenses", icon: DollarSign, label: "Despesas",
    subs: [
      { id: "expense-tracking", label: "Registrar despesas", content: (
        <>
          <p className="tut-p">Registre todas as saídas do caixa — ferramentas, fornecedores, freelancers, infraestrutura. Sem isso, o resultado líquido não é real.</p>
          <div className="tut-step"><div className="tut-step-num">1</div><div><strong style={{color:"var(--navy)"}}>Categoria</strong><p className="tut-p" style={{marginBottom:0}}>Classifique a despesa por categoria (Software, Marketing, Pessoal, etc.) para análise no relatório.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">2</div><div><strong style={{color:"var(--navy)"}}>Vinculada a projeto?</strong><p className="tut-p" style={{marginBottom:0}}>Se a despesa é específica de um projeto (ex: compra de material para cliente), vincule para calcular a margem real.</p></div></div>
          <div className="tut-tip"><strong>Dica:</strong> Despesas não vinculadas a projetos são consideradas overhead operacional e reduzem o resultado geral da empresa.</div>
        </>
      )},
    ],
  },
  {
    id: "reports", icon: BarChart3, label: "Relatórios",
    subs: [
      { id: "financial-reports", label: "Relatório financeiro", content: (
        <>
          <p className="tut-p">Os relatórios consolidam os dados de toda a plataforma em análises visuais para tomada de decisão.</p>
          <div className="tut-step"><div className="tut-step-num">1</div><div><strong style={{color:"var(--navy)"}}>Receita por Cliente</strong><p className="tut-p" style={{marginBottom:0}}>Veja quanto cada cliente representa no seu faturamento total.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">2</div><div><strong style={{color:"var(--navy)"}}>Margem por Projeto</strong><p className="tut-p" style={{marginBottom:0}}>Compare receita e despesas por projeto para identificar os mais rentáveis.</p></div></div>
          <div className="tut-step"><div className="tut-step-num">3</div><div><strong style={{color:"var(--navy)"}}>R$/hora médio</strong><p className="tut-p" style={{marginBottom:0}}>Calcula o valor médio por hora registrada em cada projeto — crucial para precificação.</p></div></div>
          <div className="tut-tip"><strong>Dica:</strong> Se o R$/hora de um projeto for menor que seu custo operacional por hora, você está trabalhando no prejuízo.</div>
        </>
      )},
    ],
  },
  {
    id: "users", icon: Settings, label: "Usuários & Acesso",
    subs: [
      { id: "invite-users", label: "Convidar membros", content: (
        <>
          <p className="tut-p">A plataforma é fechada — ninguém pode se registrar sem um convite. Apenas administradores podem enviar convites.</p>
          <div className="tut-step"><div className="tut-step-num">1</div><div><strong style={{color:"var(--navy)"}}>Acesse Usuários</strong><p className="tut-p" style={{marginBottom:0}}>No menu lateral, clique em "Usuários" (visível apenas para admins).</p></div></div>
          <div className="tut-step"><div className="tut-step-num">2</div><div><strong style={{color:"var(--navy)"}}>Enviar Convite</strong><p className="tut-p" style={{marginBottom:0}}>Digite o e-mail da pessoa, escolha o papel (Viewer, Membro, Admin) e clique em "Convidar".</p></div></div>
          <div className="tut-step"><div className="tut-step-num">3</div><div><strong style={{color:"var(--navy)"}}>Link do convite</strong><p className="tut-p" style={{marginBottom:0}}>Um link único é gerado. Válido por 48 horas. Envie diretamente para a pessoa por um canal seguro.</p></div></div>
          {[["Viewer","Só visualiza — não edita nada."],["Membro","Lê e edita dados, mas não gerencia usuários."],["Admin","Acesso total, incluindo convites e configurações."]].map(([r,d])=>(
            <div key={r} className="tut-step"><div className="tut-step-num" style={{background:"var(--navy)",fontSize:"9px",fontWeight:800}}>{r.slice(0,2).toUpperCase()}</div><div><strong style={{color:"var(--navy)"}}>{r}</strong><p className="tut-p" style={{marginBottom:0}}>{d}</p></div></div>
          ))}
          <div className="tut-tip"><strong>Importante:</strong> Não compartilhe o link de convite publicamente — ele dá acesso direto à plataforma sem senha.</div>
        </>
      )},
    ],
  },
];

export default function Tutorial() {
  const [activeTopicId, setActiveTopicId] = useState("dashboard");
  const [activeSubId, setActiveSubId] = useState("overview");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ dashboard: true });

  const activeTopic = TOPICS.find(t => t.id === activeTopicId)!;
  const activeSub = activeTopic?.subs.find(s => s.id === activeSubId);

  function selectTopic(id: string) {
    setActiveTopicId(id);
    setExpanded(e => ({ ...e, [id]: true }));
    const topic = TOPICS.find(t => t.id === id);
    if (topic) setActiveSubId(topic.subs[0].id);
  }
  function toggleExpand(id: string) {
    setExpanded(e => ({ ...e, [id]: !e[id] }));
  }

  return (
    <div className="flex h-full" style={{ minHeight: "calc(100vh - 60px)" }}>

      {/* ── Sidebar ── */}
      <aside className="flex-shrink-0 overflow-y-auto py-4 px-3"
        style={{ width: "248px", borderRight: "1px solid var(--border)", background: "var(--glass-hi)" }}>
        {/* Header */}
        <div className="px-2 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--orange-alpha)", color: "var(--orange)" }}>
              <Play size={13}/>
            </div>
            <span className="font-extrabold text-base" style={{ color: "var(--navy)" }}>Tutorial</span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-lo)" }}>Guia completo da plataforma</p>
        </div>

        {/* Topics */}
        {TOPICS.map(topic => {
          const Icon = topic.icon;
          const isExp = expanded[topic.id];
          const isTopicActive = activeTopicId === topic.id;
          return (
            <div key={topic.id} className="mb-0.5">
              <button
                className="tut-item w-full"
                style={{ fontWeight: isTopicActive ? 700 : 500, color: isTopicActive ? "var(--orange-lo)" : "var(--text-mid)", background: isTopicActive && !isExp ? "var(--orange-alpha)" : "transparent", borderColor: isTopicActive && !isExp ? "var(--orange-border)" : "transparent" }}
                onClick={() => { selectTopic(topic.id); toggleExpand(topic.id); }}>
                <Icon size={14}/>
                <span className="flex-1 text-left">{topic.label}</span>
                {isExp ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
              </button>
              {isExp && topic.subs.map(sub => (
                <button key={sub.id}
                  className={`tut-item sub w-full ${activeSubId === sub.id && activeTopicId === topic.id ? "active" : ""}`}
                  onClick={() => { setActiveTopicId(topic.id); setActiveSubId(sub.id); }}>
                  {sub.label}
                </button>
              ))}
            </div>
          );
        })}
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto p-8" style={{ maxWidth: "780px" }}>
        <div className="animate-up">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "var(--text-lo)" }}>
            <span className="font-bold" style={{ color: "var(--orange)" }}>Tutorial</span>
            <ChevronRight size={11}/>
            <span>{activeTopic?.label}</span>
            {activeSub && <><ChevronRight size={11}/><span>{activeSub.label}</span></>}
          </div>

          {/* Content */}
          {activeSub && (
            <>
              <h2 className="tut-h2">{activeSub.label}</h2>
              <div style={{ height: "3px", width: "48px", background: "var(--orange)", borderRadius: "99px", marginBottom: "20px" }}/>
              {activeSub.content}
            </>
          )}

          {/* Navigation */}
          {activeTopic && (() => {
            const allSubs = TOPICS.flatMap(t => t.subs.map(s => ({ ...s, topicId: t.id })));
            const currentIdx = allSubs.findIndex(s => s.id === activeSubId && s.topicId === activeTopicId);
            const prev = allSubs[currentIdx - 1];
            const next = allSubs[currentIdx + 1];
            return (
              <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                {prev ? (
                  <button onClick={() => { setActiveTopicId(prev.topicId); setActiveSubId(prev.id); setExpanded(e => ({ ...e, [prev.topicId]: true })); }}
                    className="flex items-center gap-2 text-sm font-semibold transition"
                    style={{ color: "var(--text-lo)" }}
                    onMouseEnter={e=>(e.currentTarget.style.color="var(--navy)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text-lo)")}>
                    ← {prev.label}
                  </button>
                ) : <div/>}
                {next && (
                  <button onClick={() => { setActiveTopicId(next.topicId); setActiveSubId(next.id); setExpanded(e => ({ ...e, [next.topicId]: true })); }}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition"
                    style={{ background: "var(--orange-alpha)", color: "var(--orange)", border: "1px solid var(--orange-border)" }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="var(--orange)";(e.currentTarget as HTMLElement).style.color="#fff"}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="var(--orange-alpha)";(e.currentTarget as HTMLElement).style.color="var(--orange)"}}>
                    {next.label} →
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
