import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Trash2, Users, Shield, User, Edit, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateUserModal from "@/components/modals/CreateUserModal";
import EditUserModal from "@/components/modals/EditUserModal";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function UsersManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  // Filter logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchTerm === "" || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
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

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
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
          className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 rounded-xl font-medium"
          data-testid="button-create-user"
        >
          <Plus className="h-5 w-5 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      {/* Search và Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-users"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[200px] text-foreground" data-testid="select-role-filter">
            <SelectValue placeholder="Lọc theo vai trò" className="text-foreground" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border">
            <SelectItem value="all" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Tất cả vai trò</SelectItem>
            <SelectItem value="admin" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Admin</SelectItem>
            <SelectItem value="user" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Người dùng</SelectItem>
          </SelectContent>
        </Select>
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
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Không tìm thấy người dùng nào</p>
          <Button 
            onClick={() => {
              setSearchTerm("");
              setSelectedRole("all");
            }}
            className="mt-4"
            variant="outline"
          >
            Xóa bộ lọc
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
                {filteredUsers.map((user: UserType) => {
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
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(user)}
                            data-testid={`button-edit-${user.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
      
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        editingUser={editingUser}
      />
    </div>
  );
}
