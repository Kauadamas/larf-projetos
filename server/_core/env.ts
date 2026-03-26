export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  isProduction: process.env.NODE_ENV === "production",
};

if (!ENV.jwtSecret && ENV.isProduction) {
  throw new Error("FATAL: JWT_SECRET env var é obrigatório em produção.");
}
if (!ENV.databaseUrl) {
  console.warn("[ENV] DATABASE_URL não configurado — banco indisponível.");
}
