import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, ExternalLink, FileText, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const branchOptions = [
  "Bờ Bao Tân Thắng",
  "Tỉnh Lộ 10", 
  "Huỳnh Thiện Lộc",
  "Gamuda",
  "Hà Huy Tập",
  "Nguyễn Văn Lương",
  "Bùi Đình Túy",
  "Hồng Hà",
  "Đại Thanh",
  "Ocean Park",
  "Nguyễn Tri Phương",
  "Phú Đông",
  "Thủ Dầu Một"
];

const accountRequestSchema = z.object({
  branchName: z.string().min(1, "Vui lòng chọn chi nhánh"),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  requestType: z.enum(["new_account", "un_tag_account"], {
    required_error: "Vui lòng chọn loại yêu cầu",
  }),
  fileRequired: z.boolean().refine(val => val === true, {
    message: "Vui lòng upload file danh sách học viên Excel",
  }),
});

type AccountRequestForm = z.infer<typeof accountRequestSchema>;

interface AccountRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountRequestModal({ isOpen, onClose }: AccountRequestModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFile, setUploadedFile] = useState<{ name: string } | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const form = useForm<AccountRequestForm>({
    resolver: zodResolver(accountRequestSchema),
    defaultValues: {
      branchName: "",
      email: "",
      requestType: "new_account",
      fileRequired: false,
    },
  });

  const watchRequestType = form.watch("requestType");

  const createAccountRequestMutation = useMutation({
    mutationFn: async (data: AccountRequestForm & { fileName?: string; fileUrl?: string }) => {
      await apiRequest("POST", "/api/account-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Yêu cầu tài khoản đã được gửi thành công. Chúng tôi sẽ xử lý và phản hồi sớm nhất có thể.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/account-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      form.reset();
      setUploadedFile(null);
      setUploadedFileUrl(null);
      form.setValue('fileRequired', false);
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Create account request error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi yêu cầu. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AccountRequestForm) => {
    // Kiểm tra tất cả thông tin bắt buộc
    if (!data.branchName) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn chi nhánh",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.email) {
      toast({
        title: "Thiếu thông tin", 
        description: "Vui lòng nhập email",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.requestType) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn loại yêu cầu",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedFile || !uploadedFileUrl) {
      toast({
        title: "Thiếu file",
        description: "Vui lòng upload file danh sách học viên Excel trước khi gửi yêu cầu.",
        variant: "destructive",
      });
      return;
    }

    // Create account request with uploaded file
    createAccountRequestMutation.mutate({
      ...data,
      fileName: uploadedFile.name,
      fileUrl: uploadedFileUrl,
    });
  };

  const handleGetUploadParameters = async () => {
    try {
      const response: any = await apiRequest("POST", "/api/account-requests/upload-url", {});
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      throw error;
    }
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      const uploadUrl = file.uploadURL || "";
      setUploadedFileUrl(uploadUrl);
      // Set file info from the uploaded result
      if (file.meta && typeof file.meta === 'object' && 'name' in file.meta) {
        setUploadedFile({ name: (file.meta as any).name });
      } else if (file.name) {
        setUploadedFile({ name: file.name });
      }
      // Update form validation - clear the error
      form.setValue('fileRequired', true);
      form.clearErrors('fileRequired');
      toast({
        title: "Thành công", 
        description: "File đã được upload thành công",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Kiểm tra định dạng file Excel
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "File không hợp lệ",
          description: "Chỉ được phép upload file Excel (.xlsx, .xls)",
          variant: "destructive",
        });
        event.target.value = ""; // Reset input
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const getTemplateLink = () => {
    return watchRequestType === "new_account" 
      ? "https://drive.google.com/file/d/1ltGDhyXRZdYT4KkCwg-W5F4tlAT_4bMZ/view?usp=sharing"
      : "https://drive.google.com/file/d/1JKigfBgHWkpLY9vFyPyNc_3wXdraJQQ8/view?usp=sharing";
  };

  const getRequestTypeLabel = () => {
    return watchRequestType === "new_account" 
      ? "CUNG CẤP TÀI KHOẢN MỚI"
      : "RESET TÀI KHOẢN ĐỂ CÓ THỂ ĐĂNG NHẬP TRÊN MỘT THIẾT BỊ KHÁC";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-900 to-purple-700 bg-clip-text text-transparent">
            <FileText className="h-6 w-6 text-blue-600" />
            Request for Student Accounts (SWE Program)
          </DialogTitle>
          <DialogDescription>
            Gửi yêu cầu tạo tài khoản học viên cho chương trình SWE
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Chi nhánh */}
            <FormField
              control={form.control}
              name="branchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chi nhánh <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-branch">
                        <SelectValue placeholder="Chọn chi nhánh" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branchOptions.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Nhập địa chỉ email"
                      {...field}
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loại yêu cầu */}
            <FormField
              control={form.control}
              name="requestType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Chọn loại yêu cầu <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new_account" id="new_account" data-testid="radio-new-account" />
                        <Label htmlFor="new_account" className="font-medium">
                          NEW ACCOUNT: CUNG CẤP TÀI KHOẢN MỚI
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="un_tag_account" id="un_tag_account" data-testid="radio-un-tag-account" />
                        <Label htmlFor="un_tag_account" className="font-medium">
                          UN-TAG ACCOUNT: RESET TÀI KHOẢN ĐỂ CÓ THỂ ĐĂNG NHẬP TRÊN MỘT THIẾT BỊ KHÁC
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hướng dẫn upload file */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-semibold">VUI LÒNG UPLOAD FILE DANH SÁCH HỌC VIÊN:</p>
                  
                  <div className="space-y-2">
                    <p className="font-medium">*** BƯỚC 1:</p>
                    <div className="flex items-center gap-2">
                      <span>TẢI MẪU DANH SÁCH HỌC VIÊN TẠI LINK:</span>
                      <a 
                        href={getTemplateLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Tải mẫu
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">*** BƯỚC 2:</p>
                    <p>ĐIỀN THÔNG TIN VÀO FILE VỪA TẢI VỀ VÀ UPLOAD VÀO FORM NÀY (Add file)</p>
                  </div>

                  <p className="text-sm text-amber-700 font-medium">
                    (LƯU Ý: CHỈ NHẬP VÀO KHU VỰC ĐƯỢC BÔI VÀNG & KHÔNG DELETE SHEET "LEVEL")
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* File Upload */}
            <FormField
              control={form.control}
              name="fileRequired"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Upload file danh sách học viên <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors bg-gray-50/50">
                        <div className="space-y-3">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                          <div>
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={10485760} // 10MB
                              allowedFileTypes={[
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                'application/vnd.ms-excel',
                                '.xlsx',
                                '.xls'
                              ]}
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={handleUploadComplete}
                              buttonClassName="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                            >
                              <span>Chọn file Excel</span>
                            </ObjectUploader>
                            <p className="text-sm text-gray-500 mt-2">
                              Hoặc kéo thả file vào đây
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-3">
                          Chỉ chấp nhận file .xlsx và .xls (tối đa 10MB)
                        </p>
                      </div>
                      {uploadedFile && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-700 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">File đã upload:</span> {uploadedFile.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button 
                type="submit" 
                variant="default"
                disabled={createAccountRequestMutation.isPending}
                data-testid="button-submit-account-request"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createAccountRequestMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}