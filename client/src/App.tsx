import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DashboardBroker from "./pages/DashboardBroker";
import DashboardFinance from "./pages/DashboardFinance";
import DashboardManager from "./pages/DashboardManager";
import NewProposal from "./pages/NewProposal";
import ProposalManagement from "./pages/ProposalManagement";
import ProposalDetail from "./pages/ProposalDetail";
import Reports from "./pages/Reports";
import Indicators from "./pages/Indicators";
import Ranking from "./pages/Ranking";
import SalesApproval from "./pages/SalesApproval";
import DocumentUpload from "./pages/DocumentUpload";
import GoalsManagement from "./pages/GoalsManagement";
import CompanyManagement from "./pages/CompanyManagement";
import Analytics from "./pages/Analytics";

import BrokerManagement from "./pages/BrokerManagement";
import DashboardSuperAdmin from "./pages/DashboardSuperAdmin";
import UserManagement from "./pages/UserManagement";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SuperAdminUsers from "./pages/SuperAdminUsers";
import Profile from "./pages/Profile";

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            D
          </div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Protected routes */}
      {user ? (
        <>
          {/* Common routes for all authenticated users */}
          <Route path="/profile" component={Profile} />

          {/* Super Admin routes */}
          {user.role === "superadmin" && (
            <>
              <Route path="/" component={DashboardSuperAdmin} />
              <Route path="/dashboard" component={DashboardSuperAdmin} />
              <Route path="/users" component={SuperAdminUsers} />
            </>
          )}

          {/* Role-based dashboards */}
          {user.role === "broker" && (
            <>
              <Route path="/proposals/new" component={NewProposal} />
              <Route path="/proposals/:id" component={ProposalDetail} />
              <Route path="/proposals" component={ProposalManagement} />
              <Route path="/reports" component={Reports} />
              <Route path="/indicators" component={Indicators} />
              <Route path="/ranking" component={Ranking} />
              <Route path="/document-upload" component={DocumentUpload} />
              <Route path="/dashboard">{() => <Redirect to="/" />}</Route>
              <Route path="/" component={DashboardBroker} />
            </>
          )}
          {user.role === "finance" && (
            <>
              <Route path="/proposals" component={ProposalManagement} />
              <Route path="/reports" component={Reports} />
              <Route path="/indicators" component={Indicators} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/ranking" component={Ranking} />
              <Route path="/sales-approval" component={SalesApproval} />
              <Route path="/document-upload" component={DocumentUpload} />
              <Route path="/dashboard" component={DashboardFinance} />
              <Route path="/" component={DashboardFinance} />
            </>
          )}
          {user.role === "manager" && (
            <>
              <Route path="/proposals/new" component={NewProposal} />
              <Route path="/proposals" component={ProposalManagement} />
              <Route path="/reports" component={Reports} />
              <Route path="/indicators" component={Indicators} />
              <Route path="/brokers" component={BrokerManagement} />
              <Route path="/ranking" component={Ranking} />
              <Route path="/sales-approval" component={SalesApproval} />
              <Route path="/document-upload" component={DocumentUpload} />
              <Route path="/dashboard" component={DashboardManager} />
              <Route path="/" component={DashboardManager} />
            </>
          )}
          {user.role === "admin" && (
            <>
              <Route path="/companies" component={CompanyManagement} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/" component={Dashboard} />
            </>
          )}
          {user.role === "viewer" && (
            <>
              <Route path="/proposals/:id" component={ProposalDetail} />
              <Route path="/proposals" component={ProposalManagement} />
              <Route path="/reports" component={Reports} />
              <Route path="/indicators" component={Indicators} />
              <Route path="/ranking" component={Ranking} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/dashboard" component={Reports} />
              <Route path="/" component={Reports} />
            </>
          )}
        </>
      ) : (
        <Route path="/" component={Login} />
      )}

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

