import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertProgramSchema, type InsertProgram, type Program } from "@/types";
import { X, Book, GraduationCap, Globe, Lightbulb, Target, Award, Heart, Star, Sparkles, Zap, Users, Rocket, Trophy } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Icon options for programs
const iconOptions = [
  { value: "Book", label: "📚 Sách", icon: Book },
  { value: "GraduationCap", label: "🎓 Mũ tốt nghiệp", icon: GraduationCap },
  { value: "Globe", label: "🌍 Địa cầu", icon: Globe },
  { value: "Lightbulb", label: "💡 Bóng đèn", icon: Lightbulb },
  { value: "Target", label: "🎯 Mục tiêu", icon: Target },
  { value: "Award", label: "🏆 Giải thưởng", icon: Award },
  { value: "Heart", label: "❤️ Trái tim", icon: Heart },
  { value: "Star", label: "⭐ Ngôi sao", icon: Star },
  { value: "Sparkles", label: "✨ Lấp lánh", icon: Sparkles },
  { value: "Zap", label: "⚡ Tia chớp", icon: Zap },
  { value: "Users", label: "👥 Người dùng", icon: Users },
  { value: "Rocket", label: "🚀 Tên lửa", icon: Rocket },
  { value: "Trophy", label: "🏆 Cúp", icon: Trophy },
];

// Color scheme options
const colorOptions = [
  { value: "blue", label: "Xanh dương", gradient: "from-blue-500 to-blue-600" },
  { value: "green", label: "Xanh lá", gradient: "from-green-500 to-green-600" },
  { value: "purple", label: "Tím", gradient: "from-purple-500 to-purple-600" },
  { value: "red", label: "Đỏ", gradient: "from-red-500 to-red-600" },
  { value: "orange", label: "Cam", gradient: "from-orange-500 to-orange-600" },
  { value: "yellow", label: "Vàng", gradient: "from-yellow-500 to-yellow-600" },
  { value: "pink", label: "Hồng", gradient: "from-pink-500 to-pink-600" },
  { value: "indigo", label: "Chàm", gradient: "from-indigo-500 to-indigo-600" },
  { value: "teal", label: "Xanh ngọc", gradient: "from-teal-500 to-teal-600" },
  { value: "cyan", label: "Lam", gradient: "from-cyan-500 to-cyan-600" },
];

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
    // Temporarily remove schema validation to test
    // resolver: zodResolver(insertProgramSchema),
    defaultValues: {
      name: "",
      description: "",
      curriculum: "",
      ageRange: "",
      iconName: "Book",
      colorScheme: "blue",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProgram) => {
      console.log("🚀 Form data being sent:", data);
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
        curriculum: editingProgram.curriculum,
        ageRange: editingProgram.ageRange,
        iconName: editingProgram.iconName || "Book",
        colorScheme: editingProgram.colorScheme || "blue",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        curriculum: "",
        ageRange: "",
        iconName: "Book",
        colorScheme: "blue",
      });
    }
  }, [editingProgram, isEditing, form]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="modal-create-program">
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
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="curriculum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giáo trình</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Face2Face, English File, New Headway..."
                      data-testid="input-program-curriculum"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ageRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Độ tuổi</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: 3-6 tuổi, 7-12 tuổi, 13-17 tuổi, 18+ tuổi..."
                      data-testid="input-program-age-range"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon Selection */}
            <FormField
              control={form.control}
              name={"iconName" as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biểu tượng</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value || "Book"} 
                      onValueChange={field.onChange}
                      data-testid="select-program-icon"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn biểu tượng" />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center space-x-2">
                                <IconComponent className="h-4 w-4" />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Selection */}
            <FormField
              control={form.control}
              name={"colorScheme" as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Màu sắc</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value || "blue"} 
                      onValueChange={field.onChange}
                      data-testid="select-program-color"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn màu sắc" />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className={`w-4 h-4 rounded-full bg-gradient-to-r ${option.gradient}`}
                              />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 hover:border-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium"
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
