import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, Bell, Home, GraduationCap } from "lucide-react";
import type { UserNotification, Notification } from "@shared/schema";

interface PaginatedNotifications {
  notifications: (UserNotification & { notification: Notification })[];
  total: number;
  totalPages: number;
}

export default function UserNotificationsList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const limit = 10;

  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ["/api/notifications/user", currentPage],
    queryFn: async (): Promise<PaginatedNotifications> => {
      const response = await fetch(`/api/notifications/user?page=${currentPage}&limit=${limit}`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
    retry: false,
  });

  // Highlight logic - highlight new notifications for 3 seconds
  useEffect(() => {
    if (paginatedData?.notifications && currentPage === 1) {
      const newNotificationIds = paginatedData.notifications
        .filter(userNotif => !userNotif.isRead)
        .slice(0, 3) // Highlight only the 3 newest unread notifications
        .map(userNotif => userNotif.notification.id);
      
      if (newNotificationIds.length > 0) {
        setHighlightedIds(new Set(newNotificationIds));
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedIds(new Set());
        }, 3000);
      }
    }
  }, [paginatedData, currentPage]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/user"] });
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
        title: "Lỗi",
        description: "Không thể đánh dấu thông báo là đã đọc",
        variant: "destructive",
      });
    },
  });

  const formatDateTime = (date: string | Date) => {
    const notificationDate = new Date(date);
    const now = new Date();
    
    const day = notificationDate.getDate().toString().padStart(2, '0');
    const month = (notificationDate.getMonth() + 1).toString().padStart(2, '0');
    const year = notificationDate.getFullYear();
    const hours = notificationDate.getHours().toString().padStart(2, '0');
    const minutes = notificationDate.getMinutes().toString().padStart(2, '0');
    
    const dateStr = `${day}/${month}/${year}`;
    const timeStr = `${hours}:${minutes}`;
    
    // Nếu là cùng ngày, chỉ hiển thị giờ
    if (notificationDate.toDateString() === now.toDateString()) {
      return `Hôm nay lúc ${timeStr}`;
    }
    
    // Nếu là hôm qua
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (notificationDate.toDateString() === yesterday.toDateString()) {
      return `Hôm qua lúc ${timeStr}`;
    }
    
    return `${dateStr} lúc ${timeStr}`;
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const notifications = paginatedData?.notifications || [];
  const totalPages = paginatedData?.totalPages || 1;
  const total = paginatedData?.total || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                  <GraduationCap className="text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-foreground">VIA ENGLISH ACADEMY</h1>
              </div>
            </Link>
            
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-back-home">
                <Home className="h-4 w-4" />
                Trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Thông báo ({total} thông báo)
            </CardTitle>
          </CardHeader>
          <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không có thông báo nào</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {notifications.map((userNotification) => {
                  const notification = userNotification.notification;
                  const isHighlighted = highlightedIds.has(notification.id);
                  const isUnread = !userNotification.isRead;
                  
                  const isClickable = notification.title.includes("Phản hồi từ") || notification.title.includes("💬 Phản hồi từ");
                  
                  return (
                    <div
                      key={userNotification.id}
                      className={`border rounded-lg p-4 transition-all duration-300 ${
                        isHighlighted 
                          ? "bg-accent/20 border-accent border-2 shadow-md" 
                          : isUnread 
                          ? "bg-accent/5 border-accent/30" 
                          : "bg-background border-border"
                      } ${isClickable ? "cursor-pointer hover:bg-accent/10 hover:shadow-md" : ""}`}
                      data-testid={`notification-${notification.id}`}
                      onClick={() => {
                        if (isClickable) {
                          // Mark as read first
                          if (isUnread) {
                            handleMarkAsRead(userNotification.id);
                          }
                          // Navigate to support tickets page
                          window.location.href = "/support-tickets";
                        }
                      }}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className="font-medium text-foreground">
                              {notification.title}
                            </h3>
                            {isUnread && (
                              <Badge variant="secondary" className="text-xs">
                                Mới
                              </Badge>
                            )}
                            {isHighlighted && (
                              <Badge variant="default" className="text-xs animate-pulse">
                                Nổi bật
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-2 whitespace-pre-line">
                            {notification.message}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(notification.createdAt!)}
                            </span>
                            
                            {isUnread && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent notification click
                                  handleMarkAsRead(userNotification.id);
                                }}
                                disabled={markAsReadMutation.isPending}
                                className="text-xs"
                                data-testid={`button-mark-read-${notification.id}`}
                              >
                                {markAsReadMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Đánh dấu đã đọc"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Trang {currentPage} / {totalPages} • {total} thông báo
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = currentPage <= 3 
                          ? i + 1 
                          : currentPage >= totalPages - 2
                          ? totalPages - 4 + i
                          : currentPage - 2 + i;
                          
                        if (page < 1 || page > totalPages) return null;
                        
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                            data-testid={`button-page-${page}`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      Tiếp
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}