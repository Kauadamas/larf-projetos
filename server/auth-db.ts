import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  users, inviteTokens, sessions, auditLog, passwordResetTokens,
  type User, type InviteToken, type Session,
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

// ─── Users ────────────────────────────────────────────────────────────────────
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
  return r[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return r[0];
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(users);
}

export async function createUserFromInvite(data: {
  name: string; email: string; passwordHash: string;
  role: "viewer" | "member" | "admin"; invitedById: number;
}): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  const r = await db.insert(users).values({
    ...data,
    email: data.email.toLowerCase().trim(),
    status: "active",
    passwordChangedAt: new Date(),
  } as any);
  return Number((r[0] as any).insertId);
}

export async function updateUserRole(userId: number, role: "viewer" | "member" | "admin" | "superadmin"): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ role } as any).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ passwordHash, passwordChangedAt: new Date() } as any).where(eq(users.id, userId));
}

export async function suspendUser(userId: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ status: "suspended" } as any).where(eq(users.id, userId));
  await revokeAllUserSessions(userId);
}

export async function deleteUser(userId: number): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  await db.delete(users).where(eq(users.id, userId));
}

export async function incrementFailedLogin(userId: number): Promise<void> {
  const db = await getDb(); if (!db) return;
  const user = await getUserById(userId);
  const count = (user?.failedLoginCount ?? 0) + 1;
  const updates: any = { failedLoginCount: count };
  if (count >= 5) updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  await db.update(users).set(updates).where(eq(users.id, userId));
}

export async function resetFailedLogin(userId: number, ip: string): Promise<void> {
  const db = await getDb(); if (!db) return;
  await db.update(users).set({
    failedLoginCount: 0, lockedUntil: null,
    lastLoginAt: new Date(), lastLoginIp: ip,
  } as any).where(eq(users.id, userId));
}

// ─── Invite tokens ────────────────────────────────────────────────────────────
export async function createInviteToken(data: {
  token: string; email: string; role: "viewer" | "member" | "admin";
  invitedById: number; expiresAt: Date;
}): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  // Revogar convites anteriores não usados para o mesmo e-mail
  await db.update(inviteTokens).set({ usedAt: new Date() } as any).where(
    and(eq(inviteTokens.email, data.email.toLowerCase()), isNull(inviteTokens.usedAt))
  );
  const r = await db.insert(inviteTokens).values({ ...data, email: data.email.toLowerCase() });
  return Number((r[0] as any).insertId);
}

export async function findInviteToken(token: string): Promise<InviteToken | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(inviteTokens).where(eq(inviteTokens.token, token)).limit(1);
  return r[0];
}

export async function consumeInviteToken(tokenId: number, userId: number): Promise<void> {
  const db = await getDb(); if (!db) return;
  await db.update(inviteTokens).set({ usedAt: new Date(), usedByUserId: userId } as any).where(eq(inviteTokens.id, tokenId));
}

export async function listInviteTokens(): Promise<InviteToken[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(inviteTokens);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export async function createSession(data: {
  userId: number; tokenHash: string;
  ipAddress?: string; userAgent?: string; expiresAt: Date;
}): Promise<number> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  
  // Validate tokenHash is properly generated (SHA256 hex = 64 chars)
  if (!data.tokenHash || data.tokenHash.length !== 64 || data.tokenHash === 'pending') {
    throw new Error(`Invalid tokenHash: ${data.tokenHash}. Token must be a valid 64-char SHA256 hex string.`);
  }
  
  const r = await db.insert(sessions).values(data as any);
  return Number((r[0] as any).insertId);
}

export async function findSession(tokenHash: string): Promise<Session | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(sessions).where(
    and(
      eq(sessions.tokenHash, tokenHash),
      isNull(sessions.revokedAt),
      gt(sessions.expiresAt, new Date())
    )
  ).limit(1);
  return r[0];
}

export async function revokeSession(sessionId: number): Promise<void> {
  const db = await getDb(); if (!db) return;
  await db.update(sessions).set({ revokedAt: new Date() } as any).where(eq(sessions.id, sessionId));
}

export async function revokeAllUserSessions(userId: number): Promise<void> {
  const db = await getDb(); if (!db) return;
  await db.update(sessions).set({ revokedAt: new Date() } as any).where(
    and(eq(sessions.userId, userId), isNull(sessions.revokedAt))
  );
}

export async function listUserActiveSessions(userId: number): Promise<Session[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(sessions).where(
    and(
      eq(sessions.userId, userId),
      isNull(sessions.revokedAt),
      gt(sessions.expiresAt, new Date())
    )
  );
}

// ─── Password reset tokens ────────────────────────────────────────────────────
export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date, ip?: string): Promise<void> {
  const db = await getDb(); if (!db) throw new Error("DB unavailable");
  // Invalidar tokens anteriores
  await db.update(passwordResetTokens).set({ usedAt: new Date() } as any).where(
    and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt))
  );
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt, ipAddress: ip } as any);
}

export async function findPasswordResetToken(token: string) {
  const db = await getDb(); if (!db) return null;
  const r = await db.select({ prt: passwordResetTokens, user: users })
    .from(passwordResetTokens)
    .innerJoin(users, eq(passwordResetTokens.userId, users.id))
    .where(eq(passwordResetTokens.token, token))
    .limit(1);
  return r[0] || null;
}

export async function consumePasswordResetToken(token: string): Promise<void> {
  const db = await getDb(); if (!db) return;
  await db.update(passwordResetTokens).set({ usedAt: new Date() } as any).where(eq(passwordResetTokens.token, token));
}

// ─── Audit log ────────────────────────────────────────────────────────────────
export async function writeAudit(data: {
  userId?: number | null; action: string;
  entity?: string; entityId?: number;
  detail?: string; ipAddress?: string; userAgent?: string;
}): Promise<void> {
  const db = await getDb(); if (!db) return;
  try {
    await db.insert(auditLog).values(data as any);
  } catch (e) {
    console.error("[Audit] Falha ao escrever audit log:", e);
  }
}

export async function getAuditLog(limit = 100): Promise<AuditLog[]> {
  const db = await getDb(); if (!db) return [];
  return db.select().from(auditLog).orderBy(auditLog.createdAt).limit(limit);
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────
export async function cleanExpiredData(): Promise<void> {
  const db = await getDb(); if (!db) return;
  const now = new Date();
  await Promise.allSettled([
    db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, now)),
    db.delete(sessions).where(lt(sessions.expiresAt, now)),
  ]);
}
