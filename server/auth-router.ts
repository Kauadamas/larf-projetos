import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  router, publicProcedure, protectedProcedure, adminProcedure
} from "./_core/trpc.js";
import {
  signToken, hashToken, cookieOptions, COOKIE_NAME, TOKEN_EXPIRY_MS,
  validatePassword, getClientIp,
} from "./_core/auth.js";
import {
  getUserByEmail, getUserById, getAllUsers,
  createUserFromInvite, updateUserRole, updateUserPassword,
  suspendUser, deleteUser,
  incrementFailedLogin, resetFailedLogin,
  createInviteToken, findInviteToken, consumeInviteToken, listInviteTokens,
  createSession, revokeSession, revokeAllUserSessions, listUserActiveSessions,
  createPasswordResetToken, findPasswordResetToken, consumePasswordResetToken,
  writeAudit, getAuditLog, cleanExpiredData,
} from "./auth-db.js";

// ─── Rate limiter (in-memory) ─────────────────────────────────────────────────
const rateStore = new Map<string, { count: number; reset: number }>();
function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const e = rateStore.get(key);
  if (!e || now > e.reset) { rateStore.set(key, { count: 1, reset: now + windowMs }); return true; }
  if (e.count >= max) return false;
  e.count++;
  return true;
}
// Limpeza periódica
setInterval(() => { const now = Date.now(); rateStore.forEach((v, k) => { if (now > v.reset) rateStore.delete(k); }); }, 5 * 60 * 1000);

// Limpeza de tokens expirados a cada hora
setInterval(() => cleanExpiredData().catch(() => {}), 60 * 60 * 1000);

