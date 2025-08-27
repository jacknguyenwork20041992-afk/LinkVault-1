import { useQuery } from "@tanstack/react-query";
import { Book, FileText, Users, Bell, Plus, UserPlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  const quickActions = [
    {
      title: "Thêm chương trình",
      description: "Tạo chương trình học mới",
      icon: Plus,
      color: "text-primary",
      testId: "button-create-program"
    },
    {
      title: "Thêm người dùng", 
      description: "Tạo tài khoản mới",
      icon: UserPlus,
      color: "text-accent",
      testId: "button-create-user"
    },
    {
      title: "Upload tài liệu",
      description: "Thêm link Google Drive",
      icon: Upload,
      color: "text-secondary-foreground",
      testId: "button-upload-document"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className="hover:shadow-md transition-shadow cursor-pointer">
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

      {/* Recent Activity Placeholder */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Hoạt động gần đây</h3>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Hoạt động gần đây sẽ hiển thị ở đây</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
