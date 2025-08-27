import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Trash2, Users, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreateUserModal from "@/components/modals/CreateUserModal";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function UsersManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa người dùng",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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
        description: "Không thể xóa người dùng",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      deleteMutation.mutate(id);
    }
  };

  const getRoleColor = (role: string) => {
    return role === "admin" 
      ? "bg-destructive/10 text-destructive" 
      : "bg-primary/10 text-primary";
  };

  const getRoleIcon = (role: string) => {
    return role === "admin" ? Shield : User;
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
        <h3 className="text-lg font-semibold text-foreground">Quản lý người dùng</h3>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-primary-foreground"
          data-testid="button-create-user"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Chưa có người dùng nào</p>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4"
            variant="outline"
          >
            Thêm người dùng đầu tiên
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Người dùng</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Email</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Vai trò</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Tạo lúc</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: UserType) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <tr key={user.id} className="border-t border-border hover:bg-muted/20" data-testid={`row-user-${user.id}`}>
                      <td className="py-3 px-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mr-3">
                            <RoleIcon className="text-accent text-sm" />
                          </div>
                          <div>
                            <span className="font-medium text-foreground">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.email
                              }
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-muted-foreground">{user.email || "N/A"}</td>
                      <td className="py-3 px-6">
                        <Badge className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role)}`}>
                          {user.role === "admin" ? "Admin" : "Người dùng"}
                        </Badge>
                      </td>
                      <td className="py-3 px-6 text-muted-foreground">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                      </td>
                      <td className="py-3 px-6">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateUserModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
