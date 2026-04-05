import { and, asc, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  users, clients, contacts, pipeline, projects, tasks,
  timeEntries, proposals, invoices, expenses, passwordResetTokens,
  type User, type Client, type InsertClient, type InsertProject,
  type Project, type Task, type InsertTask, type TimeEntry,
  type Proposal, type Invoice, type Expense, type Pipeline,
} from "../drizzle/schema.js";
import { ENV } from "./_core/env.js";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (_db) return _db;
  if (!ENV.databaseUrl) return null;
  try {
    const conn = await mysql.createConnection(ENV.databaseUrl);
    _db = drizzle(conn);
    return _db;
  } catch { return null; }
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return r[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return r[0];
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(users).orderBy(asc(users.name));
}

export async function createUser(data: { name: string; email: string; passwordHash: string; role?: "user" | "admin" | "superadmin" }): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(users).values({ ...data, email: data.email.toLowerCase() });
  return Number((r[0] as any).insertId);
}

export async function updateUserPassword(id: number, passwordHash: string): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

export async function updateUserRole(id: number, role: "user" | "admin" | "superadmin"): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function deleteUser(id: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(users).where(eq(users.id, id));
}

// ─── Password Reset Tokens ───────────────────────────────────────────────────
export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb(); if (!db) return null;
  const r = await db.select({ token: passwordResetTokens, user: users })
    .from(passwordResetTokens).innerJoin(users, eq(passwordResetTokens.userId, users.id))
    .where(eq(passwordResetTokens.token, token)).limit(1);
  return r[0] || null;
}

export async function markTokenUsed(token: string): Promise<void> {
  const db = await getDb(); if (!db) return;
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.token, token));
}

// ─── Clients ─────────────────────────────────────────────────────────────────
export async function getAllClients(): Promise<Client[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(clients).orderBy(asc(clients.name));
}

export async function getClientById(id: number): Promise<Client | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return r[0];
}

export async function createClient(data: InsertClient): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(clients).values(data);
  return Number((r[0] as any).insertId);
}

export async function updateClient(id: number, data: Partial<InsertClient>): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  if (Object.keys(clean).length === 0) return;
  await db.update(clients).set(clean).where(eq(clients.id, id));
}

export async function deleteClient(id: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(clients).where(eq(clients.id, id));
}

// ─── Contacts ────────────────────────────────────────────────────────────────
export async function getContactsByClient(clientId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(contacts).where(eq(contacts.clientId, clientId)).orderBy(asc(contacts.name));
}

export async function createContact(data: { clientId: number; name: string; role?: string; email?: string; phone?: string; notes?: string }): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(contacts).values(data as any);
  return Number((r[0] as any).insertId);
}

export async function updateContact(id: number, data: Partial<{ name: string; role: string; email: string; phone: string; notes: string }>): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(contacts).set(data as any).where(eq(contacts.id, id));
}

export async function deleteContact(id: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(contacts).where(eq(contacts.id, id));
}

// ─── Pipeline ────────────────────────────────────────────────────────────────
export async function getAllPipeline(): Promise<Pipeline[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(pipeline).orderBy(desc(pipeline.createdAt));
}

export async function createPipelineCard(data: Partial<Pipeline>): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(pipeline).values(data as any);
  return Number((r[0] as any).insertId);
}

export async function updatePipelineCard(id: number, data: Partial<Pipeline>): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  if (!Object.keys(clean).length) return;
  await db.update(pipeline).set(clean as any).where(eq(pipeline.id, id));
}

export async function deletePipelineCard(id: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(pipeline).where(eq(pipeline.id, id));
}

// ─── Projects ────────────────────────────────────────────────────────────────
export async function getAllProjects(): Promise<Project[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return r[0];
}

export async function createProject(data: InsertProject): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(projects).values(data);
  return Number((r[0] as any).insertId);
}

export async function updateProject(id: number, data: Partial<InsertProject>): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  if (!Object.keys(clean).length) return;
  await db.update(projects).set(clean as any).where(eq(projects.id, id));
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(projects).where(eq(projects.id, id));
}

// ─── Tasks ───────────────────────────────────────────────────────────────────
export async function getTasksByProject(projectId: number): Promise<Task[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(asc(tasks.sortOrder), asc(tasks.createdAt));
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tasks).orderBy(asc(tasks.sortOrder), desc(tasks.createdAt));
}

