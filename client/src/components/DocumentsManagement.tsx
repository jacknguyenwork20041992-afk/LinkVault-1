import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, Trash2, FileText, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateDocumentModal from "@/components/modals/CreateDocumentModal";
import BulkCreateDocumentModal from "@/components/modals/BulkCreateDocumentModal";
import { apiRequest } from "@/lib/queryClient";
import type { Document, Category, Program } from "@shared/schema";

export default function DocumentsManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<(Document & { category: Category | null, program: Program | null }) | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/documents"],
    retry: false,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
    retry: false,
  });

  // Filter và search logic
  const filteredDocuments = documents.filter((document: Document & { category: Category | null, program: Program | null }) => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.program?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || document.category?.id === selectedCategory;
    const matchesProgram = selectedProgram === "all" || document.program?.id === selectedProgram;
    
    return matchesSearch && matchesCategory && matchesProgram;
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

      {/* Search và Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-documents"
          />
        </div>
        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
          <SelectTrigger className="w-[200px]" data-testid="select-program-filter">
            <SelectValue placeholder="Lọc theo chương trình" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chương trình</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
            <SelectValue placeholder="Lọc theo khóa học" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khóa học</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Không tìm thấy tài liệu nào</p>
          <Button 
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
              setSelectedProgram("all");
            }}
            className="mt-4"
            variant="outline"
          >
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(
            filteredDocuments.reduce((acc: Record<string, (Document & { category: Category | null, program: Program | null })[]>, document) => {
              const categoryName = document.category?.name || "Chưa phân loại";
              if (!acc[categoryName]) acc[categoryName] = [];
              acc[categoryName].push(document);
              return acc;
            }, {})
          ).map(([categoryName, categoryDocuments]) => (
            <div key={categoryName} className="space-y-4">
              <div className="flex items-center border-b border-border pb-2">
                <FileText className="text-primary mr-2 h-5 w-5" />
                <h4 className="text-lg font-semibold text-foreground">{categoryName}</h4>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {categoryDocuments.length} tài liệu
                </Badge>
                {categoryDocuments[0]?.program && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {categoryDocuments[0].program.name}
                  </Badge>
                )}
              </div>
              <div className="bg-card rounded-lg shadow-sm border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left py-2 px-4 text-xs font-medium text-foreground">Tài liệu</th>
                        <th className="text-left py-2 px-4 text-xs font-medium text-foreground">Cập nhật</th>
                        <th className="text-left py-2 px-4 text-xs font-medium text-foreground">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryDocuments.map((document) => (
                        <tr key={document.id} className="border-t border-border hover:bg-muted/20" data-testid={`row-document-${document.id}`}>
                          <td className="py-2 px-4">
                            <div className="flex items-center">
                              <i className={`fas ${getFileIcon(document.fileType || undefined)} ${getFileIconColor(document.fileType || undefined)} mr-3 text-sm`}></i>
                              <div>
                                <span className="font-medium text-foreground text-sm">{document.title}</span>
                                {document.description && (
                                  <p className="text-xs text-muted-foreground">{document.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4 text-muted-foreground text-xs">
                            {new Date(document.updatedAt!).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center space-x-1">
                              <a
                                href={document.googleDriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 transition-colors p-1"
                                data-testid={`link-document-${document.id}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEdit(document)}
                                data-testid={`button-edit-${document.id}`}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(document.id)}
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-${document.id}`}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
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
