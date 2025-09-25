import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle } from "lucide-react";

interface DocumentUploaderProps {
  onComplete?: (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => void;
  buttonClassName?: string;
  children?: ReactNode;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  maxNumberOfFiles?: number;
}

/**
 * Component for uploading documents to train AI knowledge base
 * Supports PDF, Word, Excel, PowerPoint files
 */
export function DocumentUploader({
  onComplete,
  buttonClassName,
  children,
  allowedFileTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  maxFileSize = 50485760, // 50MB default
  maxNumberOfFiles = 5,
}: DocumentUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file) => {
          console.log("Getting upload parameters for:", file.name);
          const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;
          const response = await fetch(API_BASE_URL + "/api/objects/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });
          
          if (!response.ok) {
            throw new Error("Failed to get upload URL");
          }
          
          const data = await response.json();
          return {
            method: "PUT" as const,
            url: data.uploadURL,
          };
        },
      })
      .on("upload", () => {
        setUploading(true);
        setUploadSuccess(false);
      })
      .on("complete", (result) => {
        setUploading(false);
        setUploadSuccess(true);
        console.log("Upload complete:", result);
        onComplete?.(result);
        
        // Auto close modal after success
        setTimeout(() => {
          setShowModal(false);
          setUploadSuccess(false);
        }, 2000);
      })
      .on("error", (error) => {
        setUploading(false);
        setUploadSuccess(false);
        console.error("Upload error:", error);
      })
  );

  return (
    <div>
      <Button 
        onClick={() => setShowModal(true)} 
        className={`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${buttonClassName}`}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Đang upload...
          </>
        ) : uploadSuccess ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Upload thành công!
          </>
        ) : (
          <>
            {children || (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload tài liệu
              </>
            )}
          </>
        )}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        plugins={['Dashboard']}
        metaFields={[
          { id: 'description', name: 'Mô tả tài liệu', placeholder: 'Mô tả ngắn gọn về nội dung tài liệu' },
        ]}
        note="Hỗ trợ file PDF, Word, Excel, PowerPoint. Tối đa 50MB mỗi file."
        locale={{
          strings: {
            // Customize text
            dropPasteFiles: 'Kéo thả file vào đây hoặc %{browseFiles}',
            browseFiles: 'chọn file',
            uploadComplete: 'Upload hoàn thành',
            uploadPaused: 'Upload tạm dừng',
            resumeUpload: 'Tiếp tục upload',
            pauseUpload: 'Tạm dừng upload',
            retryUpload: 'Thử lại',
            cancelUpload: 'Hủy upload',
            xFilesSelected: {
              0: '%{smart_count} file đã chọn',
              1: '%{smart_count} file đã chọn',
            },
            uploadingXFiles: {
              0: 'Đang upload %{smart_count} file',
              1: 'Đang upload %{smart_count} file',
            },
            processingXFiles: {
              0: 'Đang xử lý %{smart_count} file',
              1: 'Đang xử lý %{smart_count} file',
            },
          },
        }}
      />
    </div>
  );
}