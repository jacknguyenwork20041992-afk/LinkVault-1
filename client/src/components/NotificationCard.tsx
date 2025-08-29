import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notification } from "@shared/schema";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: () => void;
}

export default function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
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
    <div className="vibrant-card border-l-4 border-accent p-4 rounded-lg hover-lift" data-testid={`notification-${notification.id}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{notification.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
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
