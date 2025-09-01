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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/20">
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
          {/* Modern Professional Header */}
          <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-50 dark:bg-gray-900/90 dark:border-gray-700/50">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                    >
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
                
                {/* Page Title Section */}
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-1 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full"></div>
                  <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                      {getTitle()}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      VIA Admin Dashboard
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 lg:space-x-4">
                {/* Modern Admin Notification Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="relative p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/30"
                      data-testid="button-admin-notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {totalNotifications > 0 && (
                        <span 
                          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-sm"
                          data-testid="text-admin-notification-count"
                        >
                          {totalNotifications}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-80 sm:w-96 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl"
                    data-testid="dropdown-admin-notifications"
                  >
                    {totalNotifications === 0 ? (
                      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 w-fit mx-auto mb-3">
                          <Bell className="h-6 w-6 opacity-50" />
                        </div>
                        <p className="font-medium">Không có thông báo mới</p>
                        <p className="text-sm mt-1">Tất cả thông báo đã được xử lý</p>
                      </div>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">Thông báo mới</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{totalNotifications} thông báo chưa đọc</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleMarkAllAsRead}
                              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                              data-testid="button-mark-all-read"
                            >
                              <CheckCheck className="h-3 w-3 mr-1" />
                              Đánh dấu đã đọc
                            </Button>
                          </div>
                        </div>
                        
                        {/* Support Ticket Notifications */}
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {supportTicketNotifications.map((notification: any) => (
                            <DropdownMenuItem 
                              key={notification.notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className="p-4 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 dark:hover:bg-gray-700/50 dark:focus:bg-gray-700/50 transition-colors duration-150"
                              data-testid={`notification-support-${notification.notification.id}`}
                            >
                              <div className="flex items-start space-x-3 w-full">
                                <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-lg flex-shrink-0">
                                  <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                    {notification.notification.title}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                    {notification.notification.message}
                                  </p>
                                  <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(notification.notification.createdAt).toLocaleString('vi-VN')}
                                  </div>
                                </div>
                                <div className="h-2 w-2 bg-orange-500 rounded-full flex-shrink-0 mt-1"></div>
                              </div>
                            </DropdownMenuItem>
                          ))}

                          {/* Account Request Notifications */}
                          {accountRequestNotifications.map((notification: any) => (
                            <DropdownMenuItem 
                              key={notification.notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className="p-4 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 dark:hover:bg-gray-700/50 dark:focus:bg-gray-700/50 transition-colors duration-150"
                              data-testid={`notification-account-${notification.notification.id}`}
                            >
                              <div className="flex items-start space-x-3 w-full">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg flex-shrink-0">
                                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                    {notification.notification.title}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                    {notification.notification.message}
                                  </p>
                                  <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(notification.notification.createdAt).toLocaleString('vi-VN')}
                                  </div>
                                </div>
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* User Profile Section */}
                <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.email || "Admin"
                      }
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                  </div>
                  
                  <Link href="/">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800" 
                      data-testid="link-home"
                    >
                      <Home className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Trang chủ</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* Modern Main Content Area */}
          <main className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-900/50">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm min-h-full">
                <div className="p-6">
                  {renderContent()}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
