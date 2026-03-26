import { trpc } from "../lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function useAuth() {
  const { data: user, isLoading, isFetching } = trpc.auth.me.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  useEffect(() => {
    console.log("[useAuth] User data updated:", user, "isLoading:", isLoading, "isFetching:", isFetching);
  }, [user, isLoading, isFetching]);

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      console.log("[useAuth] Logout bem-sucedido");
      utils.auth.me.invalidate();
      navigate("/login");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin:         user?.role === "admin" || user?.role === "superadmin",
    isSuperAdmin:    user?.role === "superadmin",
    logout:          () => logout.mutate(),
  };
}
