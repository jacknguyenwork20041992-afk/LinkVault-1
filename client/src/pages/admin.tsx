import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/AdminSidebar";
import AdminDashboard from "@/components/AdminDashboard";
import ProgramsManagement from "@/components/ProgramsManagement";
import CategoriesManagement from "@/components/CategoriesManagement";
import DocumentsManagement from "@/components/DocumentsManagement";
import UsersManagement from "@/components/UsersManagement";
import NotificationsManagement from "@/components/NotificationsManagement";
import ActivityDashboard from "@/components/ActivityDashboard";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("dashboard");

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      toast({
        title: "Unauthorized",
        description: "You need admin access. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <AdminDashboard onNavigateToView={setActiveView} />;
      case "programs":
        return <ProgramsManagement />;
      case "categories":
        return <CategoriesManagement />;
      case "documents":
        return <DocumentsManagement />;
      case "users":
        return <UsersManagement />;
      case "notifications":
        return <NotificationsManagement />;
      case "activities":
        return <ActivityDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  const getTitle = () => {
    switch (activeView) {
      case "dashboard":
        return "Dashboard";
      case "programs":
        return "Quản lý chương trình";
      case "categories":
        return "Quản lý danh mục";
      case "documents":
        return "Quản lý tài liệu";
      case "users":
        return "Quản lý người dùng";
      case "notifications":
        return "Quản lý thông báo";
      case "activities":
        return "Hoạt động người dùng";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <AdminSidebar 
          activeView={activeView} 
          onViewChange={setActiveView}
          user={user}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <header className="bg-card border-b border-border shadow-sm">
            <div className="px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">{getTitle()}</h2>
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="outline" size="sm" data-testid="link-home">
                    <Home className="h-4 w-4 mr-2" />
                    Trang chủ
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
