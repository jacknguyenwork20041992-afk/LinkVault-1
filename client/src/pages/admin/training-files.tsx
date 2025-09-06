import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Download, RotateCcw, Trash2, AlertCircle, CheckCircle, Clock, Upload } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TrainingFile } from "@/types";

const statusConfig = {
  processing: {
    icon: Clock,
    color: "bg-yellow-500",
    text: "Đang xử lý",
    variant: "default" as const,
  },
  completed: {
    icon: CheckCircle,
    color: "bg-green-500",
    text: "Hoàn thành",
    variant: "default" as const,
  },
  failed: {
    icon: AlertCircle,
    color: "bg-red-500",
    text: "Thất bại",
    variant: "destructive" as const,
  },
};

export default function TrainingFilesPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<TrainingFile | null>(null);

  const { data: trainingFiles = [], isLoading } = useQuery<TrainingFile[]>({
    queryKey: ["/api/training-files"],
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/training-files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-files"] });
      toast({
        title: "Thành công",
        description: "Đã xóa file training",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reprocessFileMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/training-files/${id}/reprocess`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-files"] });
      toast({
        title: "Thành công",
        description: "Đã bắt đầu xử lý lại file",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', '');

    try {
      const response = await fetch('/api/training-files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      queryClient.invalidateQueries({ queryKey: ["/api/training-files"] });
      
      toast({
        title: "Upload thành công",
        description: "File đã được upload và đang được xử lý để train AI",
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xử lý file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📋';
      default:
        return '📄';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Quản lý File Training AI
          </h1>
          <p className="text-muted-foreground">
            Upload và quản lý file để train AI knowledge base
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={handleFileUpload}
            className="hidden"
            id="training-file-upload"
            data-testid="input-training-file"
          />
          <Button 
            onClick={() => document.getElementById('training-file-upload')?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            data-testid="button-upload-training-file"
          >
            <Upload className="h-4 w-4" />
            Upload File Training
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Danh sách File Training ({trainingFiles.length})
            </CardTitle>
            <CardDescription>
              Các file được upload để train AI system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trainingFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có file training nào</p>
                <p className="text-sm text-gray-400 mt-2">
                  Upload file PDF, Word, Excel hoặc PowerPoint để bắt đầu
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {trainingFiles.map((file) => {
                  const statusInfo = statusConfig[file.status as keyof typeof statusConfig];
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      data-testid={`training-file-${file.id}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl">
                          {getFileIcon(file.fileType)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {file.originalName}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span>{file.fileType.toUpperCase()}</span>
                            <span>
                              {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          
                          {file.metadata?.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {file.metadata.description}
                            </p>
                          )}
                          
                          {file.status === 'failed' && file.metadata?.error && (
                            <p className="text-sm text-red-600 mt-1">
                              Lỗi: {file.metadata.error}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.text}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {file.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reprocessFileMutation.mutate(file.id)}
                            disabled={reprocessFileMutation.isPending}
                            data-testid={`reprocess-${file.id}`}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFile(file)}
                          data-testid={`view-${file.id}`}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteFileMutation.mutate(file.id)}
                          disabled={deleteFileMutation.isPending}
                          data-testid={`delete-${file.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Details Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Chi tiết File Training</h2>
              <Button variant="ghost" onClick={() => setSelectedFile(null)}>
                ✕
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tên file</label>
                    <p className="text-gray-900 dark:text-white">{selectedFile.originalName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Kích thước</label>
                    <p className="text-gray-900 dark:text-white">{formatFileSize(selectedFile.fileSize)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Loại file</label>
                    <p className="text-gray-900 dark:text-white">{selectedFile.fileType.toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const statusInfo = statusConfig[selectedFile.status as keyof typeof statusConfig];
                        const StatusIcon = statusInfo.icon;
                        return (
                          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.text}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                {selectedFile.extractedContent && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nội dung đã trích xuất</label>
                    <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap text-gray-900 dark:text-white">
                        {selectedFile.extractedContent.substring(0, 2000)}
                        {selectedFile.extractedContent.length > 2000 && '...'}
                      </pre>
                    </div>
                  </div>
                )}
                
                {selectedFile.metadata && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Metadata</label>
                    <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <pre className="text-sm text-gray-900 dark:text-white">
                        {JSON.stringify(selectedFile.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}