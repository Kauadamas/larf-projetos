# LARF — Gestão de Projetos

Sistema interno completo de gestão para a LARF Marketing Negócios Digitais e Projetos Ltda.
Plataforma fechada — acesso exclusivo por convite.

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + Wouter
- **Backend:** Node.js + Express + tRPC v11
- **Banco:** MySQL (Railway) + Drizzle ORM
- **Auth:** JWT + sessões server-side + convites por token
- **E-mail:** Resend (opcional)

## Módulos

| Módulo | Descrição |
|---|---|
| Dashboard | KPIs em tempo real, projetos ativos, vencimentos, resultado líquido |
| Clientes | CRM com lead/ativo/inativo, origem, contatos vinculados |
| Pipeline | Kanban de oportunidades por etapa com valor total |
| Projetos | CRUD com valor contratado, prazo, horas estimadas |
| Tarefas | Kanban A Fazer / Em Andamento / Em Revisão / Concluído |
| Horas | Timer ao vivo + registro manual por projeto |
| Propostas | Editor de itens com cálculo automático e visualização |
| Recebimentos | A/R com botão "Marcar como recebido" |
| Despesas | Por categoria com gráfico de barras |
| Relatórios | Receita por cliente, margem por projeto, R$/hora médio |

## Segurança

- **Zero registro público** — somente via convite de 48h (96 bytes aleatórios)
- **Rate limiting** por IP em login, convite e reset de senha
- **Lockout** após 5 tentativas falhas (15 min)
- **Sessões server-side** — revogação instantânea ao suspender/deslogar
- **Token hash no banco** — JWT raw nunca armazenado
- **Cookie `sameSite: strict`** — proteção CSRF
- **Audit log** — todas as ações críticas com IP e user-agent
- **Roles:** viewer, member, admin, superadmin

## Deploy no Railway

### 1. Banco MySQL
Cria um serviço MySQL no Railway e vincula ao serviço da aplicação.

### 2. Variáveis de ambiente
```
JWT_SECRET=<node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
NODE_ENV=production
RESEND_API_KEY=re_...   # opcional
```

### 3. Migrations (na ordem)
```bash
railway run mysql $DATABASE_URL < drizzle/0001_init.sql
railway run mysql $DATABASE_URL < drizzle/0002_auth_security.sql
```

### 4. Criar admin inicial
```bash
railway run pnpm tsx seed-admin.ts
# ou com credenciais customizadas:
railway run env ADMIN_EMAIL=seu@email.com ADMIN_PASS=Senha123! pnpm tsx seed-admin.ts
```

### 5. Push → Railway faz o build e deploy automaticamente
```bash
git push origin main
```

Login padrão: `admin@larf.com.br` / `larf2024!` → **altere na primeira entrada.**
