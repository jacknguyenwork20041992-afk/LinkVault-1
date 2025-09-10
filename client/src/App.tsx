import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import ProgramDetails from "@/pages/program-details";
import NotificationsPage from "@/pages/notifications-page";
import SupportTicketsPage from "@/pages/support-tickets-page";
import AccountDeactivatedPage from "@/pages/account-deactivated";
import PublicChat from "@/pages/PublicChat";
import LoadingScreen from "@/components/LoadingScreen";

function Router() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;

  if (isLoading) {
    return <LoadingScreen message="Đang xác thực người dùng..." />;
  }

  return (
    <Switch>
      <Route path="/ai-chat" component={PublicChat} />
      {!isAuthenticated ? (
        <>
          <Route path="/" component={AuthPage} />
          <Route path="/auth" component={AuthPage} />
        </>
      ) : user?.isActive === false ? (
        // If user is authenticated but deactivated, show only the deactivated page
        <>
          <Route path="/" component={AccountDeactivatedPage} />
          <Route path="/account-deactivated" component={AccountDeactivatedPage} />
          <Route component={AccountDeactivatedPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/program/:id" component={ProgramDetails} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/support-tickets" component={SupportTicketsPage} />
          {user?.role === "admin" && <Route path="/admin" component={Admin} />}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
