import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Request, Response } from "express";
import type { User } from "../../drizzle/schema.js";

export type Context = {
  req:     Request;
  res:     Response;
  user:    User | null;
  sessionId: number | null;
};

// User-friendly error messages
const USER_MSGS: Record<string, string> = {
  UNAUTHORIZED:          "Você precisa estar autenticado.",
  FORBIDDEN:             "Você não tem permissão para isso.",
  NOT_FOUND:             "Registro não encontrado.",
  CONFLICT:              "Este registro já existe.",
  BAD_REQUEST:           "Dados inválidos. Verifique as informações.",
  TOO_MANY_REQUESTS:     "Muitas tentativas. Aguarde um momento.",
  INTERNAL_SERVER_ERROR: "Erro interno. Tente novamente em instantes.",
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const isInternal = error.code === "INTERNAL_SERVER_ERROR";
    if (isInternal) console.error("[tRPC ERROR]", error.message, error.cause ?? "");
    return {
      ...shape,
      message: isInternal ? USER_MSGS.INTERNAL_SERVER_ERROR : (error.message || USER_MSGS[error.code] || error.message),
      data: { ...shape.data, stack: undefined },
    };
  },
});

export const router           = t.router;
export const publicProcedure  = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.status !== "active") throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.status !== "active") throw new TRPCError({ code: "UNAUTHORIZED" });
  if (ctx.user.role !== "admin" && ctx.user.role !== "superadmin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const superadminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.status !== "active") throw new TRPCError({ code: "UNAUTHORIZED" });
  if (ctx.user.role !== "superadmin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
