import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ExternalLink } from "lucide-react";
import type { Document, Category, Program } from "@shared/schema";

interface DocumentTableProps {
  documents: (Document & { category: Category | null, program: Program | null })[];
}

export default function DocumentTable({ documents }: DocumentTableProps) {
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

  const handleDocumentClick = (document: Document & { category: Category | null, program: Program | null }, linkDescription: string) => {
    console.log("Document click tracked:", document.title, linkDescription);
    trackActivityMutation.mutate({
      type: "document_click",
      description: `Đã xem tài liệu: ${document.title} - ${linkDescription}`,
      metadata: {
        documentId: document.id,
        documentTitle: document.title,
        program: document.program?.name,
        category: document.category?.name,
        linkDescription: linkDescription,
      }
    });
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

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ExternalLink className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Chưa có tài liệu nào</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Tài liệu</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Chương trình</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Khóa học</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Cập nhật</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-foreground">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id} className="border-t border-border hover:bg-muted/20" data-testid={`row-document-${document.id}`}>
                <td className="py-3 px-6">
                  <div className="flex items-center">
                    <i className={`fas ${getFileIcon(document.fileType || undefined)} ${getFileIconColor(document.fileType || undefined)} mr-3`}></i>
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
                  <div className="flex flex-wrap gap-2">
                    {((document as any).links || []).map((link: any, index: number) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleDocumentClick(document, link.description)}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md text-xs font-medium transition-all duration-200"
                        data-testid={`link-document-${document.id}-${index}`}
                        title={link.description}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
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
  );
}
