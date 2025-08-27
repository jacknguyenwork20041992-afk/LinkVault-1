import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { GraduationCap, Bell, LogOut, Clock, Book, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationCard from "@/components/NotificationCard";
import ProgramCard from "@/components/ProgramCard";
import DocumentTable from "@/components/DocumentTable";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications/unread"],
    retry: false,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs"],
    retry: false,
  });

  const { data: recentDocuments = [] } = useQuery({
    queryKey: ["/api/documents/recent"],
    retry: false,
  });

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

  const handleLogout = () => {
    window.location.href = "/api/logout";
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
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                <GraduationCap className="text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Trung Tâm Ngoại Ngữ</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <button 
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-notifications"
              >
                <Bell className="text-lg" />
                {notifications.length > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center"
                    data-testid="text-notification-count"
                  >
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-foreground" data-testid="text-user-name">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email || "User"
                  }
                </span>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" data-testid="link-admin">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications Section */}
        {notifications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Bell className="text-primary mr-2" />
              Thông báo mới
            </h2>

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
        )}

        {/* Programs Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
            <Book className="text-primary mr-2" />
            Chương trình học
          </h2>

          {programs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Book className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Chưa có chương trình học nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program: any) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
            <Clock className="text-primary mr-2" />
            Tài liệu gần đây
          </h2>

          {recentDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Chưa có tài liệu nào</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Tài liệu</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Chương trình</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Danh mục</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Cập nhật</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocuments.map((document: any) => (
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
    </div>
  );
}
