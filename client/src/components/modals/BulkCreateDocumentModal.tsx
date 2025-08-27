import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  bulkCreateDocumentsSchema,
  type BulkCreateDocuments,
  type Program,
  type Category,
} from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BulkCreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkCreateDocumentModal({
  isOpen,
  onClose,
}: BulkCreateDocumentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: programs = [] } = useQuery({
    queryKey: ["/api/programs"],
    retry: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const form = useForm<BulkCreateDocuments>({
    resolver: zodResolver(bulkCreateDocumentsSchema),
    defaultValues: {
      documents: [
        {
          title: "",
          description: "",
          googleDriveLink: "",
          fileType: "",
          categoryId: "",
          programId: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "documents",
  });

  const createMutation = useMutation({
    mutationFn: async (data: BulkCreateDocuments) => {
      await apiRequest("POST", "/api/documents/bulk", data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo tất cả tài liệu mới",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/recent"] });
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
        description: "Không thể tạo tài liệu",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: BulkCreateDocuments) => {
    createMutation.mutate(data);
  };

  const addDocument = () => {
    append({
      title: "",
      description: "",
      googleDriveLink: "",
      fileType: "",
      categoryId: "",
      programId: "",
    });
  };

  const getFilteredCategories = (programId: string) => {
    return (categories as Category[]).filter((category: Category) => 
      !programId || category.programId === programId
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm nhiều tài liệu</DialogTitle>
          <DialogDescription>
            Tạo nhiều tài liệu cùng lúc bằng cách điền thông tin cho từng tài liệu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => {
                const selectedProgramId = form.watch(`documents.${index}.programId`) || "";
                const filteredCategories = getFilteredCategories(selectedProgramId);

                return (
                  <Card key={field.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold">Tài liệu #{index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                            data-testid={`button-remove-document-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`documents.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tiêu đề tài liệu</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ví dụ: Bài 1: Chào hỏi cơ bản"
                                  data-testid={`input-document-title-${index}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`documents.${index}.googleDriveLink`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Link Google Drive</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://drive.google.com/..."
                                  data-testid={`input-document-link-${index}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`documents.${index}.fileType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loại file</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-document-type-${index}`}>
                                    <SelectValue placeholder="Chọn loại file" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pdf">PDF</SelectItem>
                                  <SelectItem value="doc">DOC</SelectItem>
                                  <SelectItem value="docx">DOCX</SelectItem>
                                  <SelectItem value="xls">XLS</SelectItem>
                                  <SelectItem value="xlsx">XLSX</SelectItem>
                                  <SelectItem value="ppt">PPT</SelectItem>
                                  <SelectItem value="pptx">PPTX</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`documents.${index}.programId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chương trình</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                // Reset category when program changes
                                form.setValue(`documents.${index}.categoryId`, "");
                              }} defaultValue={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-document-program-${index}`}>
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
                          name={`documents.${index}.categoryId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Khóa học</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-document-category-${index}`}>
                                    <SelectValue placeholder="Chọn khóa học" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredCategories.map((category: Category) => (
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

                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`documents.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mô tả</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Mô tả về tài liệu..."
                                    rows={3}
                                    data-testid={`input-document-description-${index}`}
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center pt-4">
              <Button
                type="button"
                onClick={addDocument}
                data-testid="button-add-document"
                className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Thêm tài liệu
              </Button>
            </div>

            <DialogFooter className="flex justify-end space-x-3 pt-6 border-t">
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
                className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-600 hover:border-purple-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium"
              >
                {createMutation.isPending ? "Đang tạo..." : `Tạo ${fields.length} tài liệu`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}