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
  email: z.string().email("Email không hợp lệ"),
  requestType: z.enum(["new_account", "un_tag_account"], {
    required_error: "Vui lòng chọn loại yêu cầu",
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const form = useForm<AccountRequestForm>({
    resolver: zodResolver(accountRequestSchema),
    defaultValues: {
      branchName: "",
      email: "",
      requestType: "new_account",
    },
  });

  const watchRequestType = form.watch("requestType");

  const createAccountRequestMutation = useMutation({
    mutationFn: async (data: AccountRequestForm & { fileName?: string; fileUrl?: string }) => {
      // For now, we'll handle file upload separately or simulate it
      await apiRequest("POST", "/api/account-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Yêu cầu tài khoản đã được gửi thành công. Chúng tôi sẽ xử lý và phản hồi sớm nhất có thể.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/account-requests"] });
      form.reset();
      setUploadedFile(null);
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
    if (!uploadedFile) {
      toast({
        title: "Thiếu file",
        description: "Vui lòng upload file danh sách học viên",
        variant: "destructive",
      });
      return;
    }

    // Simulate file upload - in real implementation, you'd upload to object storage first
    createAccountRequestMutation.mutate({
      ...data,
      fileName: uploadedFile.name,
      fileUrl: "simulated-url", // This would be the actual uploaded file URL
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
                  <FormLabel>Chi nhánh</FormLabel>
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
                  <FormLabel>Email</FormLabel>
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
                  <FormLabel>Chọn loại yêu cầu</FormLabel>
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
            <div className="space-y-3">
              <Label htmlFor="file-upload" className="text-sm font-medium">
                Upload file danh sách học viên
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  data-testid="input-file-upload"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              {uploadedFile && (
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  File đã chọn: {uploadedFile.name}
                </p>
              )}
            </div>

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