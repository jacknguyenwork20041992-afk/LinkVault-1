import { useState } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Key, Eye, EyeOff, ExternalLink, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Account, InsertAccount } from "@shared/schema";

export default function AccountsTable() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      const res = await apiRequest("POST", "/api/accounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsCreateOpen(false);
      toast({
        title: "Thành công",
        description: "Tài khoản đã được tạo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertAccount> }) => {
      const res = await apiRequest("PUT", `/api/accounts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setEditingAccount(null);
      toast({
        title: "Thành công",
        description: "Tài khoản đã được cập nhật",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Thành công",
        description: "Tài khoản đã được xóa",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePasswordVisibility = (accountId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const openLink = (url: string) => {
    if (url) {
      let link = url;
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://' + link;
      }
      window.open(link, '_blank');
    }
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(accounts.map(acc => acc.category).filter(Boolean)));

  // Filter accounts based on search and category
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = !searchTerm || 
      account.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || account.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const AccountForm = ({ account, onSubmit }: { account?: Account; onSubmit: (data: InsertAccount) => void }) => {
    const [formData, setFormData] = useState<InsertAccount>({
      title: account?.title || "",
      url: account?.url || "",
      category: account?.category || "",
      username: account?.username || "",
      password: account?.password || "",
      description: account?.description || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tên Website *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Facebook, Google, etc."
              required
              data-testid="input-website-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Input
              id="category"
              value={formData.category || ""}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Social Media, Email, etc."
              data-testid="input-category"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">Link Website</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://www.facebook.com"
            data-testid="input-link"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">Tên đăng nhập / Email</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="username@example.com"
              data-testid="input-account-id"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              data-testid="input-password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Ghi chú</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Ghi chú bổ sung về tài khoản này..."
            rows={3}
            data-testid="input-description"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateOpen(false);
              setEditingAccount(null);
            }}
            data-testid="button-cancel"
          >
            Hủy
          </Button>
          <Button type="submit" data-testid="button-save">
            {account ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </form>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground">Đang tải danh sách tài khoản...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Danh sách tài khoản</h2>
          <p className="text-muted-foreground">Quản lý thông tin đăng nhập các website</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" data-testid="button-create-account">
              <Plus className="h-4 w-4" />
              Thêm tài khoản
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm tài khoản mới</DialogTitle>
            </DialogHeader>
            <AccountForm onSubmit={(data) => createMutation.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm theo tên website, tài khoản, ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-accounts"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-category">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Lọc theo danh mục" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category || ""}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng tài khoản</p>
                <p className="text-xl font-bold text-foreground" data-testid="text-total-accounts">{accounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Filter className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Danh mục</p>
                <p className="text-xl font-bold text-foreground" data-testid="text-total-categories">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kết quả tìm kiếm</p>
                <p className="text-xl font-bold text-foreground" data-testid="text-filtered-accounts">{filteredAccounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Grid */}
      {filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm || filterCategory !== "all" ? "Không tìm thấy tài khoản" : "Chưa có tài khoản nào"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterCategory !== "all" 
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"
                : "Thêm tài khoản đầu tiên để bắt đầu quản lý thông tin đăng nhập"
              }
            </p>
            {!searchTerm && filterCategory === "all" && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2"
                data-testid="button-create-first-account"
              >
                <Plus className="h-4 w-4" />
                Thêm tài khoản đầu tiên
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="hover:shadow-lg transition-shadow" data-testid={`card-account-${account.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground" data-testid={`text-website-name-${account.id}`}>
                        {account.title}
                      </CardTitle>
                      {account.category && (
                        <Badge variant="secondary" className="mt-1" data-testid={`badge-category-${account.id}`}>
                          {account.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {account.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openLink(account.url)}
                        className="h-8 w-8 p-0"
                        title="Mở website"
                        data-testid={`button-open-link-${account.id}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingAccount(account)}
                      className="h-8 w-8 p-0"
                      title="Chỉnh sửa"
                      data-testid={`button-edit-${account.id}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(account.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      title="Xóa"
                      data-testid={`button-delete-${account.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {account.username && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Tài khoản:</Label>
                    <p className="text-sm font-medium text-foreground" data-testid={`text-account-id-${account.id}`}>
                      {account.username}
                    </p>
                  </div>
                )}
                {account.password && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Mật khẩu:</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(account.id)}
                        className="h-6 w-6 p-0"
                        data-testid={`button-toggle-password-${account.id}`}
                      >
                        {showPasswords[account.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm font-mono text-foreground" data-testid={`text-password-${account.id}`}>
                      {showPasswords[account.id] ? account.password : "••••••••"}
                    </p>
                  </div>
                )}
                {account.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Ghi chú:</Label>
                    <p className="text-sm text-muted-foreground" data-testid={`text-description-${account.id}`}>
                      {account.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tài khoản</DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <AccountForm
              account={editingAccount}
              onSubmit={(data) => updateMutation.mutate({ id: editingAccount.id, data })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}