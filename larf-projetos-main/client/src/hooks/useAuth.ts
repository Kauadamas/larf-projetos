import { trpc } from "../lib/trpc";
import { useLocation } from "wouter";

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
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
