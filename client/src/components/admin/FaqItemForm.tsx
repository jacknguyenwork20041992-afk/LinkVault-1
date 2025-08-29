import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { X } from "lucide-react";

const formSchema = z.object({
  categoryId: z.string().min(1, "Danh mục là bắt buộc"),
  question: z.string().min(1, "Câu hỏi là bắt buộc"),
  answer: z.string().min(1, "Câu trả lời là bắt buộc"),
  keywords: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

type KnowledgeCategory = {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
  createdAt: Date;
};

type FaqItem = {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  keywords?: string[];
  category?: KnowledgeCategory;
  createdAt: Date;
};

interface FaqItemFormProps {
  faq?: FaqItem | null;
  categories: KnowledgeCategory[];
  onClose: () => void;
}

export default function FaqItemForm({ faq, categories, onClose }: FaqItemFormProps) {
  const { toast } = useToast();
  const [keywordInput, setKeywordInput] = useState("");
  const isEditing = !!faq;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: faq?.categoryId || "",
      question: faq?.question || "",
      answer: faq?.answer || "",
      keywords: faq?.keywords || [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = isEditing
        ? `/api/knowledge/faqs/${faq.id}`
        : "/api/knowledge/faqs";
      const method = isEditing ? "PUT" : "POST";
      
      await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/faqs"] });
      toast({
        title: "Thành công",
        description: isEditing ? "Đã cập nhật câu hỏi" : "Đã tạo câu hỏi mới",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu câu hỏi",
        variant: "destructive",
      });
    },
  });

  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      const currentKeywords = form.getValues("keywords") || [];
      if (!currentKeywords.includes(keywordInput.trim())) {
        form.setValue("keywords", [...currentKeywords, keywordInput.trim()]);
      }
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    const currentKeywords = form.getValues("keywords") || [];
    form.setValue("keywords", currentKeywords.filter(k => k !== keyword));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa Câu hỏi FAQ" : "Thêm Câu hỏi FAQ mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Danh mục *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-faq-category">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Câu hỏi *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập câu hỏi thường gặp..."
                      className="min-h-[80px]"
                      {...field}
                      data-testid="input-faq-question"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Câu trả lời *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập câu trả lời chi tiết..."
                      className="min-h-[120px]"
                      {...field}
                      data-testid="input-faq-answer"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Từ khóa</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập từ khóa"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyPress={handleKeywordKeyPress}
                          data-testid="input-faq-keyword"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddKeyword}
                          data-testid="button-add-faq-keyword"
                        >
                          Thêm
                        </Button>
                      </div>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((keyword, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {keyword}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveKeyword(keyword)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                data-testid="button-save-faq"
              >
                {mutation.isPending ? "Đang lưu..." : (isEditing ? "Cập nhật" : "Tạo mới")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}