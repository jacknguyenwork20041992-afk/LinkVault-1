import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertCategorySchema, type InsertCategory, type Category, type Program } from "@shared/schema";
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

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: (Category & { program: Program }) | null;
}

export default function CreateCategoryModal({
  isOpen,
  onClose,
  editingCategory,
}: CreateCategoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!editingCategory;

  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs"],
    retry: false,
  });

  const form = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      programId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      if (isEditing) {
        await apiRequest("PUT", `/api/categories/${editingCategory.id}`, data);
      } else {
        await apiRequest("POST", "/api/categories", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: isEditing ? "Đã cập nhật danh mục" : "Đã tạo danh mục mới",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
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
        description: isEditing ? "Không thể cập nhật danh mục" : "Không thể tạo danh mục",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: InsertCategory) => {
    createMutation.mutate(data);
  };

  useEffect(() => {
    if (isEditing && editingCategory) {
      form.reset({
        name: editingCategory.name,
        description: editingCategory.description || "",
        programId: editingCategory.programId || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        programId: "",
      });
    }
  }, [editingCategory, isEditing, form]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="modal-create-category">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            {isEditing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
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
            {isEditing ? "Cập nhật thông tin danh mục" : "Điền thông tin để tạo danh mục mới"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên danh mục</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Bài học, Bài tập, Từ vựng"
                      data-testid="input-category-name"
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
                      placeholder="Mô tả về danh mục..."
                      rows={3}
                      data-testid="input-category-description"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="programId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chương trình</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category-program">
                        <SelectValue placeholder="Chọn chương trình" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(programs as Program[]).map((program: Program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
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
                className="bg-green-600 hover:bg-green-700 text-white border border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium"
              >
                {createMutation.isPending
                  ? "Đang xử lý..."
                  : isEditing
                  ? "Cập nhật"
                  : "Thêm danh mục"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
