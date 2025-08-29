import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { GraduationCap, Bell, LogOut, Clock, Book, ExternalLink, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationCard from "@/components/NotificationCard";
import ProgramCard from "@/components/ProgramCard";
import DocumentTable from "@/components/DocumentTable";
import FloatingSupportButton from "@/components/FloatingSupportButton";
import FloatingChatButton from "@/components/FloatingChatButton";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    },
    onError: (error) => {
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
  });

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        window.location.href = "/";
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
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
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-b border-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center">
              <img 
                src="/via-logo.png" 
                alt="VIA English Academy" 
                className="h-10 sm:h-12 w-auto mr-3"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">VIA ENGLISH ACADEMY</h1>
                <p className="text-xs sm:text-sm text-blue-100 opacity-90">Learning Pathway</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notification Bell */}
              <Link href="/notifications">
                <button 
                  className="relative p-1.5 sm:p-2 text-blue-100 hover:text-white transition-colors"
                  data-testid="button-notifications"
                >
                  <Bell className="text-base sm:text-lg h-5 w-5 sm:h-6 sm:w-6" />
                  {notifications.length > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center"
                      data-testid="text-notification-count"
                    >
                      {notifications.length}
                    </span>
                  )}
                </button>
              </Link>

              {/* User Menu */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="hidden sm:inline text-sm text-blue-100" data-testid="text-user-name">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email || "User"
                  }
                </span>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 border-blue-200 text-white hover:bg-blue-800" data-testid="link-admin">
                      <span className="hidden sm:inline">Admin Panel</span>
                      <span className="sm:hidden">Admin</span>
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 text-blue-100 hover:text-white hover:bg-blue-800 transition-colors"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Notifications Section */}
        {notifications.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center space-x-3 mb-3 sm:mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                Thông báo mới
              </h2>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {notifications.map((userNotification: any) => (
                <NotificationCard
                  key={userNotification.id}
                  notification={userNotification.notification}
                  onMarkAsRead={() => handleMarkAsRead(userNotification.notification.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Important Documents Section */}
        {importantDocuments.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">Tài liệu quan trọng</h2>
                <p className="text-sm sm:text-base text-orange-600 font-medium">{importantDocuments.length} tài liệu quan trọng</p>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium text-foreground">Tài liệu</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium text-foreground hidden sm:table-cell">Mô tả</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium text-foreground hidden md:table-cell">Ngày tạo</th>
                      <th className="text-left py-2 sm:py-3 px-3 sm:px-6 text-xs sm:text-sm font-medium text-foreground">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importantDocuments.map((document: any) => (
                      <tr key={document.id} className="border-t border-border hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors duration-200" data-testid={`row-important-document-${document.id}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{document.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">
                          {document.description || "Không có mô tả"}
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">
                          {document.createdAt ? new Date(document.createdAt).toLocaleDateString("vi-VN") : ""}
                        </td>
                        <td className="py-4 px-6">
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleImportantDocumentClick(document)}
                            className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
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

        {/* Programs Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg">
                <Book className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                Chương trình học
              </h2>
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-home"
                />
              </div>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="w-[200px] text-foreground" data-testid="select-program-filter-home">
                  <SelectValue placeholder="Lọc chương trình" className="text-foreground" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="all" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Tất cả chương trình</SelectItem>
                  {programs.map((program: any) => (
                    <SelectItem key={program.id} value={program.id} className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {programs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Book className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Chưa có chương trình học nào</p>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
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

        {/* Recent Documents */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
              Tài liệu gần đây
            </h2>
          </div>

          {recentDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Chưa có tài liệu nào</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
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
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Tài liệu</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Chương trình</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Khóa học</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Cập nhật</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((document: any) => (
                      <tr key={document.id} className="border-t border-border hover:bg-muted/20" data-testid={`row-document-${document.id}`}>
                        <td className="py-3 px-6">
                          <div className="flex items-center">
                            <i className={`fas ${getFileIcon(document.fileType)} ${getFileIconColor(document.fileType)} mr-3`}></i>
                            <span className="font-medium text-foreground">{document.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-muted-foreground">{document.program?.name || "N/A"}</td>
                        <td className="py-3 px-6 text-muted-foreground">{document.category?.name || "N/A"}</td>
                        <td className="py-3 px-6 text-muted-foreground">
                          {new Date(document.updatedAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="py-3 px-6">
                          <a
                            href={document.googleDriveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors"
                            data-testid={`link-document-${document.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Support Button */}
      <FloatingSupportButton />
      
      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}
