import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import { ENV } from "./env.js";
import type { Request } from "express";

// ─── Constants ────────────────────────────────────────────────────────────────
export const COOKIE_NAME    = "larf_session";
export const TOKEN_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8h
export const TOKEN_VERSION  = 1; // bump to invalidate all tokens

// ─── Secret ───────────────────────────────────────────────────────────────────
function getSecret(): Uint8Array {
  const s = ENV.jwtSecret;
  if (!s || s.length < 32) throw new Error("JWT_SECRET precisa ter no mínimo 32 caracteres.");
  return new TextEncoder().encode(s);
}

// ─── JWT ──────────────────────────────────────────────────────────────────────
export interface TokenPayload {
  userId:    number;
  role:      string;
  sessionId: number;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload, v: TOKEN_VERSION })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + TOKEN_EXPIRY_MS) / 1000))
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    const p = payload as any;
    if (!p.userId || !p.role || !p.sessionId || p.v !== TOKEN_VERSION) return null;
    return { userId: Number(p.userId), role: String(p.role), sessionId: Number(p.sessionId) };
  } catch {
    return null;
  }
}

// ─── Token hash — nunca armazenamos o JWT raw no banco ───────────────────────
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ─── Extract token from request ───────────────────────────────────────────────
export function extractToken(req: Request): string | null {
  const fromCookie = req.cookies?.[COOKIE_NAME];
  if (fromCookie && typeof fromCookie === "string") return fromCookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
}

export async function getSessionFromRequest(req: Request): Promise<TokenPayload | null> {
  const token = extractToken(req);
  if (!token) return null;
  return verifyToken(token);
}

// ─── Cookie options ───────────────────────────────────────────────────────────
export function cookieOptions(req: Request) {
  const secure =
    req.protocol === "https" ||
    req.headers["x-forwarded-proto"] === "https" ||
    ENV.isProduction;
  return {
    httpOnly: true,         // inacessível via JS
    path: "/",
    sameSite: "strict" as const, // sem cross-site
    secure,
    maxAge: TOKEN_EXPIRY_MS,
  };
}

// ─── Client IP ────────────────────────────────────────────────────────────────
export function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"] as string | undefined;
  return fwd?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? "unknown";
}

// ─── Password strength validation ────────────────────────────────────────────
export interface PasswordCheck {
  valid:  boolean;
  score:  number;   // 0–4
  errors: string[];
}

// Senhas comuns/previsíveis
const COMMON_PASSWORDS = [
  "12345678","123456789","password","senha1234","admin123",
  "larf1234","qwerty123","abc12345","iloveyou","welcome1",
];

export function validatePassword(password: string): PasswordCheck {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8)   errors.push("Mínimo 8 caracteres");
  else { score++; if (password.length >= 12) score++; }

  if (!/[A-Z]/.test(password)) errors.push("Pelo menos uma letra maiúscula (A-Z)");
  else score++;

  if (!/[a-z]/.test(password)) errors.push("Pelo menos uma letra minúscula (a-z)");
  else score++;

  if (!/[0-9]/.test(password)) errors.push("Pelo menos um número (0-9)");
  else score++;

  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Pelo menos um caractere especial (!@#$%...)");

  if (COMMON_PASSWORDS.some(c => password.toLowerCase().includes(c))) {
    errors.push("Senha muito comum ou previsível");
    score = Math.max(0, score - 2);
  }

  return { valid: errors.length === 0, score: Math.min(score, 4), errors };
}
