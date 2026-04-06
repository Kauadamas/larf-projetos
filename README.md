<div align="center">

<img src="client/src/assets/larflogo-clean.svg" alt="LARF Logo" width="180"/>

# LARF Projetos

**Sistema interno de gestão para a LARF Marketing Negócios Digitais e Projetos Ltda.**

Plataforma fechada — acesso exclusivo por convite.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)

</div>

---

## Visão Geral

LARF Projetos é uma plataforma full-stack de gestão operacional com CRM, kanban de tarefas, controle de horas, propostas comerciais, faturamento e relatórios — tudo em um único sistema acessível apenas por convite.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 + Wouter |
| Backend | Node.js + Express + tRPC v11 |
| Banco de dados | MySQL 8 via Railway + Drizzle ORM |
| Autenticação | JWT + sessões server-side + convites por token |
| E-mail | Resend (opcional — recuperação de senha) |
| Deploy | Railway (Nixpacks) |

## Módulos

| Módulo | Descrição |
|---|---|
| **Dashboard** | KPIs em tempo real: projetos ativos, vencimentos, resultado líquido |
| **Clientes** | CRM com status lead/ativo/inativo, origem, contatos vinculados |
| **Pipeline** | Kanban de oportunidades por etapa com valor total acumulado |
| **Projetos** | CRUD com valor contratado, prazo e horas estimadas |
| **Tarefas** | Kanban A Fazer → Em Andamento → Em Revisão → Concluído |
| **Horas** | Timer ao vivo + registro manual por projeto |
| **Propostas** | Editor de itens com cálculo automático de subtotal e desconto |
| **Recebimentos** | Contas a receber com marcação de pagamento |
| **Despesas** | Por categoria com gráfico de barras |
| **Relatórios** | Receita por cliente, margem por projeto, R$/hora médio |
| **Usuários** | Gerenciamento de membros com roles e convites por e-mail |

## Segurança

- **Zero registro público** — acesso somente via convite com token de 48h
- **Rate limiting** por IP em login, convite e reset de senha
- **Account lockout** após 5 tentativas falhas (bloqueio de 15 min)
- **Sessões server-side** — revogação instantânea ao suspender ou deslogar
- **Token hash no banco** — JWT raw nunca armazenado
- **Cookie `sameSite: strict`** — proteção CSRF nativa
- **Audit log** — todas as ações críticas registradas com IP e user-agent
- **Roles granulares:** `viewer`, `member`, `admin`, `superadmin`

---

## Deploy no Railway

### 1. Clonar e conectar

```bash
git clone https://github.com/sua-org/larf-projetos.git
```

No [Railway](https://railway.app), crie um novo projeto e conecte o repositório.

### 2. Banco de dados

Adicione um serviço **MySQL** ao projeto no Railway. A variável `DATABASE_URL` é injetada automaticamente no serviço da aplicação.

### 3. Variáveis de ambiente

No painel Railway → seu serviço → **Variables**, configure:

```env
# Obrigatório
NODE_ENV=production
JWT_SECRET=          # gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opcional — habilita e-mails de recuperação de senha
RESEND_API_KEY=re_...
```

### 4. Criar as tabelas

Execute a migration no banco recém-criado:

```bash
railway run mysql $DATABASE_URL < drizzle/0001_init.sql
```

### 5. Criar o administrador inicial

```bash
# Credenciais padrão
railway run pnpm tsx seed-admin.ts

# Ou com credenciais customizadas
railway run env ADMIN_EMAIL=voce@empresa.com ADMIN_PASS=SuaSenha123! pnpm tsx seed-admin.ts
```

> Login padrão: `admin@larf.com.br` / `larf2024!`  
> **Altere a senha imediatamente após o primeiro acesso.**

### 6. Deploy

```bash
git push origin main
```

O Railway detecta o `nixpacks.toml`, executa `pnpm build` e inicia o servidor automaticamente.

---

## Desenvolvimento local

### Pré-requisitos

- Node.js 20+
- pnpm 10+
- MySQL 8 local ou via Docker

### Configuração

```bash
# 1. Instalar dependências
pnpm install

# 2. Copiar e preencher variáveis de ambiente
cp .env.example .env

# 3. Criar as tabelas
mysql -u root -p nome_do_banco < drizzle/0001_init.sql

# 4. Criar o admin
pnpm tsx seed-admin.ts

# 5. Iniciar em modo desenvolvimento (frontend + backend com hot reload)
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`.

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Inicia frontend e backend com hot reload |
| `pnpm build` | Gera build de produção |
| `pnpm start` | Inicia o servidor em modo produção |
| `pnpm check` | Verificação de tipos TypeScript |
| `pnpm db:push` | Gera e aplica migrations via Drizzle Kit |

---

## Estrutura do projeto

```
larf-projetos/
├── client/                  # Frontend React
│   ├── src/
│   │   ├── components/      # Layout, UI primitivos, ícones
│   │   ├── hooks/           # useAuth e outros hooks
│   │   ├── lib/             # Configuração tRPC e utilitários
│   │   └── pages/
│   │       └── admin/       # Dashboard, Clientes, Projetos…
│   └── index.html
├── drizzle/
│   ├── 0001_init.sql        # Schema completo — rodar UMA vez no banco limpo
│   └── schema.ts            # Definição de tipos e tabelas (Drizzle ORM)
├── server/
│   ├── _core/               # Express, tRPC, auth, env
│   ├── auth-router.ts       # Rotas de autenticação e convites
│   ├── auth-db.ts           # Queries de sessões, audit log e tokens
│   ├── db.ts                # Queries de negócio
│   └── routers.ts           # Roteamento tRPC principal
├── seed-admin.ts            # Script de criação do admin inicial
├── .env.example
├── package.json
├── vite.config.ts
└── drizzle.config.ts
```

---

## Licença

MIT © LARF Marketing Negócios Digitais e Projetos Ltda.
