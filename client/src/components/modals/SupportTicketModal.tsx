import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertSupportTicketSchema, type InsertSupportTicket } from "@shared/schema";
import { X, Upload, FileImage, Calendar, MapPin, GraduationCap, FileText, Link } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const supportTicketFormSchema = insertSupportTicketSchema.omit({
  userId: true,
});

type SupportTicketFormData = z.infer<typeof supportTicketFormSchema>;

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentLink?: string;
}

const branches = [
  "Bờ Bao Tân Thắng",
  "Tỉnh Lộ 10",
  "Huỳnh Thiện Lộc",
  "Nguyễn Văn Lương",
  "Bùi Đình Túy",
  "Hồng Hà",
  "Đại Thanh",
  "Gamuda",
  "Ocean Park",
  "Hà Huy Tập",
  "Nguyễn Tri Phương",
  "Phú Đông",
  "Thủ Dầu Một",
];

const classLevels = [
  "Sun 1", "Sun 2", "Sun 3", "Sun 4",
  "Mercury 1", "Mercury 2", "Mercury 3", "Mercury 4",
  "Venus 1", "Venus 2", "Venus 3", "Venus 4",
  "Earth 1", "Earth 2", "Earth 3", "Earth 4",
  "Mars 1", "Mars 2", "Mars 3", "Mars 4",
  "Jupiter 1", "Jupiter 2", "Jupiter 3", "Jupiter 4",
  "Saturn 1", "Saturn 2", "Saturn 3", "Saturn 4",
  "Moon A-1", "Moon A-2", "Moon A-3", "Moon A-4",
  "Moon B-1", "Moon B-2", "Moon B-3", "Moon B-4",
  "Uranus 1", "Uranus 2", "Uranus 3", "Uranus 4",
  "Neptune 1", "Neptune 2", "Neptune 3", "Neptune 4",
  "PG1", "PG2",
  "GS1", "GS2", "GS3", "GS4", "GS5", "GS6",
  "GM1", "GM2", "GM3", "GM4", "GM5",
  "GF1", "GF2", "GF3", "GF4", "GF5",
  "OT1", "OT2", "OT3", "OT4", "OT5", "OT6", "OT7", "OT8",
  "OP1", "OP2", "OP3", "OP4", "OP5", "OP6", "OP7", "OP8", "OP9",
  "PU1", "PU2",
  "UE1", "UE2", "UE3", "UE4",
  "UP1", "UP2", "UP3", "UP4",
  "UA1", "UA2", "UA3", "UA4",
];

