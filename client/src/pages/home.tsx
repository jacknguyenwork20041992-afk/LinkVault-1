import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { isUnauthorizedError } from "@/lib/authUtils";
import { GraduationCap, Bell, LogOut, Clock, Book, ExternalLink, Search, AlertTriangle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationCard from "@/components/NotificationCard";
import ProgramCard from "@/components/ProgramCard";
import FloatingSupportButton from "@/components/FloatingSupportButton";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeTheme, displayName: themeDisplayName } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications/unread"],
    retry: false,
    refetchInterval: 15000, // Auto-refresh every 15 seconds for real-time notifications
    refetchOnWindowFocus: true, // Refresh when user switches back to tab
    refetchIntervalInBackground: true, // Continue refreshing to catch admin responses
  });

  const { data: programs = [] } = useQuery<any[]>({
    queryKey: ["/api/programs"],
    retry: false,
  });

  const { data: recentDocuments = [] } = useQuery<any[]>({
    queryKey: ["/api/documents/recent"],
    retry: false,
  });

  const { data: importantDocuments = [] } = useQuery<any[]>({
    queryKey: ["/api/important-documents"],
    retry: false,
  });

  const { data: supportTools = [] } = useQuery<any[]>({
    queryKey: ["/api/support-tools"],
    retry: false,
  });

  // Filter logic cho programs
  const filteredPrograms = programs.filter((program: any) => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filter logic cho recent documents
  const filteredDocuments = recentDocuments.filter((document: any) => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = selectedProgram === "all" || document.program?.id === selectedProgram;
    
    return matchesSearch && matchesProgram;
  });

  // Activity tracking mutation for important documents
  const trackActivityMutation = useMutation({
    mutationFn: async (data: { type: string; description: string; metadata?: any }) => {
      console.log("Sending activity track request:", data);
      return apiRequest("POST", "/api/activities/track", data);
    },
    onSuccess: (data) => {
      console.log("Activity tracked successfully:", data);
    },
    onError: (error) => {
      console.error("Activity tracking failed:", error);
    },
  });

  const handleImportantDocumentClick = (document: any) => {
    console.log("Important document click tracked:", document.title);
    trackActivityMutation.mutate({
      type: "important_document_click",
      description: `Đã xem tài liệu quan trọng: ${document.title}`,
      metadata: {
        documentId: document.id,
        documentTitle: document.title,
      }
    });
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
    },
    onMutate: async (notificationId: string) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["/api/notifications/unread"] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(["/api/notifications/unread"]);

      // Optimistically update to the new value - remove the notification from UI immediately
      queryClient.setQueryData(["/api/notifications/unread"], (old: any[]) => {
        if (!old) return old;
        return old.filter((userNotification: any) => userNotification.notification.id !== notificationId);
      });

      // Return a context object with the snapshotted value
      return { previousNotifications };
    },
    onError: (error, notificationId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousNotifications) {
        queryClient.setQueryData(["/api/notifications/unread"], context.previousNotifications);
      }
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    },
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      window.location.href = "/";
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return "fa-file-alt";
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "fa-file-pdf";
      case "doc":
      case "docx":
        return "fa-file-word";
      case "xls":
      case "xlsx":
        return "fa-file-excel";
      case "ppt":
      case "pptx":
        return "fa-file-powerpoint";
      default:
        return "fa-file-alt";
    }
  };

  const getFileIconColor = (fileType?: string) => {
    if (!fileType) return "text-muted-foreground";
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "text-destructive";
      case "doc":
      case "docx":
        return "text-primary";
      case "xls":
      case "xlsx":
        return "text-accent";
      case "ppt":
      case "pptx":
        return "text-orange-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950/20">
      {/* Enhanced Navigation Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-50 dark:bg-gray-900/80 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-18">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">VIA English Academy</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Learning Management System</p>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center space-x-3 lg:space-x-4">
              {/* Notification Bell */}
              <Link href="/notifications">
                <button 
                  className="relative p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/30"
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center animate-pulse"
                      data-testid="text-notification-count"
                    >
                      {notifications.length}
                    </span>
                  )}
                </button>
              </Link>

              {/* User Profile Section */}
              <div className="flex items-center space-x-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white" data-testid="text-user-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || "User"
                    }
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role === "admin" ? "Administrator" : "Student"}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {user?.role === "admin" && (
                    <Link href="/admin">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30" 
                        data-testid="link-admin"
                      >
                        <span className="hidden lg:inline">Admin Panel</span>
                        <span className="lg:hidden">Admin</span>
                      </Button>
                    </Link>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner Section - Theme Applied */}
      <section className="homepage-banner bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 lg:py-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-2xl lg:text-3xl font-bold mb-3">
              VIA R&D Department
            </h1>
            <p className="text-lg lg:text-xl text-blue-100 mb-4">
              Hệ thống quản lý tài liệu
            </p>
            {activeTheme?.themeName !== 'default' && (
              <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                🎉 Giao diện: {themeDisplayName}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="py-6 lg:py-8">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Chào mừng bạn trở lại! Theo dõi tiến trình học tập và tài liệu của bạn.
            </p>
          </div>

          {/* Notifications Section */}
          {notifications.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30 rounded-xl border-2 border-amber-200 dark:border-amber-700/50 p-6 shadow-lg">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative">
                    <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-orange-600 shadow-lg animate-pulse">
                      <Bell className="h-7 w-7 text-white animate-bounce" />
                    </div>
                    {notifications.length > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse shadow-lg">
                        {notifications.length}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      🔔 Thông báo mới
                      <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-full animate-pulse">
                        MỊI!
                      </span>
                    </h2>
                    <p className="text-base font-semibold text-orange-700 dark:text-orange-300">
                      {notifications.length} thông báo chưa đọc - Hãy kiểm tra ngay! 👆
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {notifications.map((userNotification: any) => (
                    <NotificationCard
                      key={userNotification.id}
                      notification={userNotification.notification}
                      onMarkAsRead={() => handleMarkAsRead(userNotification.notification.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Important Documents Section */}
          {importantDocuments.length > 0 && (
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                        🚨 TÀI LIỆU QUAN TRỌNG
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {importantDocuments.length} tài liệu cần chú ý
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                          Tài liệu
                        </th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:table-cell">
                          Mô tả
                        </th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-900 dark:text-gray-100 hidden lg:table-cell">
                          Ngày tạo
                        </th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {importantDocuments.map((document: any) => (
                        <tr 
                          key={document.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150" 
                          data-testid={`row-important-document-${document.id}`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {document.title}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                            {document.description || "Không có mô tả"}
                          </td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                            {document.createdAt ? new Date(document.createdAt).toLocaleDateString("vi-VN") : ""}
                          </td>
                          <td className="py-4 px-6">
                            <a
                              href={document.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleImportantDocumentClick(document)}
                              className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                              data-testid={`link-important-document-${document.id}`}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Xem tài liệu
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Programs Section */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Book className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                        📚 CHƯƠNG TRÌNH HỌC
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {programs.length} chương trình có sẵn
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Tìm kiếm chương trình..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                        data-testid="input-search-home"
                      />
                    </div>
                    <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                      <SelectTrigger className="w-full sm:w-[200px] bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600" data-testid="select-program-filter-home">
                        <SelectValue placeholder="Lọc chương trình" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <SelectItem value="all">Tất cả chương trình</SelectItem>
                        {programs.map((program: any) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {programs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Book className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Chưa có chương trình học nào</p>
                  </div>
                ) : filteredPrograms.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Không tìm thấy chương trình nào</p>
                    <Button 
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedProgram("all");
                      }}
                      className="mt-4"
                      variant="outline"
                    >
                      Xóa bộ lọc
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrograms.map((program: any) => (
                      <ProgramCard key={program.id} program={program} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Support Tools Section */}
          {supportTools.length > 0 && (
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Wrench className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                        🔧 CÔNG CỤ HỖ TRỢ
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {supportTools.length} công cụ hữu ích
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {supportTools.map((tool: any) => (
                      <div 
                        key={tool.id}
                        className="group bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950/20 dark:via-gray-800 dark:to-indigo-950/20 rounded-lg border border-purple-200 dark:border-purple-700/50 p-4 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 hover:-translate-y-1"
                        data-testid={`card-support-tool-${tool.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors duration-200">
                            <Wrench className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <ExternalLink className="h-4 w-4 text-purple-400 dark:text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                          {tool.name}
                        </h3>
                        
                        {tool.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-tight">
                            {tool.description}
                          </p>
                        )}
                        
                        <a
                          href={tool.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center w-full justify-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                          data-testid={`link-support-tool-${tool.id}`}
                        >
                          <Wrench className="h-4 w-4 mr-2" />
                          Mở công cụ
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Documents Section */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                      📄 TÀI LIỆU GẦN ĐÂY
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Các tài liệu được cập nhật gần đây
                    </p>
                  </div>
                </div>
              </div>

              <div>
                {recentDocuments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Chưa có tài liệu nào</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Không tìm thấy tài liệu nào</p>
                    <Button 
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedProgram("all");
                      }}
                      className="mt-4"
                      variant="outline"
                    >
                      Xóa bộ lọc
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900 dark:text-gray-100">Tài liệu</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:table-cell">Chương trình</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900 dark:text-gray-100 hidden lg:table-cell">Khóa học</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900 dark:text-gray-100 hidden lg:table-cell">Cập nhật</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredDocuments.map((document: any) => (
                          <tr key={document.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150" data-testid={`row-document-${document.id}`}>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <i className={`fas ${getFileIcon(document.fileType)} ${getFileIconColor(document.fileType)}`}></i>
                                <span className="font-medium text-gray-900 dark:text-white">{document.title}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{document.program?.name || "N/A"}</td>
                            <td className="py-4 px-6 text-gray-600 dark:text-gray-300 hidden lg:table-cell">{document.category?.name || "N/A"}</td>
                            <td className="py-4 px-6 text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                              {new Date(document.updatedAt).toLocaleDateString("vi-VN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Support Button */}
      <FloatingSupportButton />
    </div>
  );
}