export async function getTaskById(id: number): Promise<Task | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return r[0];
}

export async function createTask(data: InsertTask): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(tasks).values(data);
  return Number((r[0] as any).insertId);
}

export async function updateTask(id: number, data: Partial<InsertTask>): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  if (!Object.keys(clean).length) return;
  await db.update(tasks).set(clean as any).where(eq(tasks.id, id));
}

export async function deleteTask(id: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ─── Time Entries ────────────────────────────────────────────────────────────
export async function getAllTimeEntries(): Promise<TimeEntry[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(timeEntries).orderBy(desc(timeEntries.date), desc(timeEntries.createdAt));
}

export async function getTimeEntriesByProject(projectId: number): Promise<TimeEntry[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(timeEntries).where(eq(timeEntries.projectId, projectId)).orderBy(desc(timeEntries.date));
}

export async function createTimeEntry(data: { projectId?: number | null; userId?: number | null; date: string; hours: string; description?: string; billable?: boolean }): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(timeEntries).values(data as any);
  return Number((r[0] as any).insertId);
}

export async function deleteTimeEntry(id: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(timeEntries).where(eq(timeEntries.id, id));
}

// ─── Proposals ───────────────────────────────────────────────────────────────
export async function getAllProposals(): Promise<Proposal[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(proposals).orderBy(desc(proposals.createdAt));
}

export async function getProposalById(id: number): Promise<Proposal | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  return r[0];
}

export async function createProposal(data: Partial<Proposal>): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(proposals).values(data as any);
  return Number((r[0] as any).insertId);
}

export async function updateProposal(id: number, data: Partial<Proposal>): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  if (!Object.keys(clean).length) return;
  await db.update(proposals).set(clean as any).where(eq(proposals.id, id));
}

export async function deleteProposal(id: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(proposals).where(eq(proposals.id, id));
}

// ─── Invoices ────────────────────────────────────────────────────────────────
export async function getAllInvoices(): Promise<Invoice[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function createInvoice(data: Partial<Invoice>): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(invoices).values(data as any);
  return Number((r[0] as any).insertId);
}

export async function updateInvoice(id: number, data: Partial<Invoice>): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  if (!Object.keys(clean).length) return;
  await db.update(invoices).set(clean as any).where(eq(invoices.id, id));
}

export async function deleteInvoice(id: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(invoices).where(eq(invoices.id, id));
}

// ─── Expenses ────────────────────────────────────────────────────────────────
export async function getAllExpenses(): Promise<Expense[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(expenses).orderBy(desc(expenses.date), desc(expenses.createdAt));
}

export async function createExpense(data: Partial<Expense>): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(expenses).values(data as any);
  return Number((r[0] as any).insertId);
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(expenses).where(eq(expenses.id, id));
}

// ─── Dashboard aggregates ─────────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  const [
    allClients, allProjects, allInvoices, allExpenses, allTasks, allTime, allPipeline
  ] = await Promise.all([
    getAllClients(), getAllProjects(), getAllInvoices(),
    getAllExpenses(), getAllTasks(), getAllTimeEntries(), getAllPipeline(),
  ]);

  const recebido = allInvoices.filter(i => i.status === "recebido").reduce((s, i) => s + Number(i.value), 0);
  const pendente = allInvoices.filter(i => i.status === "pendente").reduce((s, i) => s + Number(i.value), 0);
  const despesas = allExpenses.filter(e => e.paid).reduce((s, e) => s + Number(e.value), 0);
  const horas = allTime.reduce((s, e) => s + Number(e.hours), 0);
  const pipelineTotal = allPipeline.filter(p => !["ganho","perdido"].includes(p.stage)).reduce((s, p) => s + Number(p.value || 0), 0);

  return {
    clients: { total: allClients.length, active: allClients.filter(c => c.status === "ativo").length },
    projects: { total: allProjects.length, active: allProjects.filter(p => p.status === "em_andamento").length },
    tasks: { total: allTasks.length, pending: allTasks.filter(t => t.status !== "done").length },
    financial: { recebido, pendente, despesas, liquido: recebido - despesas, pipelineTotal },
    horas,
    recentProjects: allProjects.filter(p => p.status === "em_andamento").slice(0, 5),
    recentInvoices: allInvoices.filter(i => i.status === "pendente").slice(0, 5),
    recentTasks: allTasks.filter(t => t.status !== "done").slice(0, 6),
  };
}
