import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertDocumentSchema, documentLinkSchema, type InsertDocument, type Document, type Category, type Program } from "@shared/schema";
import { z } from "zod";
import { X, Plus, Trash2 } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";

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

  const documentValidationSchema = insertDocumentSchema.extend({
    title: z.string().min(1, "Tiêu đề là bắt buộc"),
    programId: z.string().min(1, "Chương trình là bắt buộc"),
    categoryId: z.string().min(1, "Khóa học là bắt buộc"),
  });

  const form = useForm<InsertDocument>({
    resolver: zodResolver(documentValidationSchema),
    defaultValues: {
      title: "",
      description: "",
      links: [{ url: "", description: "" }],
      fileType: "",
      categoryId: "",
      programId: "",
    },
  });

  const selectedProgramId = form.watch("programId");

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "links",
  });

  // Filter categories based on selected program
  const filteredCategories = (categories as Category[]).filter((category: Category) => 
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
        links: (editingDocument as any).links || [{ url: "", description: "" }],
        fileType: editingDocument.fileType || "",
        categoryId: editingDocument.categoryId || "",
        programId: editingDocument.programId || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        links: [{ url: "", description: "" }],
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
          <DialogDescription>
            {isEditing ? "Cập nhật thông tin tài liệu" : "Điền thông tin để tạo tài liệu mới"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề tài liệu *</FormLabel>
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
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Links Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <FormLabel>Links tài liệu *</FormLabel>
                <Button
                  type="button"
                  onClick={() => append({ url: "", description: "" })}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-add-link"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm link
                </Button>
              </div>
              
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-sm">Link #{index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                            data-testid={`button-remove-link-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name={`links.${index}.url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://drive.google.com/..."
                                  data-testid={`input-link-url-${index}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`links.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mô tả link</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ví dụ: Tài liệu chính, Bài tập, Video hướng dẫn..."
                                  data-testid={`input-link-description-${index}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="fileType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại file</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
                  <FormLabel>Chương trình *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-document-program">
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

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Khóa học *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-document-category">
                        <SelectValue placeholder="Chọn khóa học" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((category) => (
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
                className="bg-green-600 hover:bg-green-700 text-white border border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium"
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
