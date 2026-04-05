import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc.js";
import { authRouter } from "./auth-router.js";
import { getClientIp } from "./_core/auth.js";
import {
  getAllClients, getClientById, createClient, updateClient, deleteClient,
  getContactsByClient, createContact, updateContact, deleteContact,
  getAllPipeline, createPipelineCard, updatePipelineCard, deletePipelineCard,
  getAllProjects, getProjectById, createProject, updateProject, deleteProject,
  getAllTasks, getTasksByProject, createTask, updateTask, deleteTask,
  getAllTimeEntries, getTimeEntriesByProject, createTimeEntry, deleteTimeEntry,
  getAllProposals, getProposalById, createProposal, updateProposal, deleteProposal,
  getAllInvoices, createInvoice, updateInvoice, deleteInvoice,
  getAllExpenses, createExpense, deleteExpense,
  getDashboardStats,
} from "./db.js";
import { writeAudit } from "./auth-db.js";

// ─── Dashboard ────────────────────────────────────────────────────────────────
const dashboardRouter = router({
  stats: protectedProcedure.query(() => getDashboardStats()),
});

// ─── Clients ──────────────────────────────────────────────────────────────────
const clientsRouter = router({
  list: protectedProcedure.query(() => getAllClients()),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const c = await getClientById(input.id);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      const contacts = await getContactsByClient(input.id);
      return { ...c, contacts };
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      cnpj: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      origin: z.string().optional(),
      status: z.enum(["lead","ativo","inativo"]).default("ativo"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await createClient(input as any);
      await writeAudit({ userId: ctx.user.id, action: "client.created", entityId: id, ipAddress: getClientIp(ctx.req) });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      cnpj: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      origin: z.string().optional(),
      status: z.enum(["lead","ativo","inativo"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateClient(id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteClient(input.id);
      await writeAudit({ userId: ctx.user.id, action: "client.deleted", entityId: input.id, ipAddress: getClientIp(ctx.req) });
      return { success: true };
    }),

  addContact: protectedProcedure
    .input(z.object({ clientId: z.number(), name: z.string().min(1), role: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => { const id = await createContact(input); return { id }; }),

  updateContact: protectedProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), role: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => { const { id, ...data } = input; await updateContact(id, data as any); return { success: true }; }),

  deleteContact: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await deleteContact(input.id); return { success: true }; }),
});

// ─── Pipeline ─────────────────────────────────────────────────────────────────
const pipelineRouter = router({
  list: protectedProcedure.query(() => getAllPipeline()),

  create: protectedProcedure
    .input(z.object({
      clientName: z.string().min(1),
      clientId: z.number().optional(),
      value: z.string().optional(),
      stage: z.enum(["lead","contato","proposta","negociacao","ganho","perdido"]).default("lead"),
      probability: z.number().min(0).max(100).default(50),
      expectedClose: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => { const id = await createPipelineCard(input as any); return { id }; }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      clientName: z.string().optional(),
      value: z.string().optional(),
      stage: z.enum(["lead","contato","proposta","negociacao","ganho","perdido"]).optional(),
      probability: z.number().optional(),
      expectedClose: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => { const { id, ...data } = input; await updatePipelineCard(id, data as any); return { success: true }; }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await deletePipelineCard(input.id); return { success: true }; }),
});

// ─── Projects ─────────────────────────────────────────────────────────────────
const projectsRouter = router({
  list: protectedProcedure.query(() => getAllProjects()),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const p = await getProjectById(input.id);
      if (!p) throw new TRPCError({ code: "NOT_FOUND" });
      const [projectTasks, projectTime] = await Promise.all([getTasksByProject(input.id), getTimeEntriesByProject(input.id)]);
      return { ...p, tasks: projectTasks, timeEntries: projectTime };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      clientId: z.number().optional().nullable(),
      description: z.string().optional(),
      status: z.enum(["em_andamento","pausado","concluido","cancelado"]).default("em_andamento"),
      value: z.string().optional(),
      hoursEstimated: z.string().optional(),
      startDate: z.string().optional(),
      deadline: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await createProject(input as any);
      await writeAudit({ userId: ctx.user.id, action: "project.created", entityId: id, ipAddress: getClientIp(ctx.req) });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      clientId: z.number().optional().nullable(),
      description: z.string().optional(),
      status: z.enum(["em_andamento","pausado","concluido","cancelado"]).optional(),
      value: z.string().optional(),
      hoursEstimated: z.string().optional(),
      startDate: z.string().optional(),
      deadline: z.string().optional(),
    }))
    .mutation(async ({ input }) => { const { id, ...data } = input; await updateProject(id, data as any); return { success: true }; }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteProject(input.id);
      await writeAudit({ userId: ctx.user.id, action: "project.deleted", entityId: input.id, ipAddress: getClientIp(ctx.req) });
      return { success: true };
    }),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────
