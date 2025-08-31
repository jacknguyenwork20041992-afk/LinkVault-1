import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notification } from "@shared/schema";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: () => void;
}

export default function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  // Check if this is a support ticket response notification
  const isSupportResponse = notification.title.includes("Phản hồi từ") || notification.title.includes("💬 Phản hồi từ");
  
  // Handle click to view details (navigate to support tickets)
  const handleViewDetails = () => {
    // Mark as read
    onMarkAsRead();
    // Navigate to support tickets page
    window.location.href = "/support-tickets";
  };

  // Parse message to make "Nhấn để xem chi tiết" clickable
  const renderMessage = (message: string) => {
    if (!isSupportResponse || !message.includes("👆 Nhấn để xem chi tiết")) {
      return <p className="text-sm text-muted-foreground mt-1">{message}</p>;
    }

    const parts = message.split("👆 Nhấn để xem chi tiết");
    return (
      <div className="text-sm text-muted-foreground mt-1">
        <p className="mb-2">{parts[0]}</p>
        <button
          onClick={handleViewDetails}
          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer text-sm"
          data-testid={`button-view-details-${notification.id}`}
        >
          <ExternalLink className="h-3 w-3" />
          👆 Nhấn để xem chi tiết
        </button>
        {parts[1] && <p className="mt-1">{parts[1]}</p>}
      </div>
    );
  };

  const formatDateTime = (date: string | Date) => {
    const notificationDate = new Date(date);
    const now = new Date();
    
    // Format ngày/tháng/năm và giờ:phút
    const day = notificationDate.getDate().toString().padStart(2, '0');
    const month = (notificationDate.getMonth() + 1).toString().padStart(2, '0');
    const year = notificationDate.getFullYear();
    const hours = notificationDate.getHours().toString().padStart(2, '0');
    const minutes = notificationDate.getMinutes().toString().padStart(2, '0');
    
    const dateStr = `${day}/${month}/${year}`;
    const timeStr = `${hours}:${minutes}`;
    
    // Nếu là cùng ngày, chỉ hiển thị giờ
    const today = new Date();
    if (notificationDate.toDateString() === today.toDateString()) {
      return `Hôm nay lúc ${timeStr}`;
    }
    
    // Nếu là hôm qua
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (notificationDate.toDateString() === yesterday.toDateString()) {
      return `Hôm qua lúc ${timeStr}`;
    }
    
    // Ngày khác hiển thị đầy đủ
    return `${dateStr} lúc ${timeStr}`;
  };

  return (
    <div className={`vibrant-card border-l-4 p-4 rounded-lg hover-lift ${
      isSupportResponse 
        ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" 
        : "border-accent"
    }`} data-testid={`notification-${notification.id}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className={`font-medium ${
            isSupportResponse ? "text-green-700 dark:text-green-400" : "text-foreground"
          }`}>
            {notification.title}
          </h3>
          {renderMessage(notification.message)}
          <span className="text-xs text-muted-foreground">{formatDateTime(notification.createdAt!)}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onMarkAsRead}
          className="text-muted-foreground hover:text-foreground ml-2"
          data-testid={`button-mark-read-${notification.id}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
