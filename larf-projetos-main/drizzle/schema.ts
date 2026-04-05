import {
  int, varchar, text, boolean, timestamp, decimal,
  mysqlTable, mysqlEnum
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id:                 int("id").autoincrement().primaryKey(),
  name:               text("name"),
  email:              varchar("email", { length: 320 }).unique(),
  passwordHash:       varchar("passwordHash", { length: 255 }),
  role:               mysqlEnum("role", ["viewer","member","admin","superadmin"]).default("member").notNull(),
  status:             mysqlEnum("status", ["pending","active","suspended"]).default("pending").notNull(),
  // Security counters
  failedLoginCount:   int("failedLoginCount").default(0).notNull(),
  lockedUntil:        timestamp("lockedUntil"),
  lastLoginAt:        timestamp("lastLoginAt"),
  lastLoginIp:        varchar("lastLoginIp", { length: 45 }),
  passwordChangedAt:  timestamp("passwordChangedAt"),
  // Relations
  invitedById:        int("invitedById"),
  createdAt:          timestamp("createdAt").defaultNow().notNull(),
  updatedAt:          timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Invite Tokens — única forma de criar conta ───────────────────────────────
export const inviteTokens = mysqlTable("invite_tokens", {
  id:            int("id").autoincrement().primaryKey(),
  token:         varchar("token", { length: 128 }).notNull().unique(),
  email:         varchar("email", { length: 320 }).notNull(),
  role:          mysqlEnum("role", ["viewer","member","admin"]).default("member").notNull(),
  invitedById:   int("invitedById").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt:     timestamp("expiresAt").notNull(),
  usedAt:        timestamp("usedAt"),
  usedByUserId:  int("usedByUserId"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});

export type InviteToken = typeof inviteTokens.$inferSelect;

// ─── Sessions (server-side — permite revogação) ───────────────────────────────
export const sessions = mysqlTable("sessions", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash:   varchar("tokenHash", { length: 128 }).notNull().unique(),
  ipAddress:   varchar("ipAddress", { length: 45 }),
  userAgent:   varchar("userAgent", { length: 512 }),
  expiresAt:   timestamp("expiresAt").notNull(),
  revokedAt:   timestamp("revokedAt"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;

// ─── Password Reset Tokens ────────────────────────────────────────────────────
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token:       varchar("token", { length: 128 }).notNull().unique(),
  expiresAt:   timestamp("expiresAt").notNull(),
  usedAt:      timestamp("usedAt"),
  ipAddress:   varchar("ipAddress", { length: 45 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

// ─── Audit Log ────────────────────────────────────────────────────────────────
export const auditLog = mysqlTable("audit_log", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").references(() => users.id, { onDelete: "set null" }),
  action:      varchar("action", { length: 100 }).notNull(),
  entity:      varchar("entity", { length: 100 }),
  entityId:    int("entityId"),
  detail:      text("detail"),
  ipAddress:   varchar("ipAddress", { length: 45 }),
  userAgent:   varchar("userAgent", { length: 512 }),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id:        int("id").autoincrement().primaryKey(),
  name:      varchar("name", { length: 255 }).notNull(),
  cnpj:      varchar("cnpj", { length: 20 }),
  email:     varchar("email", { length: 320 }),
  phone:     varchar("phone", { length: 50 }),
  address:   text("address"),
  origin:    varchar("origin", { length: 100 }),
  status:    mysqlEnum("status", ["lead","ativo","inativo"]).default("ativo").notNull(),
  notes:     text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── Contacts ─────────────────────────────────────────────────────────────────
export const contacts = mysqlTable("contacts", {
  id:        int("id").autoincrement().primaryKey(),
  clientId:  int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name:      varchar("name", { length: 255 }).notNull(),
  role:      varchar("role", { length: 100 }),
  email:     varchar("email", { length: 320 }),
  phone:     varchar("phone", { length: 50 }),
  notes:     text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;

// ─── Pipeline ─────────────────────────────────────────────────────────────────
export const pipeline = mysqlTable("pipeline", {
  id:            int("id").autoincrement().primaryKey(),
  clientName:    varchar("clientName", { length: 255 }).notNull(),
  clientId:      int("clientId").references(() => clients.id, { onDelete: "set null" }),
  value:         decimal("value", { precision: 12, scale: 2 }),
  stage:         mysqlEnum("stage", ["lead","contato","proposta","negociacao","ganho","perdido"]).default("lead").notNull(),
  probability:   int("probability").default(50),
  expectedClose: varchar("expectedClose", { length: 10 }),
  notes:         text("notes"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
  updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pipeline = typeof pipeline.$inferSelect;

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projects = mysqlTable("projects", {
  id:             int("id").autoincrement().primaryKey(),
  clientId:       int("clientId").references(() => clients.id, { onDelete: "set null" }),
  title:          varchar("title", { length: 255 }).notNull(),
  description:    text("description"),
  status:         mysqlEnum("status", ["em_andamento","pausado","concluido","cancelado"]).default("em_andamento").notNull(),
  value:          decimal("value", { precision: 12, scale: 2 }).default("0"),
  hoursEstimated: decimal("hoursEstimated", { precision: 8, scale: 2 }),
  startDate:      varchar("startDate", { length: 10 }),
  deadline:       varchar("deadline", { length: 10 }),
  createdAt:      timestamp("createdAt").defaultNow().notNull(),
  updatedAt:      timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id:          int("id").autoincrement().primaryKey(),
  projectId:   int("projectId").references(() => projects.id, { onDelete: "cascade" }),
  title:       varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status:      mysqlEnum("status", ["todo","doing","review","done"]).default("todo").notNull(),
  priority:    mysqlEnum("priority", ["baixa","media","alta","urgente"]).default("media").notNull(),
  assignee:    varchar("assignee", { length: 100 }),
  deadline:    varchar("deadline", { length: 10 }),
  sortOrder:   int("sortOrder").default(0).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── Time Entries ─────────────────────────────────────────────────────────────
export const timeEntries = mysqlTable("time_entries", {
  id:          int("id").autoincrement().primaryKey(),
  projectId:   int("projectId").references(() => projects.id, { onDelete: "cascade" }),
  userId:      int("userId").references(() => users.id, { onDelete: "set null" }),
  date:        varchar("date", { length: 10 }).notNull(),
  hours:       decimal("hours", { precision: 6, scale: 2 }).notNull(),
  description: text("description"),
  billable:    boolean("billable").default(true).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type TimeEntry = typeof timeEntries.$inferSelect;

// ─── Proposals ────────────────────────────────────────────────────────────────
export const proposals = mysqlTable("proposals", {
  id:           int("id").autoincrement().primaryKey(),
  clientId:     int("clientId").references(() => clients.id, { onDelete: "set null" }),
  projectId:    int("projectId").references(() => projects.id, { onDelete: "set null" }),
  title:        varchar("title", { length: 255 }).notNull(),
  items:        text("items").notNull().default("[]"),
  subtotal:     decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  discount:     decimal("discount", { precision: 12, scale: 2 }).default("0"),
  total:        decimal("total", { precision: 12, scale: 2 }).default("0"),
  validityDays: int("validityDays").default(15),
  status:       mysqlEnum("status", ["rascunho","enviada","aprovada","recusada","vencida"]).default("rascunho").notNull(),
  notes:        text("notes"),
  sentAt:       timestamp("sentAt"),
  respondedAt:  timestamp("respondedAt"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Proposal = typeof proposals.$inferSelect;

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id:          int("id").autoincrement().primaryKey(),
  clientId:    int("clientId").references(() => clients.id, { onDelete: "set null" }),
  projectId:   int("projectId").references(() => projects.id, { onDelete: "set null" }),
  proposalId:  int("proposalId").references(() => proposals.id, { onDelete: "set null" }),
  description: varchar("description", { length: 255 }).notNull(),
  value:       decimal("value", { precision: 12, scale: 2 }).notNull(),
  status:      mysqlEnum("status", ["pendente","recebido","vencido","cancelado"]).default("pendente").notNull(),
  dueDate:     varchar("dueDate", { length: 10 }),
  paidAt:      varchar("paidAt", { length: 10 }),
  notes:       text("notes"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = mysqlTable("expenses", {
  id:          int("id").autoincrement().primaryKey(),
  projectId:   int("projectId").references(() => projects.id, { onDelete: "set null" }),
  description: varchar("description", { length: 255 }).notNull(),
  category:    varchar("category", { length: 100 }).notNull(),
  value:       decimal("value", { precision: 12, scale: 2 }).notNull(),
  date:        varchar("date", { length: 10 }).notNull(),
  paid:        boolean("paid").default(true).notNull(),
  receipt:     text("receipt"),
  notes:       text("notes"),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
