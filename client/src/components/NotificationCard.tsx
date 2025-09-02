import { X, ExternalLink, Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: () => void;
}

export default function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const [, setLocation] = useLocation();
  
  // Check if this is a support ticket response notification
  const isSupportResponse = notification.title.includes("Phản hồi từ") || notification.title.includes("💬 Phản hồi từ");
  
  // Handle click to view details (navigate to support tickets)
  const handleViewDetails = () => {
    // Mark as read
    onMarkAsRead();
    // Navigate to support tickets page using wouter (faster than window.location)
    setLocation("/support-tickets");
  };

  // Parse message to make "Nhấn để xem chi tiết" clickable
  const renderMessage = (message: string) => {
    if (!isSupportResponse || !message.includes("👆 Nhấn để xem chi tiết")) {
      return <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mt-2">{message}</p>;
    }

    const parts = message.split("👆 Nhấn để xem chi tiết");
    return (
      <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mt-2">
        <p className="mb-3">{parts[0]}</p>
        <button
          onClick={handleViewDetails}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors cursor-pointer text-sm bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50"
          data-testid={`button-view-details-${notification.id}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Xem chi tiết
        </button>
        {parts[1] && <p className="mt-2">{parts[1]}</p>}
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
    <div className={`relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
      isSupportResponse 
        ? "border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-white dark:from-green-950/20 dark:to-gray-800" 
        : "border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/30 to-white dark:from-blue-950/10 dark:to-gray-800"
    }`} data-testid={`notification-${notification.id}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isSupportResponse 
            ? "bg-green-100 dark:bg-green-900/30" 
            : "bg-blue-100 dark:bg-blue-900/30"
        }`}>
          {isSupportResponse ? (
            <MessageSquare className={`h-5 w-5 ${
              isSupportResponse ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
            }`} />
          ) : (
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className={`text-base font-semibold leading-tight mb-1 ${
                isSupportResponse 
                  ? "text-green-800 dark:text-green-300" 
                  : "text-gray-900 dark:text-gray-100"
              }`}>
                {notification.title}
              </h3>
              
              {/* Message */}
              {renderMessage(notification.message)}
              
              {/* Time - more prominent */}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {formatDateTime(notification.createdAt!)}
                </span>
              </div>
            </div>

            {/* Close button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onMarkAsRead}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ml-3 h-8 w-8 p-0 rounded-full transition-colors"
              data-testid={`button-mark-read-${notification.id}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
