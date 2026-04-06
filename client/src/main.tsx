import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App";
import { trpc, getTrpcClient } from "./lib/trpc";
import "./index.css";

// Apply saved theme immediately to avoid flash
const savedTheme = localStorage.getItem("larf_theme");
if (savedTheme === "light") document.documentElement.classList.add("light");

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});
const trpcClient = getTrpcClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font)" },
          }}
        />
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
);
