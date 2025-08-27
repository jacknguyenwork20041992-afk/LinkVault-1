import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertDocumentSchema, type InsertDocument, type Document, type Category, type Program } from "@shared/schema";
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

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDocument?: (Document & { category: Category | null, program: Program | null }) | null;
}

export default function CreateDocumentModal({
  isOpen,
  onClose,
  editingDocument,
}: CreateDocumentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!editingDocument;

  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs"],
    retry: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const form = useForm<InsertDocument>({
    resolver: zodResolver(insertDocumentSchema),
    defaultValues: {
      title: "",
      description: "",
      googleDriveLink: "",
      fileType: "",
      categoryId: "",
      programId: "",
    },
  });

  const selectedProgramId = form.watch("programId");

  // Filter categories based on selected program
  const filteredCategories = categories.filter((category: Category & { program: Program }) => 
    !selectedProgramId || category.programId === selectedProgramId
  );

  const createMutation = useMutation({
    mutationFn: async (data: InsertDocument) => {
      if (isEditing) {
        await apiRequest("PUT", `/api/documents/${editingDocument.id}`, data);
      } else {
        await apiRequest("POST", "/api/documents", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: isEditing ? "Đã cập nhật tài liệu" : "Đã tạo tài liệu mới",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/recent"] });
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
        description: isEditing ? "Không thể cập nhật tài liệu" : "Không thể tạo tài liệu",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: InsertDocument) => {
    createMutation.mutate(data);
  };

  useEffect(() => {
    if (isEditing && editingDocument) {
      form.reset({
        title: editingDocument.title,
        description: editingDocument.description || "",
        googleDriveLink: editingDocument.googleDriveLink,
        fileType: editingDocument.fileType || "",
        categoryId: editingDocument.categoryId || "",
        programId: editingDocument.programId || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        googleDriveLink: "",
        fileType: "",
        categoryId: "",
        programId: "",
      });
    }
  }, [editingDocument, isEditing, form]);

  // Reset category when program changes
  useEffect(() => {
    if (selectedProgramId && !isEditing) {
      form.setValue("categoryId", "");
    }
  }, [selectedProgramId, form, isEditing]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" data-testid="modal-create-document">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            {isEditing ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề tài liệu</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Bài 1: Chào hỏi cơ bản"
                      data-testid="input-document-title"
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
                      placeholder="Mô tả về tài liệu..."
                      rows={3}
                      data-testid="input-document-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="googleDriveLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Google Drive</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://drive.google.com/..."
                      data-testid="input-document-link"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fileType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại file</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-document-type">
                        <SelectValue placeholder="Chọn loại file" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="doc">Word Document</SelectItem>
                      <SelectItem value="docx">Word Document (docx)</SelectItem>
                      <SelectItem value="xls">Excel Spreadsheet</SelectItem>
                      <SelectItem value="xlsx">Excel Spreadsheet (xlsx)</SelectItem>
                      <SelectItem value="ppt">PowerPoint</SelectItem>
                      <SelectItem value="pptx">PowerPoint (pptx)</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-document-program">
                        <SelectValue placeholder="Chọn chương trình" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {programs.map((program: Program) => (
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

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Danh mục</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-document-category">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((category: Category & { program: Program }) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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
              >
                {createMutation.isPending
                  ? "Đang xử lý..."
                  : isEditing
                  ? "Cập nhật"
                  : "Thêm tài liệu"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
