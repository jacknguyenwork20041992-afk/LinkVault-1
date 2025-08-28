import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Book, FileText, ExternalLink, Download, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProgramDetails() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Activity tracking mutation
  const trackActivityMutation = useMutation({
    mutationFn: async (data: { type: string; description: string; metadata?: any }) => {
      console.log("Sending activity track request:", data);
      return apiRequest("POST", "/api/activities/track", data);
    },
    onSuccess: (data) => {
      console.log("Activity tracked successfully:", data);
    },
    onError: (error) => {
      console.error("Activity tracking failed:", error);
    },
  });

  const handleDocumentClick = (document: any, linkDescription: string) => {
    console.log("Document click tracked:", document.title, linkDescription);
    trackActivityMutation.mutate({
      type: "document_click",
      description: `Đã xem tài liệu: ${document.title} - ${linkDescription}`,
      metadata: {
        documentId: document.id,
        documentTitle: document.title,
        program: program?.name,
        category: document.category?.name,
        linkDescription: linkDescription,
      }
    });
  };
  
  // Extract program ID from URL
  const programId = location.split('/')[2]; // /program/:id

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: program, isLoading: programLoading } = useQuery<any>({
    queryKey: ["/api/programs", programId],
    enabled: !!programId && isAuthenticated,
    retry: false,
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<any[]>({
    queryKey: ["/api/programs", programId, "documents"],
    enabled: !!programId && isAuthenticated,
    retry: false,
  });

  // Filter documents based on search and category
  const filteredDocuments = documents.filter((document: any) => {
    const matchesSearch = 
      document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "all" || 
      document.category?.name === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter dropdown
  const availableCategories = Array.from(
    new Set(documents.map((doc: any) => doc.category?.name || "Không có khóa học"))
  ).sort();

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "cơ bản":
        return "bg-gradient-to-r from-green-100 to-green-50 text-green-700 dark:from-green-900/20 dark:to-green-800/20 dark:text-green-400";
      case "trung cấp":
        return "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-400";
      case "nâng cao":
        return "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 dark:from-purple-900/20 dark:to-purple-800/20 dark:text-purple-400";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 dark:from-gray-800/20 dark:to-gray-700/20 dark:text-gray-400";
    }
  };

  const getFileIcon = (fileType: string | null) => {
    switch (fileType?.toLowerCase()) {
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
        return "fa-file";
    }
  };

  const getFileIconColor = (fileType: string | null) => {
    switch (fileType?.toLowerCase()) {
      case "pdf":
        return "text-red-500";
      case "doc":
      case "docx":
        return "text-blue-500";
      case "xls":
      case "xlsx":
        return "text-green-500";
      case "ppt":
      case "pptx":
        return "text-orange-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (isLoading || programLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Không tìm thấy chương trình</h1>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Trang chủ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Program Info */}
        <div className="modern-card mb-6">
          <div className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg flex items-center justify-center mr-4">
                <Book className="text-blue-600 dark:text-blue-400 h-6 w-6" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-1">{program.name}</h1>
                <div className="flex items-center gap-3">
                  <Badge className={`text-xs px-3 py-1 rounded-full ${getLevelColor(program.level)} border-0`}>
                    {program.level}
                  </Badge>
                  {program.description && (
                    <span className="text-muted-foreground text-sm">{program.description}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div>
          {/* Compact Header with Search */}
          <div className="modern-card p-4 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Tài liệu chương trình</h2>
                  <p className="text-muted-foreground text-sm">{documents.length} tài liệu có sẵn</p>
                </div>
              </div>
              
              {/* Inline Search and Filter */}
              {documents.length > 0 && (
                <div className="flex gap-3 items-center">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Tìm kiếm tài liệu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9 text-sm"
                      data-testid="input-search-documents"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[160px] h-9 text-sm" data-testid="select-category-filter">
                      <Filter className="h-4 w-4 mr-2 text-green-600" />
                      <SelectValue placeholder="Lọc theo khóa học" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả khóa học</SelectItem>
                      {availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {(searchTerm || selectedCategory !== "all") && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearFilters}
                      className="h-9"
                      data-testid="button-clear-filters"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Xóa
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {documentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="mx-auto h-16 w-16 mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">Chưa có tài liệu</h3>
                <p className="text-muted-foreground">Chương trình này chưa có tài liệu nào được tải lên.</p>
              </CardContent>
            </Card>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 inline-block mb-4">
                <Search className="h-12 w-12 text-green-600 dark:text-green-400 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Không tìm thấy tài liệu</h3>
              <p className="text-muted-foreground mb-4">Không có tài liệu nào phù hợp với tiêu chí tìm kiếm</p>
              <Button onClick={clearFilters} variant="outline">
                Xóa bộ lọc
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                // Group filtered documents by category
                const groupedDocuments = filteredDocuments.reduce((groups: any, document: any) => {
                  const categoryName = document.category?.name || "Không có khóa học";
                  if (!groups[categoryName]) {
                    groups[categoryName] = [];
                  }
                  groups[categoryName].push(document);
                  return groups;
                }, {});

                return Object.entries(groupedDocuments).map(([categoryName, categoryDocuments]: [string, any]) => (
                  <div key={categoryName} className="modern-card hover-lift">
                    <div className="p-0">
                      <div className="p-6 border-b border-border bg-gradient-to-r from-green-50/50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/10">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30">
                            <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">{categoryName}</h3>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {categoryDocuments.length} tài liệu
                          </Badge>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/30">
                            <tr>
                              <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Tài liệu</th>
                              <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Cập nhật</th>
                              <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryDocuments.map((document: any) => (
                              <tr key={document.id} className="border-t border-border hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors duration-200" data-testid={`row-document-${document.id}`}>
                                <td className="py-4 px-6">
                                  <div className="flex items-center space-x-4">
                                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                                      <i className={`fas ${getFileIcon(document.fileType)} ${getFileIconColor(document.fileType)} text-lg`}></i>
                                    </div>
                                    <div>
                                      <div className="font-medium text-foreground text-sm">{document.title}</div>
                                      {document.description && (
                                        <div className="text-xs text-muted-foreground leading-relaxed mt-1">{document.description}</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-muted-foreground text-sm">
                                  {new Date(document.updatedAt).toLocaleDateString("vi-VN")}
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex flex-wrap gap-2">
                                    {((document as any).links || []).map((link: any, linkIndex: number) => (
                                      <a
                                        key={linkIndex}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => handleDocumentClick(document, link.description)}
                                        className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg text-sm font-medium transition-all duration-200"
                                        data-testid={`link-document-${document.id}-${linkIndex}`}
                                        title={link.description}
                                      >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        {link.description}
                                      </a>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}