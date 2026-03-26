import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../server/routers";

export const trpc = createTRPCReact<AppRouter>();

export function getTrpcClient() {
  return trpc.createClient({
    links: [
      httpLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch: async (url, options) => {
          return fetch(url, {
            ...options,
            credentials: "include", // Include cookies for session management
          });
        },
      }),
    ],
  });
}
