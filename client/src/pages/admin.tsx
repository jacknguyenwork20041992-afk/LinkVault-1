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
import SupportTicketsManagement from "@/components/SupportTicketsManagement";
import AccountRequestsManagement from "@/components/AccountRequestsManagement";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Home, Menu, Bell, Clock, User, CheckCheck } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch unread support ticket notifications for admin
  const { data: allNotifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications/unread"],
    enabled: isAuthenticated && user?.role === "admin",
    refetchInterval: 1000, // Tự động refresh mỗi 1 giây để cập nhật notifications ngay lập tức
    refetchIntervalInBackground: true,
  });

  // Lấy thông báo "Yêu cầu hỗ trợ mới" 
  const supportTicketNotifications = allNotifications.filter((item: any) => 
    item.notification?.title === "Yêu cầu hỗ trợ mới"
  );

  // Lấy thông báo "Yêu cầu tài khoản SWE mới"
  const accountRequestNotifications = allNotifications.filter((item: any) => 
    item.notification?.title === "Yêu cầu tài khoản SWE mới"
  );

  // Tổng số notifications
  const totalNotifications = supportTicketNotifications.length + accountRequestNotifications.length;

  const handleNotificationClick = async (notification: any) => {
    // Đánh dấu notification đã đọc
    try {
      await fetch(`/api/notifications/${notification.notification.id}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      // Invalidate queries để refresh notifications
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }

    // Navigate dựa trên loại notification
    if (notification.notification?.title === "Yêu cầu hỗ trợ mới") {
      setActiveView("support-tickets");
    } else if (notification.notification?.title === "Yêu cầu tài khoản SWE mới") {
      setActiveView("account-requests");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const allUnreadNotifications = [...supportTicketNotifications, ...accountRequestNotifications];
      for (const item of allUnreadNotifications) {
        await fetch(`/api/notifications/${item.notification.id}/read`, {
          method: 'PUT',
          credentials: 'include'
        });
      }
      // Invalidate queries để refresh notifications
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

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
        return <NotificationsManagement onViewChange={setActiveView} />;
      case "activities":
        return <ActivityDashboard />;
      case "accounts":
        return <AccountsTable />;
      case "knowledge-base":
        return <KnowledgeBasePage />;
      case "training-files":
        return <TrainingFilesPage />;
      case "support-tickets":
        return <SupportTicketsManagement />;
      case "account-requests":
        return <AccountRequestsManagement />;
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
      case "support-tickets":
        return "Quản lý yêu cầu hỗ trợ";
      case "account-requests":
        return "Request for Account";
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
                {/* Admin Notification Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="relative p-1.5 sm:p-2 text-blue-100 hover:text-white transition-colors"
                      data-testid="button-admin-notifications"
                    >
                      <Bell className="text-base sm:text-lg h-5 w-5 sm:h-6 sm:w-6" />
                      {totalNotifications > 0 && (
                        <span 
                          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center"
                          data-testid="text-admin-notification-count"
                        >
                          {totalNotifications}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-80 sm:w-96 max-h-96 overflow-y-auto"
                    data-testid="dropdown-admin-notifications"
                  >
                    {totalNotifications === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p>Không có thông báo mới</p>
                      </div>
                    ) : (
                      <>
                        <div className="px-4 py-2 border-b">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Thông báo mới ({totalNotifications})</h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleMarkAllAsRead}
                              className="text-xs"
                              data-testid="button-mark-all-read"
                            >
                              <CheckCheck className="h-3 w-3 mr-1" />
                              Đánh dấu đã đọc
                            </Button>
                          </div>
                        </div>
                        
                        {/* Support Ticket Notifications */}
                        {supportTicketNotifications.map((notification: any) => (
                          <DropdownMenuItem 
                            key={notification.notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className="p-4 cursor-pointer hover:bg-muted focus:bg-muted"
                            data-testid={`notification-support-${notification.notification.id}`}
                          >
                            <div className="flex items-start space-x-3 w-full">
                              <div className="bg-orange-100 p-2 rounded-full flex-shrink-0">
                                <User className="h-4 w-4 text-orange-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground truncate">
                                  {notification.notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {notification.notification.message}
                                </p>
                                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(notification.notification.createdAt).toLocaleString('vi-VN')}
                                </div>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}

                        {/* Account Request Notifications */}
                        {accountRequestNotifications.map((notification: any) => (
                          <DropdownMenuItem 
                            key={notification.notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className="p-4 cursor-pointer hover:bg-muted focus:bg-muted"
                            data-testid={`notification-account-${notification.notification.id}`}
                          >
                            <div className="flex items-start space-x-3 w-full">
                              <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground truncate">
                                  {notification.notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {notification.notification.message}
                                </p>
                                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(notification.notification.createdAt).toLocaleString('vi-VN')}
                                </div>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
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
