import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertNotificationSchema, type InsertNotification } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { X } from "lucide-react";
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
  const { user } = useAuth();

  const form = useForm<InsertNotification>({
    resolver: zodResolver(insertNotificationSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "info",
      isGlobal: true,
      createdBy: user?.id || "",
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
    onClose();
  };

  const onSubmit = (data: InsertNotification) => {
    // Set createdBy to current user ID
    const submissionData = {
      ...data,
      createdBy: user?.id || "",
    };
    createMutation.mutate(submissionData);
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
                      data-testid="input-notification-content"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại thông báo</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} data-testid="select-notification-type">
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại thông báo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Thông tin</SelectItem>
                        <SelectItem value="warning">Cảnh báo</SelectItem>
                        <SelectItem value="success">Thành công</SelectItem>
                        <SelectItem value="urgent">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isGlobal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 border border-border rounded-lg p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-notification-global"
                      className="border-2 border-gray-400 bg-white data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 data-[state=checked]:text-white"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">
                      Gửi cho tất cả người dùng
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Thông báo sẽ được gửi cho tất cả người dùng trong hệ thống
                    </p>
                  </div>
                </FormItem>
              )}
            />


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
