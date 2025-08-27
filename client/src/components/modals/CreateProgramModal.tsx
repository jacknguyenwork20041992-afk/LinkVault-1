import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertProgramSchema, type InsertProgram, type Program } from "@shared/schema";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProgram?: Program | null;
}

export default function CreateProgramModal({
  isOpen,
  onClose,
  editingProgram,
}: CreateProgramModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!editingProgram;

  const form = useForm<InsertProgram>({
    resolver: zodResolver(insertProgramSchema),
    defaultValues: {
      name: "",
      description: "",
      level: "Cơ bản",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProgram) => {
      if (isEditing) {
        await apiRequest("PUT", `/api/programs/${editingProgram.id}`, data);
      } else {
        await apiRequest("POST", "/api/programs", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: isEditing ? "Đã cập nhật chương trình" : "Đã tạo chương trình mới",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
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
        description: isEditing ? "Không thể cập nhật chương trình" : "Không thể tạo chương trình",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: InsertProgram) => {
    createMutation.mutate(data);
  };

  useEffect(() => {
    if (isEditing && editingProgram) {
      form.reset({
        name: editingProgram.name,
        description: editingProgram.description || "",
        level: editingProgram.level,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        level: "Cơ bản",
      });
    }
  }, [editingProgram, isEditing, form]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="modal-create-program">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            {isEditing ? "Chỉnh sửa chương trình" : "Thêm chương trình mới"}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên chương trình</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Tiếng Anh Trung Cấp"
                      data-testid="input-program-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả về chương trình..."
                      rows={3}
                      data-testid="input-program-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cấp độ</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-program-level">
                        <SelectValue placeholder="Chọn cấp độ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cơ bản">Cơ bản</SelectItem>
                      <SelectItem value="Trung cấp">Trung cấp</SelectItem>
                      <SelectItem value="Nâng cao">Nâng cao</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
              >
                {createMutation.isPending
                  ? "Đang xử lý..."
                  : isEditing
                  ? "Cập nhật"
                  : "Thêm chương trình"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
