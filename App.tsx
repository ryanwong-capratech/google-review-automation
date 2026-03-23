import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Accounts from "./pages/Accounts";
import Businesses from "./pages/Businesses";
import CreateTasks from "./pages/CreateTasks";
import Tasks from "./pages/Tasks";
import Logs from "./pages/Logs";
import Schedule from "./pages/Schedule";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/businesses" component={Businesses} />
        <Route path="/create-tasks" component={CreateTasks} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/logs" component={Logs} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