// ─── Helper ───────────────────────────────────────────────────────────────────
function safeUser(u: any) {
  // Nunca expõe passwordHash nem contadores internos de segurança
  const { passwordHash, failedLoginCount, lockedUntil, ...safe } = u;
  return safe;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const authRouter = router({

  // ── me ───────────────────────────────────────────────────────────────────────
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return null;
    return safeUser(ctx.user);
  }),

  // ── login ────────────────────────────────────────────────────────────────────
  login: publicProcedure
    .input(z.object({
      email:    z.string().email("E-mail inválido").max(320),
      password: z.string().min(1, "Senha obrigatória").max(128),
    }))
    .mutation(async ({ input, ctx }) => {
      const ip = getClientIp(ctx.req);
      const ua = (ctx.req.headers["user-agent"] || "").slice(0, 512);

      // Rate limit por IP: 10 tentativas / 15 min
      if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
        await writeAudit({ action: "login.rate_limited", detail: input.email, ipAddress: ip });
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Muitas tentativas de login. Aguarde 15 minutos.",
        });
      }

      const user = await getUserByEmail(input.email);

      // Timing-safe: sempre roda bcrypt independente de o usuário existir
      const DUMMY_HASH = "$2b$12$GzQlTibvJgJqthefXBM5WuFHPbEPsHcWLbT4.5MIiO6wBj1UWUAF.";
      const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
      const valid = await bcrypt.compare(input.password, hashToCheck);

      // Usuário não existe ou senha errada
      if (!user || !valid) {
        if (user) await incrementFailedLogin(user.id);
        await writeAudit({ userId: user?.id, action: "login.failed", detail: input.email, ipAddress: ip, userAgent: ua });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
      }

      // Conta suspensa
      if (user.status === "suspended") {
        await writeAudit({ userId: user.id, action: "login.suspended", ipAddress: ip });
        throw new TRPCError({ code: "FORBIDDEN", message: "Conta suspensa. Entre em contato com o administrador." });
      }

      // Conta pendente (convite aceito mas status não foi ativado)
      if (user.status === "pending") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Conta pendente. Aceite o convite que foi enviado para seu e-mail." });
      }

      // Conta bloqueada por tentativas
      if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
        const mins = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
        await writeAudit({ userId: user.id, action: "login.locked", ipAddress: ip });
        throw new TRPCError({ code: "FORBIDDEN", message: `Conta temporariamente bloqueada. Tente novamente em ${mins} minuto(s).` });
      }

      // Login bem-sucedido — criar sessão server-side
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);
      const sessionId = await createSession({ userId: user.id, tokenHash: "pending", ipAddress: ip, userAgent: ua, expiresAt });
      const token     = await signToken({ userId: user.id, role: user.role, sessionId });
      const tHash     = hashToken(token);

      // Criar sessão com hash real
      const finalSessionId = await createSession({ userId: user.id, tokenHash: tHash, ipAddress: ip, userAgent: ua, expiresAt });
      const finalToken     = await signToken({ userId: user.id, role: user.role, sessionId: finalSessionId });

      await resetFailedLogin(user.id, ip);
      await writeAudit({ userId: user.id, action: "login.success", ipAddress: ip, userAgent: ua });

      ctx.res.cookie(COOKIE_NAME, finalToken, cookieOptions(ctx.req));
      return { user: safeUser(user) };
    }),

  // ── logout ───────────────────────────────────────────────────────────────────
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const ip = getClientIp(ctx.req);
    if (ctx.sessionId) {
      await revokeSession(ctx.sessionId);
      await writeAudit({ userId: ctx.user?.id, action: "logout", ipAddress: ip });
    }
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions(ctx.req), maxAge: -1 });
    return { success: true };
  }),

  // ── validateInvite — verifica token antes de mostrar o form ──────────────────
  validateInvite: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const invite = await findInviteToken(input.token);
      if (!invite)      throw new TRPCError({ code: "NOT_FOUND",   message: "Convite não encontrado ou inválido." });
      if (invite.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Este convite já foi utilizado." });
      if (new Date() > invite.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Convite expirado. Solicite um novo ao administrador." });
      return { email: invite.email, role: invite.role };
    }),

  // ── acceptInvite — cria a conta a partir do convite ──────────────────────────
  acceptInvite: publicProcedure
    .input(z.object({
      token:           z.string().min(1),
      name:            z.string().min(2, "Nome muito curto").max(100).trim(),
      password:        z.string().min(8).max(128),
      passwordConfirm: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ip = getClientIp(ctx.req);
      const ua = (ctx.req.headers["user-agent"] || "").slice(0, 512);

      // Rate limit por IP
      if (!rateLimit(`invite:${ip}`, 5, 60 * 60 * 1000)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas tentativas. Aguarde 1 hora." });
      }

      if (input.password !== input.passwordConfirm) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "As senhas não conferem." });
      }

      const strength = validatePassword(input.password);
      if (!strength.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Senha insuficiente: ${strength.errors.join("; ")}` });
      }

      const invite = await findInviteToken(input.token);
      if (!invite || invite.usedAt || new Date() > invite.expiresAt) {
        await writeAudit({ action: "invite.invalid_attempt", detail: input.token.slice(0, 8) + "...", ipAddress: ip });
        throw new TRPCError({ code: "BAD_REQUEST", message: "Convite inválido ou expirado." });
      }

      const existing = await getUserByEmail(invite.email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já possui uma conta." });

      const passwordHash = await bcrypt.hash(input.password, 12);
      const userId = await createUserFromInvite({
        name: input.name, email: invite.email,
        passwordHash, role: invite.role, invitedById: invite.invitedById,
      });

      await consumeInviteToken(invite.id, userId);
      await writeAudit({ userId, action: "account.created", detail: `convite #${invite.id}`, ipAddress: ip, userAgent: ua });

      // Auto-login após criar conta
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);
      const sessionId = await createSession({ userId, tokenHash: "pending", ipAddress: ip, userAgent: ua, expiresAt });
      const token     = await signToken({ userId, role: invite.role, sessionId });
      const tHash     = hashToken(token);
      const finalSid  = await createSession({ userId, tokenHash: tHash, ipAddress: ip, userAgent: ua, expiresAt });
      const finalTok  = await signToken({ userId, role: invite.role, sessionId: finalSid });

      ctx.res.cookie(COOKIE_NAME, finalTok, cookieOptions(ctx.req));
      const user = await getUserById(userId);
      return { user: safeUser(user!) };
    }),

  // ── requestPasswordReset ──────────────────────────────────────────────────────
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email().max(320) }))
    .mutation(async ({ input, ctx }) => {
      const ip = getClientIp(ctx.req);
      if (!rateLimit(`pwreset:${ip}`, 3, 60 * 60 * 1000)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas tentativas. Aguarde 1 hora." });
      }
      // Sempre retorna sucesso (sem enumeração de usuários)
      const user = await getUserByEmail(input.email);
      if (user && user.status === "active") {
        const token = crypto.randomBytes(48).toString("hex");
        await createPasswordResetToken(user.id, token, new Date(Date.now() + 60 * 60 * 1000), ip);
        await writeAudit({ userId: user.id, action: "password_reset.requested", ipAddress: ip });
        // TODO: enviar e-mail com Resend
        const resetUrl = `${ctx.req.headers.origin || "https://app.larf.com.br"}/redefinir-senha?token=${token}`;
        console.log(`[PasswordReset] ${user.email} → ${resetUrl}`);
      }
      return { success: true, message: "Se o e-mail existir, você receberá as instruções em breve." };
    }),

  // ── resetPassword ─────────────────────────────────────────────────────────────
  resetPassword: publicProcedure
    .input(z.object({
      token:           z.string().min(1),
      password:        z.string().min(8).max(128),
      passwordConfirm: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ip = getClientIp(ctx.req);

      if (input.password !== input.passwordConfirm) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "As senhas não conferem." });
      }
      const strength = validatePassword(input.password);
      if (!strength.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Senha insuficiente: ${strength.errors.join("; ")}` });
      }

      const record = await findPasswordResetToken(input.token);
      if (!record)             throw new TRPCError({ code: "BAD_REQUEST", message: "Link inválido ou expirado." });
      if (record.prt.usedAt)   throw new TRPCError({ code: "BAD_REQUEST", message: "Este link já foi utilizado." });
      if (new Date() > record.prt.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Link expirado. Solicite um novo." });

      const hash = await bcrypt.hash(input.password, 12);
      await updateUserPassword(record.user.id, hash);
      await consumePasswordResetToken(input.token);
      await revokeAllUserSessions(record.user.id); // invalida todas as sessões
      await writeAudit({ userId: record.user.id, action: "password_reset.completed", ipAddress: ip });
      return { success: true };
    }),

  // ── changePassword (usuário logado) ──────────────────────────────────────────
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword:     z.string().min(8).max(128),
      newConfirm:      z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ip = getClientIp(ctx.req);
      if (input.newPassword !== input.newConfirm) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "As senhas não conferem." });
      }
      const strength = validatePassword(input.newPassword);
      if (!strength.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Senha insuficiente: ${strength.errors.join("; ")}` });
      }
      const user = await getUserById(ctx.user.id);
      if (!user?.passwordHash) throw new TRPCError({ code: "BAD_REQUEST" });
      const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!ok) throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta." });

      await updateUserPassword(ctx.user.id, await bcrypt.hash(input.newPassword, 12));
      await writeAudit({ userId: ctx.user.id, action: "password.changed_self", ipAddress: ip });
      return { success: true };
    }),

  // ── sessions ──────────────────────────────────────────────────────────────────
  activeSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await listUserActiveSessions(ctx.user.id);
    return sessions.map(s => ({
      id: s.id, ipAddress: s.ipAddress,
      userAgent: s.userAgent, createdAt: s.createdAt, expiresAt: s.expiresAt,
      current: s.id === ctx.sessionId,
    }));
  }),

  revokeOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const ip = getClientIp(ctx.req);
    const all = await listUserActiveSessions(ctx.user.id);
    for (const s of all) {
      if (s.id !== ctx.sessionId) await revokeSession(s.id);
    }
    await writeAudit({ userId: ctx.user.id, action: "sessions.revoked_others", ipAddress: ip });
    return { success: true };
  }),

  // ── invite (admin) ────────────────────────────────────────────────────────────
  invite: router({

    send: adminProcedure
      .input(z.object({
        email: z.string().email("E-mail inválido").max(320),
        role:  z.enum(["viewer", "member", "admin"]).default("member"),
      }))
      .mutation(async ({ input, ctx }) => {
        const ip = getClientIp(ctx.req);
        if (!rateLimit(`sendinvite:${ctx.user.id}`, 20, 60 * 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitos convites enviados. Aguarde 1 hora." });
        }
        const existing = await getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já possui uma conta." });

        const token     = crypto.randomBytes(48).toString("hex");
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
        await createInviteToken({ token, email: input.email, role: input.role, invitedById: ctx.user.id, expiresAt });
        await writeAudit({ userId: ctx.user.id, action: "invite.sent", detail: `${input.email} (${input.role})`, ipAddress: ip });

        const inviteUrl = `${ctx.req.headers.origin || "https://app.larf.com.br"}/aceitar-convite?token=${token}`;
        console.log(`[Invite] ${input.email} → ${inviteUrl}`);
        // TODO: enviar e-mail com Resend
        return { success: true, inviteUrl };
      }),

    list: adminProcedure.query(async () => {
      const all = await listInviteTokens();
      return all.map(i => ({
        id: i.id, email: i.email, role: i.role,
        used: !!i.usedAt, expired: !i.usedAt && new Date() > i.expiresAt,
        pending: !i.usedAt && new Date() <= i.expiresAt,
        createdAt: i.createdAt, expiresAt: i.expiresAt,
      }));
    }),
  }),

  // ── users (admin) ──────────────────────────────────────────────────────────
  users: router({

    list: adminProcedure.query(async () => {
      const all = await getAllUsers();
      return all.map(safeUser);
    }),

    setRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["viewer","member","admin","superadmin"]) }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode alterar seu próprio papel." });
        await updateUserRole(input.userId, input.role);
        await writeAudit({ userId: ctx.user.id, action: "user.role_changed", entityId: input.userId, detail: input.role, ipAddress: getClientIp(ctx.req) });
        return { success: true };
      }),

    setPassword: adminProcedure
      .input(z.object({ userId: z.number(), password: z.string().min(8).max(128) }))
      .mutation(async ({ ctx, input }) => {
        const strength = validatePassword(input.password);
        if (!strength.valid) throw new TRPCError({ code: "BAD_REQUEST", message: `Senha insuficiente: ${strength.errors.join("; ")}` });
        await updateUserPassword(input.userId, await bcrypt.hash(input.password, 12));
        await revokeAllUserSessions(input.userId);
        await writeAudit({ userId: ctx.user.id, action: "user.password_reset_admin", entityId: input.userId, ipAddress: getClientIp(ctx.req) });
        return { success: true };
      }),

    suspend: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode suspender sua própria conta." });
        await suspendUser(input.userId);
        await writeAudit({ userId: ctx.user.id, action: "user.suspended", entityId: input.userId, ipAddress: getClientIp(ctx.req) });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode excluir sua própria conta." });
        await revokeAllUserSessions(input.userId);
        await deleteUser(input.userId);
        await writeAudit({ userId: ctx.user.id, action: "user.deleted", entityId: input.userId, ipAddress: getClientIp(ctx.req) });
        return { success: true };
      }),

    auditLog: adminProcedure
      .input(z.object({ limit: z.number().min(10).max(500).default(100) }))
      .query(async ({ input }) => getAuditLog(input.limit)),
  }),
});
