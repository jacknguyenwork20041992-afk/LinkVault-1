import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Activity as ActivityIcon, 
  LogIn, 
  FileText, 
  LogOut,
  User,
  Clock,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Activity {
  id: string;
  userId: string | null;
  type: string;
  description: string;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "login":
      return <LogIn className="h-4 w-4" />;
    case "document_click":
      return <FileText className="h-4 w-4" />;
    case "logout":
      return <LogOut className="h-4 w-4" />;
    default:
      return <ActivityIcon className="h-4 w-4" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "login":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "document_click":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "logout":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

export default function ActivityDashboard() {
  const [limit, setLimit] = useState("100");
  const { toast } = useToast();

  const { data: activities = [], isLoading, refetch } = useQuery<Activity[]>({
    queryKey: ["/api/activities", limit],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/activities?limit=${limit}`);
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: true, // Continue refreshing even when tab is not active
  });

  const trackActivityMutation = useMutation({
    mutationFn: async (data: { type: string; description: string; metadata?: any }) => {
      const response = await apiRequest("POST", "/api/activities/track", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Thành công",
        description: "Đã ghi nhận hoạt động",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể ghi nhận hoạt động",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refetch();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss", { locale: vi });
    } catch {
      return "Không xác định";
    }
  };

  const getUserName = (user: Activity['user']) => {
    if (!user) return "Người dùng không xác định";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Không rõ";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hoạt động người dùng</h1>
          <p className="text-muted-foreground">
            Theo dõi các hoạt động của người dùng trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="limit">Số lượng:</Label>
            <Input
              id="limit"
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-20"
              min="1"
              max="1000"
              data-testid="input-activity-limit"
            />
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            data-testid="button-refresh-activities"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng hoạt động</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-activities">
              {activities.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đăng nhập</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-login-activities">
              {activities.filter(a => a.type === "login").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xem tài liệu</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-document-activities">
              {activities.filter(a => a.type === "document_click").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng hoạt động</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-users">
              {new Set(activities.map(a => a.userId).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết hoạt động</CardTitle>
          <CardDescription>
            Danh sách các hoạt động gần đây của người dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Chưa có hoạt động nào
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((activity) => (
                    <TableRow key={activity.id} data-testid={`row-activity-${activity.id}`}>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={getActivityColor(activity.type)}
                        >
                          <div className="flex items-center gap-1">
                            {getActivityIcon(activity.type)}
                            <span className="capitalize">{activity.type}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-user-${activity.id}`}>
                        {getUserName(activity.user)}
                      </TableCell>
                      <TableCell data-testid={`text-description-${activity.id}`}>
                        {activity.description}
                      </TableCell>
                      <TableCell data-testid={`text-time-${activity.id}`}>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDate(activity.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-ip-${activity.id}`}>
                        <span className="text-sm text-muted-foreground">
                          {activity.ipAddress || "N/A"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}