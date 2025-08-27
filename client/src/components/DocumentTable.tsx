import { ExternalLink } from "lucide-react";
import type { Document, Category, Program } from "@shared/schema";

interface DocumentTableProps {
  documents: (Document & { category: Category | null, program: Program | null })[];
}

export default function DocumentTable({ documents }: DocumentTableProps) {
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
                  <a
                    href={document.googleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                    data-testid={`link-document-${document.id}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
