import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/AdminSidebar";
import AdminDashboard from "@/components/AdminDashboard";
import ProgramsManagement from "@/components/ProgramsManagement";
import CategoriesManagement from "@/components/CategoriesManagement";
import DocumentsManagement from "@/components/DocumentsManagement";
import ProjectsManagement from "@/components/ProjectsManagement";
import UsersManagement from "@/components/UsersManagement";
import NotificationsManagement from "@/components/NotificationsManagement";
import ActivityDashboard from "@/components/ActivityDashboard";
import ImportantDocumentsTable from "@/components/ImportantDocumentsTable";
import AccountsTable from "@/components/AccountsTable";
import KnowledgeBasePage from "@/pages/admin/knowledge-base";
import TrainingFilesPage from "@/pages/admin/training-files";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Home, Menu } from "lucide-react";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      case "important-documents":
        return <ImportantDocumentsTable />;
      case "projects":
        return <ProjectsManagement />;
      case "users":
        return <UsersManagement />;
      case "notifications":
        return <NotificationsManagement />;
      case "activities":
        return <ActivityDashboard />;
      case "accounts":
        return <AccountsTable />;
      case "knowledge-base":
        return <KnowledgeBasePage />;
      case "training-files":
        return <TrainingFilesPage />;
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
        return "Quản lý khóa học";
      case "documents":
        return "Quản lý tài liệu";
      case "important-documents":
        return "Tài liệu quan trọng";
      case "projects":
        return "Quản lý dự án";
      case "users":
        return "Quản lý người dùng";
      case "notifications":
        return "Quản lý thông báo";
      case "activities":
        return "Hoạt động người dùng";
      case "accounts":
        return "Danh sách tài khoản";
      case "knowledge-base":
        return "Cơ sở kiến thức AI";
      case "training-files":
        return "File Training AI";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex">
          <AdminSidebar 
            activeView={activeView} 
            onViewChange={setActiveView}
            user={user}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-b border-blue-700 shadow-lg flex-shrink-0">
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                {/* Mobile Menu Button */}
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="lg:hidden text-blue-100 hover:text-white hover:bg-blue-800">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <AdminSidebar 
                      activeView={activeView} 
                      onViewChange={setActiveView}
                      user={user}
                      isMobile
                      onMobileClose={() => setSidebarOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
                <h2 className="text-lg sm:text-xl font-semibold text-white">{getTitle()}</h2>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link href="/">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 border-blue-200 text-white hover:bg-blue-800" data-testid="link-home">
                    <Home className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Trang chủ</span>
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
