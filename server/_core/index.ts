import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers.js";
import { getSessionFromRequest } from "./auth.js";
import { getUserById, findSession } from "../auth-db.js";
import { hashToken, extractToken } from "./auth.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function start() {
  console.log("═══════════════════════════════════════");
  console.log("✨ LARF Projetos — Iniciando...");
  console.log("═══════════════════════════════════════");
  console.log("[ENV] NODE_ENV:", process.env.NODE_ENV);
  console.log("[ENV] DATABASE_URL:", process.env.DATABASE_URL ? "✓ Configurado" : "✗ NÃO CONFIGURADO");
  console.log("[ENV] JWT_SECRET:", process.env.JWT_SECRET ? `✓ Configurado (${process.env.JWT_SECRET.length} chars)` : "✗ NÃO CONFIGURADO");
  console.log("[ENV] RESEND_API_KEY:", process.env.RESEND_API_KEY ? "✓ Configurado" : "(opcional)");
  console.log("═══════════════════════════════════════\n");

  if (!process.env.JWT_SECRET) {
    console.error("❌ FATAL: JWT_SECRET não está definido!");
    process.exit(1);
  }

  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // tRPC
  app.use("/api/trpc", createExpressMiddleware({
    router: appRouter,
    createContext: async ({ req, res }) => {
      let user = null;
      let sessionId: number | null = null;
      try {
        const cookies = (req as any).cookies;
        console.log("[Context] Cookies recebidos:", Object.keys(cookies || {}));
        
        const token = extractToken(req as any);
        if (token) {
          console.log("[Context] Token encontrado, length:", token.length, "start:", token.slice(0, 20) + "...");
          const payload = await getSessionFromRequest(req as any);
          if (payload) {
            console.log("[Context] Payload válido para userId:", payload.userId, "sessionId:", payload.sessionId);
            // Validate session still exists and not revoked
            const tokenHash = hashToken(token);
            const session = await findSession(tokenHash);
            if (session) {
              console.log("[Context] Sessão encontrada #", session.id);
              user = await getUserById(payload.userId);
              sessionId = session.id;
              console.log("[Context] Usuário carregado:", user?.email, "status:", user?.status);
              // Suspended users get null
              if (user?.status === "suspended") {
                console.log("[Context] Usuário suspenso");
                user = null;
              }
            } else {
              console.log("[Context] Sessão NÃO encontrada para hash", tokenHash.slice(0, 8) + "...");
            }
          } else {
            console.log("[Context] Token inválido ou expirado");
          }
        } else {
          console.log("[Context] Sem token nos cookies ou headers");
        }
      } catch (e) {
        console.error("[Context]", e);
      }
      return { req, res, user, sessionId };
    },
  }));

  // Static frontend
  const distPath = path.resolve(__dirname, "public");
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(distPath));
    app.get("*", (_, res) => res.sendFile(path.join(distPath, "index.html")));
  } else {
    const { createServer: createVite } = await import("vite");
    const vite = await createVite({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  const port = parseInt(process.env.PORT || "3000");
  createServer(app).listen(port, () => {
    console.log(`✅  LARF Projetos — http://localhost:${port}`);
  });
}

start().catch(console.error);
