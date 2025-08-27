import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Book, FileText, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProgramDetails() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
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

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "cơ bản":
        return "bg-accent/10 text-accent";
      case "trung cấp":
        return "bg-primary/10 text-primary";
      case "nâng cao":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-secondary/10 text-secondary-foreground";
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
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mr-6">
                <Book className="text-primary text-2xl" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">{program.name}</h1>
                <Badge className={`text-sm px-3 py-1 rounded-full ${getLevelColor(program.level)}`}>
                  {program.level}
                </Badge>
              </div>
            </div>
            
            {program.description && (
              <p className="text-muted-foreground text-lg">{program.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Documents Section */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center">
            <FileText className="text-primary mr-3" />
            Tài liệu chương trình ({documents.length})
          </h2>

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
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Tài liệu</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Danh mục</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Cập nhật</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-foreground">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((document: any) => (
                        <tr key={document.id} className="border-t border-border hover:bg-muted/20" data-testid={`row-document-${document.id}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <i className={`fas ${getFileIcon(document.fileType)} ${getFileIconColor(document.fileType)} mr-3 text-lg`}></i>
                              <div>
                                <div className="font-medium text-foreground">{document.title}</div>
                                {document.description && (
                                  <div className="text-sm text-muted-foreground">{document.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">{document.category?.name || "N/A"}</td>
                          <td className="py-4 px-6 text-muted-foreground">
                            {new Date(document.updatedAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="py-4 px-6">
                            <a
                              href={document.googleDriveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                              data-testid={`link-document-${document.id}`}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Mở
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}