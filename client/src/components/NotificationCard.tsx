import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notification } from "@shared/schema";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: () => void;
}

export default function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
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

  return (
    <div className="bg-accent/10 border-l-4 border-accent p-4 rounded-r-md" data-testid={`notification-${notification.id}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{notification.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <span className="text-xs text-muted-foreground">{getTimeAgo(notification.createdAt!)}</span>
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
