import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertNotificationSchema, type InsertNotification, type User } from "@shared/schema";
import { X, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateNotificationModal({
  isOpen,
  onClose,
}: CreateNotificationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Fetch users for selection
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isOpen, // Only fetch when modal is open
  });

  const form = useForm<InsertNotification>({
    resolver: zodResolver(insertNotificationSchema),
    defaultValues: {
      title: "",
      message: "",
      isGlobal: true,
      targetUserIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertNotification) => {
      await apiRequest("POST", "/api/notifications", data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo thông báo mới",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      handleClose();
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
        description: "Không thể tạo thông báo",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setSelectedUserIds([]);
    onClose();
  };

  const onSubmit = (data: InsertNotification) => {
    // Validate user selection for non-global notifications
    if (!data.isGlobal && selectedUserIds.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một người dùng để gửi thông báo",
        variant: "destructive",
      });
      return;
    }

    // Include selected users if not global
    const submissionData = {
      ...data,
      targetUserIds: data.isGlobal ? [] : selectedUserIds,
    };
    createMutation.mutate(submissionData);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const removeUser = (userId: string) => {
    setSelectedUserIds(prev => prev.filter(id => id !== userId));
  };

  const isGlobal = form.watch("isGlobal");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="modal-create-notification">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            Tạo thông báo mới
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Tạo thông báo mới để gửi đến người dùng trong hệ thống.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Cập nhật tài liệu mới"
                      data-testid="input-notification-title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nội dung thông báo..."
                      rows={4}
                      data-testid="input-notification-message"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isGlobal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          setSelectedUserIds([]);
                        }
                      }}
                      data-testid="checkbox-notification-global"
                      className="bg-background border-2 border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Gửi cho tất cả người dùng
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Thông báo sẽ được gửi cho tất cả người dùng trong hệ thống
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* User Selection - Only show when not global */}
            {!isGlobal && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Chọn người dùng nhận thông báo</label>
                </div>
                
                {usersLoading ? (
                  <div className="text-sm text-muted-foreground">Đang tải danh sách người dùng...</div>
                ) : (
                  <div className="space-y-3">
                    <Select onValueChange={handleUserSelect} data-testid="select-users">
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn người dùng..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(user => !selectedUserIds.includes(user.id)).map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center space-x-2">
                              <span>{user.firstName} {user.lastName}</span>
                              <span className="text-xs text-muted-foreground">({user.email})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Selected users display */}
                    {selectedUserIds.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Người dùng đã chọn ({selectedUserIds.length}):</div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {selectedUserIds.map((userId) => {
                            const user = users.find(u => u.id === userId);
                            return user ? (
                              <Badge
                                key={userId}
                                variant="secondary"
                                className="flex items-center space-x-1"
                                data-testid={`badge-user-${userId}`}
                              >
                                <span>{user.firstName} {user.lastName}</span>
                                <button
                                  type="button"
                                  onClick={() => removeUser(userId)}
                                  className="ml-1 hover:text-destructive"
                                  data-testid={`button-remove-user-${userId}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {selectedUserIds.length === 0 && (
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        Vui lòng chọn ít nhất một người dùng để gửi thông báo
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
                className="bg-orange-600 hover:bg-orange-700 text-white border border-orange-600 hover:border-orange-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium"
              >
                {createMutation.isPending ? "Đang gửi..." : "Tạo thông báo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