export default function SupportTicketModal({
  isOpen,
  onClose,
  documentLink,
}: SupportTicketModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SupportTicketFormData>({
    resolver: zodResolver(supportTicketFormSchema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      branch: "",
      classLevel: "",
      description: "",
      documentLink: documentLink || "",
      imageUrls: [],
      status: "open",
      priority: "normal",
    },
  });

  // Reset form when modal opens/closes or documentLink changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        issueDate: new Date().toISOString().split('T')[0],
        branch: "",
        classLevel: "",
        description: "",
        documentLink: documentLink || "",
        imageUrls: [],
        status: "open",
        priority: "normal",
      });
      setSelectedImages([]);
      setImagePreviews([]);
    }
  }, [isOpen, documentLink, form]);

  const createMutation = useMutation({
    mutationFn: async (data: SupportTicketFormData) => {
      let imageUrls: string[] = [];
      
      // Upload images if selected
      if (selectedImages.length > 0) {
        try {
          console.log(`Uploading ${selectedImages.length} images...`);
          
          for (let i = 0; i < selectedImages.length; i++) {
            const image = selectedImages[i];
            console.log(`Getting upload URL for image ${i + 1}...`);
            
            // Get upload URL from backend
            const uploadResponse = await apiRequest("POST", "/api/objects/upload");
            
            // Check if object storage is available
            if (uploadResponse.status === 503) {
              console.warn("Object storage not available, proceeding without images");
              // Show warning to user but continue
              toast({
                title: "Thông báo",
                description: "Không thể tải hình ảnh lên. Yêu cầu sẽ được gửi mà không có hình ảnh.",
              });
              break; // Skip image upload
            }
            
            if (!uploadResponse.ok) {
              console.error("Failed to get upload URL:", uploadResponse.status);
              throw new Error(`Failed to get upload URL: ${uploadResponse.status}`);
            }
            
            const responseData = await uploadResponse.json();
            const { uploadURL } = responseData;
            
            // Upload image to object storage
            console.log(`Uploading image ${i + 1} to storage...`);
            const uploadResult = await fetch(uploadURL, {
              method: "PUT",
              body: image,
              headers: {
                "Content-Type": image.type,
              },
            });
            
            if (!uploadResult.ok) {
              const errorText = await uploadResult.text();
              console.error(`Upload failed for image ${i + 1}:`, errorText);
              throw new Error(`Failed to upload image ${i + 1}: ${uploadResult.status}`);
            }
            
            const imageUrl = uploadURL ? uploadURL.split("?")[0] : "";
            imageUrls.push(imageUrl);
            console.log(`Image ${i + 1} uploaded successfully:`, imageUrl);
          }
        } catch (error: unknown) {
          console.error("Error uploading images:", error);
          
          // Only throw error for critical failures, not for object storage unavailability
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("503") || errorMessage.includes("Object storage not configured")) {
            // Object storage unavailable - continue without images
            console.warn("Continuing without image upload due to service unavailability");
          } else {
            throw error;
          }
        }
      }
      
      // Create support ticket
      const requestData = {
        ...data,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };
      console.log("Creating support ticket with data:", requestData);
      await apiRequest("POST", "/api/support-tickets", requestData);
      console.log("Support ticket created successfully");
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã gửi yêu cầu hỗ trợ. Chúng tôi sẽ phản hồi sớm nhất có thể.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets"] });
      // Invalidate admin cache để admin thấy ticket mới
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      // Invalidate notifications để admin bell update ngay lập tức
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      handleClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Chưa đăng nhập",
          description: "Vui lòng đăng nhập lại...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Create support ticket error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Check maximum 5 images
    if (selectedImages.length + files.length > 5) {
      toast({
        title: "Lỗi",
        description: "Tối đa 5 hình ảnh được phép upload",
        variant: "destructive",
      });
      return;
    }
    
    const validFiles: File[] = [];
    const newPreviews: string[] = [];
    
    for (const file of files) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: `File ${file.name} vượt quá 10MB`,
          variant: "destructive",
        });
        continue;
      }
      
      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Lỗi",
          description: `File ${file.name} không phải hình ảnh`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }
    
    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedImages([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const onSubmit = (data: SupportTicketFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <FileText className="h-6 w-6 text-blue-600" />
            Gửi yêu cầu hỗ trợ
          </DialogTitle>
          <DialogDescription>
            Vui lòng điền thông tin chi tiết để chúng tôi có thể hỗ trợ bạn tốt nhất
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      Ngày gặp vấn đề
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        data-testid="input-issue-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      Chi nhánh
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-branch">
                          <SelectValue placeholder="Chọn chi nhánh" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
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
            </div>

            <FormField
              control={form.control}
              name="classLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    Cấp độ lớp học
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-class-level">
                        <SelectValue placeholder="Chọn cấp độ lớp học" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {classLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-500" />
                    Mô tả vấn đề
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-yellow-500" />
                    Link tài liệu bị vấn đề (không bắt buộc)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      value={field.value || ""}
                      data-testid="input-document-link"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <FileImage className="h-4 w-4 text-indigo-500" />
                Upload hình ảnh vấn đề (tối đa 5 ảnh)
              </label>
              
              {imagePreviews.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg shadow-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                          {selectedImages[index]?.name.substring(0, 15)}...
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {selectedImages.length}/5 hình ảnh
                    </span>
                    {selectedImages.length < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-add-more-images"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Thêm ảnh
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeAllImages}
                      data-testid="button-remove-all-images"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Xóa tất cả
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-upload-images"
                      >
                        Chọn hình ảnh
                      </button>
                      <p className="text-sm text-gray-500">hoặc kéo thả file vào đây</p>
                    </div>
                    <p className="text-xs text-gray-400">PNG, JPG, GIF tối đa 10MB mỗi file - Tối đa 5 ảnh</p>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                data-testid="input-file-upload"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending}
                data-testid="button-cancel"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                data-testid="button-submit"
              >
                {createMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi...
                  </div>
                ) : (
                  "Gửi yêu cầu"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}