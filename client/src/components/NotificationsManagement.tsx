import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Trash2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateNotificationModal from "@/components/modals/CreateNotificationModal";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

export default function NotificationsManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/admin/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa thông báo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
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
        description: "Không thể xóa thông báo",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thông báo này?")) {
      deleteMutation.mutate(id);
    }
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Vừa xong";
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ngày trước`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Quản lý thông báo</h3>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-primary-foreground"
          data-testid="button-create-notification"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm thông báo
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Chưa có thông báo nào</p>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4"
            variant="outline"
          >
            Tạo thông báo đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification: Notification) => (
            <div 
              key={notification.id} 
              className="bg-card border border-border rounded-lg p-6"
              data-testid={`notification-${notification.id}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">{notification.title}</h4>
                  <p className="text-muted-foreground mb-2">{notification.message}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{getTimeAgo(notification.createdAt!)}</span>
                    <span className={notification.isGlobal ? "text-accent" : "text-primary"}>
                      {notification.isGlobal ? "Toàn bộ người dùng" : "Người dùng cụ thể"}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(notification.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-${notification.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateNotificationModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
