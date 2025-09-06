import { useQuery } from "@tanstack/react-query";
import { Book, FileText, Users, Bell, Plus, UserPlus, Upload, Clock, Eye, Palette, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface AdminDashboardProps {
  onNavigateToView?: (view: string) => void;
}

export default function AdminDashboard({ onNavigateToView }: AdminDashboardProps) {
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<any[]>({
    queryKey: ["/api/activities"],
    retry: false,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not active
  });

  const quickActions = [
    {
      title: "Thêm chương trình",
      description: "Tạo chương trình học mới",
      icon: Plus,
      color: "text-primary",
      testId: "button-create-program",
      action: () => onNavigateToView?.("programs")
    },
    {
      title: "Thêm người dùng", 
      description: "Tạo tài khoản mới",
      icon: UserPlus,
      color: "text-accent",
      testId: "button-create-user",
      action: () => onNavigateToView?.("users")
    },
    {
      title: "Upload tài liệu",
      description: "Thêm link Google Drive",
      icon: Upload,
      color: "text-secondary-foreground",
      testId: "button-upload-document",
      action: () => onNavigateToView?.("documents")
    },
    {
      title: "Tạo thông báo",
      description: "Gửi thông báo mới",
      icon: Bell,
      color: "text-orange-500",
      testId: "button-create-notification",
      action: () => onNavigateToView?.("notifications")
    },
    {
      title: "Quản lý giao diện",
      description: "Thiết lập theme và màu sắc",
      icon: Palette,
      color: "text-purple-500",
      testId: "button-manage-themes",
      action: () => onNavigateToView?.("theme-management")
    },
    {
      title: "Upload Method",
      description: "Cấu hình Google Drive / Cloud Storage",
      icon: HardDrive,
      color: "text-indigo-500",
      testId: "button-upload-settings",
      action: () => onNavigateToView?.("upload-settings")
    }
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Tổng chương trình</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-programs">
                  {stats?.totalPrograms || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Book className="text-primary text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Tổng tài liệu</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-documents">
                  {stats?.totalDocuments || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <FileText className="text-accent text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Người dùng</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-users">
                  {stats?.totalUsers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                <Users className="text-secondary-foreground text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Thông báo chưa đọc</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-unread-notifications">
                  {stats?.unreadNotifications || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Bell className="text-destructive text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title} 
                className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={action.action}
                data-testid={action.testId}
              >
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <Icon className={`${action.color} mr-2`} />
                    <span className="font-medium text-foreground">{action.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Hoạt động gần đây</h3>
        <Card>
          <CardContent className="p-6">
            {activitiesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Chưa có hoạt động nào được ghi lại</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {activities.slice(0, 10).map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0">
                      {activity.type?.includes('document') ? (
                        <Eye className="h-5 w-5 text-blue-500 mt-0.5" />
                      ) : activity.type?.includes('important_document') ? (
                        <FileText className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : (
                        <Bell className="h-5 w-5 text-gray-500 mt-0.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium">
                        {activity.user?.email || 'Người dùng'} 
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(activity.createdAt), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length > 10 && (
                  <div className="text-center pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onNavigateToView?.("activity")}
                      data-testid="button-view-all-activities"
                    >
                      Xem tất cả hoạt động
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