const tasksRouter = router({
  list: protectedProcedure.query(() => getAllTasks()),

  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getTasksByProject(input.projectId)),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      projectId: z.number().optional().nullable(),
      description: z.string().optional(),
      status: z.enum(["todo","doing","review","done"]).default("todo"),
      priority: z.enum(["baixa","media","alta","urgente"]).default("media"),
      assignee: z.string().optional(),
      deadline: z.string().optional(),
    }))
    .mutation(async ({ input }) => { const id = await createTask(input as any); return { id }; }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      projectId: z.number().optional().nullable(),
      description: z.string().optional(),
      status: z.enum(["todo","doing","review","done"]).optional(),
      priority: z.enum(["baixa","media","alta","urgente"]).optional(),
      assignee: z.string().optional(),
      deadline: z.string().optional(),
    }))
    .mutation(async ({ input }) => { const { id, ...data } = input; await updateTask(id, data as any); return { success: true }; }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await deleteTask(input.id); return { success: true }; }),
});

// ─── Time ─────────────────────────────────────────────────────────────────────
const timeRouter = router({
  list: protectedProcedure.query(() => getAllTimeEntries()),

  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getTimeEntriesByProject(input.projectId)),

  create: protectedProcedure
    .input(z.object({
      projectId: z.number().optional().nullable(),
      date: z.string(),
      hours: z.string().regex(/^\d+(\.\d{1,2})?$/),
      description: z.string().optional(),
      billable: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => { const id = await createTimeEntry({ ...input, userId: ctx.user.id }); return { id }; }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await deleteTimeEntry(input.id); return { success: true }; }),
});

// ─── Proposals ────────────────────────────────────────────────────────────────
const proposalsRouter = router({
  list: protectedProcedure.query(() => getAllProposals()),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => { const p = await getProposalById(input.id); if (!p) throw new TRPCError({ code: "NOT_FOUND" }); return p; }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      clientId: z.number().optional().nullable(),
      projectId: z.number().optional().nullable(),
      items: z.string().default("[]"),
      subtotal: z.string().default("0"),
      discount: z.string().default("0"),
      total: z.string().default("0"),
      validityDays: z.number().default(15),
      status: z.enum(["rascunho","enviada","aprovada","recusada","vencida"]).default("rascunho"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => { const id = await createProposal(input as any); return { id }; }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      clientId: z.number().optional().nullable(),
      projectId: z.number().optional().nullable(),
      items: z.string().optional(),
      subtotal: z.string().optional(),
      discount: z.string().optional(),
      total: z.string().optional(),
      validityDays: z.number().optional(),
      status: z.enum(["rascunho","enviada","aprovada","recusada","vencida"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      if (data.status === "enviada") (data as any).sentAt = new Date();
      if (data.status === "aprovada" || data.status === "recusada") (data as any).respondedAt = new Date();
      await updateProposal(id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await deleteProposal(input.id); return { success: true }; }),
});

// ─── Invoices ─────────────────────────────────────────────────────────────────
const invoicesRouter = router({
  list: protectedProcedure.query(() => getAllInvoices()),

  create: protectedProcedure
    .input(z.object({
      description: z.string().min(1),
      value: z.string().regex(/^\d+(\.\d{1,2})?$/),
      clientId: z.number().optional().nullable(),
      projectId: z.number().optional().nullable(),
      proposalId: z.number().optional().nullable(),
      status: z.enum(["pendente","recebido","vencido","cancelado"]).default("pendente"),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => { const id = await createInvoice(input as any); return { id }; }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      description: z.string().optional(),
      value: z.string().optional(),
      status: z.enum(["pendente","recebido","vencido","cancelado"]).optional(),
      dueDate: z.string().optional(),
      paidAt: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => { const { id, ...data } = input; await updateInvoice(id, data as any); return { success: true }; }),

  markPaid: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const today = new Date().toISOString().split("T")[0];
      await updateInvoice(input.id, { status: "recebido", paidAt: today } as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await deleteInvoice(input.id); return { success: true }; }),
});

// ─── Expenses ─────────────────────────────────────────────────────────────────
const expensesRouter = router({
  list: protectedProcedure.query(() => getAllExpenses()),

  create: protectedProcedure
    .input(z.object({
      description: z.string().min(1),
      category: z.string().min(1),
      value: z.string().regex(/^\d+(\.\d{1,2})?$/),
      date: z.string(),
      projectId: z.number().optional().nullable(),
      paid: z.boolean().default(true),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => { const id = await createExpense(input as any); return { id }; }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await deleteExpense(input.id); return { success: true }; }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  auth:      authRouter,
  dashboard: dashboardRouter,
  clients:   clientsRouter,
  pipeline:  pipelineRouter,
  projects:  projectsRouter,
  tasks:     tasksRouter,
  time:      timeRouter,
  proposals: proposalsRouter,
  invoices:  invoicesRouter,
  expenses:  expensesRouter,
});

export type AppRouter = typeof appRouter;
