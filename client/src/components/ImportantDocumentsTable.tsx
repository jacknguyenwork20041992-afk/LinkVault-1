import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit, Trash2, Plus, ExternalLink, FileText, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ImportantDocument } from "@/types";

const formSchema = z.object({
  title: z.string().min(1, "Tên tài liệu không được để trống"),
  description: z.string().optional(),
  url: z.string().url("URL không hợp lệ"),
});

type FormData = z.infer<typeof formSchema>;

export default function ImportantDocumentsTable() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<ImportantDocument | null>(null);

  const { data: importantDocuments = [], isLoading } = useQuery<ImportantDocument[]>({
    queryKey: ["/api/important-documents"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/important-documents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/important-documents"] });
      setIsCreateOpen(false);
      toast({
        title: "Thành công",
        description: "Tài liệu quan trọng đã được tạo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo tài liệu quan trọng",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      return await apiRequest("PUT", `/api/important-documents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/important-documents"] });
      setEditingDocument(null);
      toast({
        title: "Thành công",
        description: "Tài liệu quan trọng đã được cập nhật",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật tài liệu quan trọng",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/important-documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/important-documents"] });
      toast({
        title: "Thành công",
        description: "Tài liệu quan trọng đã được xóa",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa tài liệu quan trọng",
        variant: "destructive",
      });
    },
  });

  const filteredDocuments = importantDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DocumentForm = ({ document }: { document?: ImportantDocument }) => {
    const form = useForm<FormData>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: document?.title || "",
        description: document?.description || "",
        url: document?.url || "",
      },
    });

    const onSubmit = (data: FormData) => {
      if (document) {
        updateMutation.mutate({ id: document.id, data });
      } else {
        createMutation.mutate(data);
      }
    };

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">Tên tài liệu *</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="Nhập tên tài liệu quan trọng"
            data-testid="input-title"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Nhập mô tả cho tài liệu"
            rows={3}
            data-testid="textarea-description"
          />
        </div>

        <div>
          <Label htmlFor="url">Đường dẫn *</Label>
          <Input
            id="url"
            type="url"
            {...form.register("url")}
            placeholder="https://..."
            data-testid="input-url"
          />
          {form.formState.errors.url && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.url.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateOpen(false);
              setEditingDocument(null);
            }}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            data-testid="button-cancel"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 px-6 py-2"
            data-testid="button-submit"
          >
            {(createMutation.isPending || updateMutation.isPending) ? "Đang xử lý..." : (document ? "Cập nhật" : "Tạo mới")}
          </Button>
        </div>
      </form>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
            <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Tài liệu quan trọng</h2>
            <p className="text-muted-foreground">{importantDocuments.length} tài liệu</p>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white" data-testid="button-create-important-document">
              <Plus className="h-4 w-4 mr-2" />
              Thêm tài liệu quan trọng
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo tài liệu quan trọng mới</DialogTitle>
            </DialogHeader>
            <DocumentForm document={undefined} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm tài liệu quan trọng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-important-documents"
          />
        </div>
        {searchTerm && (
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            data-testid="button-clear-search"
          >
            <X className="h-4 w-4 mr-2" />
            Xóa tìm kiếm
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tài liệu</TableHead>
              <TableHead>Đường dẫn</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "Không tìm thấy tài liệu nào" : "Chưa có tài liệu quan trọng nào"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((document) => (
                <TableRow key={document.id} data-testid={`row-important-document-${document.id}`}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{document.title}</div>
                      {document.description && (
                        <div className="text-sm text-muted-foreground">{document.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                      data-testid={`link-important-document-${document.id}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Xem tài liệu
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {document.createdAt ? new Date(document.createdAt).toLocaleDateString("vi-VN") : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Dialog
                        open={editingDocument?.id === document.id}
                        onOpenChange={(open) => setEditingDocument(open ? document : null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-edit-important-document-${document.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Chỉnh sửa tài liệu quan trọng</DialogTitle>
                          </DialogHeader>
                          <DocumentForm document={document} />
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Bạn có chắc muốn xóa tài liệu này?")) {
                            deleteMutation.mutate(document.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-important-document-${document.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}