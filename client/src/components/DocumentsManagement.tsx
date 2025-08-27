import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, Trash2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateDocumentModal from "@/components/modals/CreateDocumentModal";
import BulkCreateDocumentModal from "@/components/modals/BulkCreateDocumentModal";
import { apiRequest } from "@/lib/queryClient";
import type { Document, Category, Program } from "@shared/schema";

export default function DocumentsManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<(Document & { category: Category | null, program: Program | null }) | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/documents"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa tài liệu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
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
        description: "Không thể xóa tài liệu",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (document: Document & { category: Category | null, program: Program | null }) => {
    setEditingDocument(document);
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingDocument(null);
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return "fa-file-alt";
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "fa-file-pdf";
      case "doc":
      case "docx":
        return "fa-file-word";
      case "xls":
      case "xlsx":
        return "fa-file-excel";
      case "ppt":
      case "pptx":
        return "fa-file-powerpoint";
      default:
        return "fa-file-alt";
    }
  };

  const getFileIconColor = (fileType?: string) => {
    if (!fileType) return "text-muted-foreground";
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "text-destructive";
      case "doc":
      case "docx":
        return "text-primary";
      case "xls":
      case "xlsx":
        return "text-accent";
      case "ppt":
      case "pptx":
        return "text-orange-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Quản lý tài liệu</h3>
        <Button 
          onClick={() => setIsBulkCreateModalOpen(true)}
          className="bg-primary text-primary-foreground"
          data-testid="button-bulk-create-documents"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm tài liệu
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Chưa có tài liệu nào</p>
          <Button 
            onClick={() => setIsBulkCreateModalOpen(true)}
            className="mt-4"
            variant="outline"
          >
            Thêm tài liệu đầu tiên
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Tài liệu</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Chương trình</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Danh mục</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Cập nhật</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document: Document & { category: Category | null, program: Program | null }) => (
                  <tr key={document.id} className="border-t border-border hover:bg-muted/20" data-testid={`row-document-${document.id}`}>
                    <td className="py-3 px-6">
                      <div className="flex items-center">
                        <i className={`fas ${getFileIcon(document.fileType)} ${getFileIconColor(document.fileType)} mr-3`}></i>
                        <div>
                          <span className="font-medium text-foreground">{document.title}</span>
                          {document.description && (
                            <p className="text-xs text-muted-foreground">{document.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-muted-foreground">{document.program?.name || "N/A"}</td>
                    <td className="py-3 px-6 text-muted-foreground">{document.category?.name || "N/A"}</td>
                    <td className="py-3 px-6 text-muted-foreground">
                      {new Date(document.updatedAt!).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center space-x-2">
                        <a
                          href={document.googleDriveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors"
                          data-testid={`link-document-${document.id}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(document)}
                          data-testid={`button-edit-${document.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(document.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${document.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateDocumentModal 
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        editingDocument={editingDocument}
      />
      
      <BulkCreateDocumentModal
        isOpen={isBulkCreateModalOpen}
        onClose={() => setIsBulkCreateModalOpen(false)}
      />
    </div>
  );
}
