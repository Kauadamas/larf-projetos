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
        const token = extractToken(req as any);
        if (token) {
          const payload = await getSessionFromRequest(req as any);
          if (payload) {
            // Validate session still exists and not revoked
            const tokenHash = hashToken(token);
            const session = await findSession(tokenHash);
            if (session) {
              user = await getUserById(payload.userId);
              sessionId = session.id;
              // Suspended users get null
              if (user?.status === "suspended") user = null;
            }
          }
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
