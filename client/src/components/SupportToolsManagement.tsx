import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, ExternalLink, Edit, Link as LinkIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupportToolSchema, type SupportTool, type InsertSupportTool } from "@/types";

export default function SupportToolsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<SupportTool | null>(null);

  // Fetch current user for createdBy
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch support tools
  const { data: supportTools = [], isLoading } = useQuery<SupportTool[]>({
    queryKey: ["/api/support-tools"],
  });

  const createForm = useForm<InsertSupportTool>({
    resolver: zodResolver(insertSupportToolSchema),
    defaultValues: {
      name: "",
      link: "",
      description: "",
      createdBy: user?.id || "",
    },
  });

  const editForm = useForm<InsertSupportTool>({
    resolver: zodResolver(insertSupportToolSchema),
    defaultValues: {
      name: "",
      link: "",
      description: "",
      createdBy: user?.id || "",
    },
  });

  // Create support tool mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertSupportTool) => {
      await apiRequest("POST", "/api/support-tools", {
        ...data,
        createdBy: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tools"] });
      setIsCreateOpen(false);
      createForm.reset();
      toast({
        title: "Thành công",
        description: "Công cụ hỗ trợ đã được tạo thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo công cụ hỗ trợ",
        variant: "destructive",
      });
    },
  });

  // Update support tool mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; tool: InsertSupportTool }) => {
      await apiRequest("PUT", `/api/support-tools/${data.id}`, {
        ...data.tool,
        createdBy: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tools"] });
      setIsEditOpen(false);
      setEditingTool(null);
      editForm.reset();
      toast({
        title: "Thành công",
        description: "Công cụ hỗ trợ đã được cập nhật thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật công cụ hỗ trợ",
        variant: "destructive",
      });
    },
  });

  // Delete support tool mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/support-tools/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tools"] });
      toast({
        title: "Thành công",
        description: "Công cụ hỗ trợ đã được xóa thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa công cụ hỗ trợ",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: InsertSupportTool) => {
    createMutation.mutate(data);
  };

  const handleEdit = (tool: SupportTool) => {
    setEditingTool(tool);
    editForm.reset({
      name: tool.name,
      link: tool.link,
      description: tool.description || "",
      createdBy: user?.id || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = (data: InsertSupportTool) => {
    if (!editingTool) return;
    updateMutation.mutate({
      id: editingTool.id,
      tool: data,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa công cụ hỗ trợ này không?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Công cụ hỗ trợ</h2>
          <p className="text-muted-foreground">
            Quản lý các công cụ hỗ trợ hiển thị cho người dùng
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" data-testid="button-create-support-tool">
              <Plus className="h-4 w-4 mr-2" />
              Thêm công cụ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Thêm công cụ hỗ trợ mới</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên công cụ *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên công cụ" {...field} data-testid="input-create-tool-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link công cụ *</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} data-testid="input-create-tool-link" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Mô tả ngắn về công cụ (tùy chọn)" 
                          {...field}
                          data-testid="textarea-create-tool-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                    data-testid="button-cancel-create-tool"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    data-testid="button-submit-create-tool"
                  >
                    {createMutation.isPending ? "Đang tạo..." : "Tạo công cụ"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Support Tools List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supportTools.map((tool) => (
          <Card key={tool.id} className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2 text-blue-500" />
                  {tool.name}
                </CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(tool)}
                    className="text-blue-600 hover:text-blue-700"
                    data-testid={`button-edit-tool-${tool.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tool.id)}
                    className="text-red-500 hover:text-red-700"
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-tool-${tool.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {tool.description && (
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              )}
              <div className="flex items-center justify-between">
                <a
                  href={tool.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                  data-testid={`link-tool-${tool.id}`}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Mở công cụ
                </a>
                <Badge variant="outline" className="text-xs">
                  {new Date(tool.createdAt || "").toLocaleDateString("vi-VN")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {supportTools.length === 0 && (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Chưa có công cụ hỗ trợ nào</h3>
              <p className="text-muted-foreground">Thêm công cụ hỗ trợ đầu tiên để hiển thị cho người dùng</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa công cụ hỗ trợ</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên công cụ *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên công cụ" {...field} data-testid="input-edit-tool-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link công cụ *</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-edit-tool-link" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Mô tả ngắn về công cụ (tùy chọn)" 
                        {...field}
                        data-testid="textarea-edit-tool-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingTool(null);
                  }}
                  data-testid="button-cancel-edit-tool"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  data-testid="button-submit-edit-tool"
                >
                  {updateMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}