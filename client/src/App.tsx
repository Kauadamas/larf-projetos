import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import AcceptInvite from "./pages/AcceptInvite";
import Dashboard from "./pages/admin/Dashboard";
import Clients from "./pages/admin/Clients";
import Pipeline from "./pages/admin/Pipeline";
import Projects from "./pages/admin/Projects";
import Tasks from "./pages/admin/Tasks";
import Time from "./pages/admin/Time";
import Proposals from "./pages/admin/Proposals";
import Invoices from "./pages/admin/Invoices";
import Expenses from "./pages/admin/Expenses";
import Reports from "./pages/admin/Reports";
import Users from "./pages/admin/Users";

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
    </div>
  );
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Switch>
      <Route path="/login"           component={Login} />
      <Route path="/aceitar-convite" component={AcceptInvite} />
      <Route path="/admin">
        <Protected><Dashboard /></Protected>
      </Route>
      <Route path="/admin/clients">
        <Protected><Clients /></Protected>
      </Route>
      <Route path="/admin/pipeline">
        <Protected><Pipeline /></Protected>
      </Route>
      <Route path="/admin/projects">
        <Protected><Projects /></Protected>
      </Route>
      <Route path="/admin/tasks">
        <Protected><Tasks /></Protected>
      </Route>
      <Route path="/admin/time">
        <Protected><Time /></Protected>
      </Route>
      <Route path="/admin/proposals">
        <Protected><Proposals /></Protected>
      </Route>
      <Route path="/admin/invoices">
        <Protected><Invoices /></Protected>
      </Route>
      <Route path="/admin/expenses">
        <Protected><Expenses /></Protected>
      </Route>
      <Route path="/admin/reports">
        <Protected><Reports /></Protected>
      </Route>
      <Route path="/admin/users">
        <Protected><Users /></Protected>
      </Route>
      <Route>
        <Redirect to="/admin" />
      </Route>
    </Switch>
  );
}
