import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, BookOpen, HelpCircle, FolderOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type KnowledgeCategory = {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
  createdAt: Date;
};

type KnowledgeArticle = {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  keywords?: string[];
  category?: KnowledgeCategory;
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

export default function KnowledgeBasePage() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [showFaqForm, setShowFaqForm] = useState(false);

  // Fetch knowledge categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<KnowledgeCategory[]>({
    queryKey: ["/api/knowledge/categories"],
  });

  // Fetch knowledge articles
  const { data: articles = [], isLoading: articlesLoading } = useQuery<KnowledgeArticle[]>({
    queryKey: ["/api/knowledge/articles"],
  });

  // Fetch FAQ items
  const { data: faqs = [], isLoading: faqsLoading } = useQuery<FaqItem[]>({
    queryKey: ["/api/knowledge/faqs"],
  });

  // Delete mutations
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/knowledge/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/articles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/faqs"] });
      toast({
        title: "Thành công",
        description: "Đã xóa danh mục kiến thức",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa danh mục",
        variant: "destructive",
      });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/knowledge/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/articles"] });
      toast({
        title: "Thành công",
        description: "Đã xóa bài viết",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài viết",
        variant: "destructive",
      });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/knowledge/faqs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/faqs"] });
      toast({
        title: "Thành công",
        description: "Đã xóa câu hỏi thường gặp",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa câu hỏi",
        variant: "destructive",
      });
    },
  });

  const handleEditCategory = (category: KnowledgeCategory) => {
    setSelectedCategory(category);
    setShowCategoryForm(true);
  };

  const handleEditArticle = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setShowArticleForm(true);
  };

  const handleEditFaq = (faq: FaqItem) => {
    setSelectedFaq(faq);
    setShowFaqForm(true);
  };

  const handleCloseForm = () => {
    setShowCategoryForm(false);
    setShowArticleForm(false);
    setShowFaqForm(false);
    setSelectedCategory(null);
    setSelectedArticle(null);
    setSelectedFaq(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Cơ sở Kiến thức</h1>
          <p className="text-muted-foreground">
            Quản lý nội dung để huấn luyện AI chatbot thông minh hơn
          </p>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Danh mục ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Bài viết ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQ ({faqs.length})
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-semibold">Danh mục Kiến thức</h2>
            <Button 
              onClick={() => setShowCategoryForm(true)}
              data-testid="button-add-category"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm Danh mục
            </Button>
          </div>

          {categoriesLoading ? (
            <div>Đang tải...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          data-testid={`button-edit-category-${category.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                          data-testid={`button-delete-category-${category.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {category.keywords && category.keywords.length > 0 && (
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {category.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-semibold">Bài viết Kiến thức</h2>
            <Button 
              onClick={() => setShowArticleForm(true)}
              data-testid="button-add-article"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm Bài viết
            </Button>
          </div>

          {articlesLoading ? (
            <div>Đang tải...</div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{article.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {article.category?.name || "Không có danh mục"}
                          </Badge>
                          {article.keywords && article.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {article.keywords.map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditArticle(article)}
                          data-testid={`button-edit-article-${article.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteArticleMutation.mutate(article.id)}
                          data-testid={`button-delete-article-${article.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {article.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-semibold">Câu hỏi Thường gặp</h2>
            <Button 
              onClick={() => setShowFaqForm(true)}
              data-testid="button-add-faq"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm Câu hỏi
            </Button>
          </div>

          {faqsLoading ? (
            <div>Đang tải...</div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <Card key={faq.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {faq.category?.name || "Không có danh mục"}
                          </Badge>
                          {faq.keywords && faq.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {faq.keywords.map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFaq(faq)}
                          data-testid={`button-edit-faq-${faq.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFaqMutation.mutate(faq.id)}
                          data-testid={`button-delete-faq-${faq.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      <strong>Trả lời:</strong> {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {showCategoryForm && (
        <KnowledgeCategoryFormDialog
          category={selectedCategory}
          onClose={handleCloseForm}
        />
      )}

      {showArticleForm && (
        <KnowledgeArticleFormDialog
          article={selectedArticle}
          categories={categories}
          onClose={handleCloseForm}
        />
      )}

      {showFaqForm && (
        <FaqItemFormDialog
          faq={selectedFaq}
          categories={categories}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

// Inline Form Components for immediate functionality
const categoryFormSchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

function KnowledgeCategoryFormDialog({ category, onClose }: { category: KnowledgeCategory | null, onClose: () => void }) {
  const { toast } = useToast();
  const [keywordInput, setKeywordInput] = useState("");
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      keywords: category?.keywords || [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const url = isEditing
        ? `/api/knowledge/categories/${category!.id}`
        : "/api/knowledge/categories";
      const method = isEditing ? "PUT" : "POST";
      
      await apiRequest(method, url, data);
    },
    onSuccess: () => {
      // Force refresh all knowledge-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/categories"] });
      queryClient.refetchQueries({ queryKey: ["/api/knowledge/categories"] });
      
      toast({
        title: "Thành công",
        description: isEditing ? "Đã cập nhật danh mục" : "Đã tạo danh mục mới",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu danh mục",
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

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa Danh mục" : "Thêm Danh mục mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên danh mục *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên danh mục" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập mô tả danh mục"
                      className="min-h-[80px]"
                      {...field}
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
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddKeyword}
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
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px] disabled:opacity-50"
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

const articleFormSchema = z.object({
  categoryId: z.string().min(1, "Danh mục là bắt buộc"),
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  content: z.string().min(1, "Nội dung là bắt buộc"),
  keywords: z.array(z.string()).optional(),
});

type ArticleFormData = z.infer<typeof articleFormSchema>;

function KnowledgeArticleFormDialog({ 
  article, 
  categories, 
  onClose 
}: { 
  article: KnowledgeArticle | null;
  categories: KnowledgeCategory[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [keywordInput, setKeywordInput] = useState("");
  const isEditing = !!article;

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      categoryId: article?.categoryId || "",
      title: article?.title || "",
      content: article?.content || "",
      keywords: article?.keywords || [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const url = isEditing
        ? `/api/knowledge/articles/${article!.id}`
        : "/api/knowledge/articles";
      const method = isEditing ? "PUT" : "POST";
      
      await apiRequest(method, url, data);
    },
    onSuccess: () => {
      // Force refresh all knowledge-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/articles"] });
      queryClient.refetchQueries({ queryKey: ["/api/knowledge/articles"] });
      
      toast({
        title: "Thành công",
        description: isEditing ? "Đã cập nhật bài viết" : "Đã tạo bài viết mới",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu bài viết",
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

  const onSubmit = (data: ArticleFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh sửa Bài viết" : "Thêm Bài viết mới"}
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
                      <SelectTrigger>
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tiêu đề bài viết" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập nội dung bài viết chi tiết..."
                      className="min-h-[200px]"
                      {...field}
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
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddKeyword}
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
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px] disabled:opacity-50"
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

const faqFormSchema = z.object({
  categoryId: z.string().min(1, "Danh mục là bắt buộc"),
  question: z.string().min(1, "Câu hỏi là bắt buộc"),
  answer: z.string().min(1, "Câu trả lời là bắt buộc"),
  keywords: z.array(z.string()).optional(),
});

type FaqFormData = z.infer<typeof faqFormSchema>;

function FaqItemFormDialog({ 
  faq, 
  categories, 
  onClose 
}: { 
  faq: FaqItem | null;
  categories: KnowledgeCategory[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [keywordInput, setKeywordInput] = useState("");
  const isEditing = !!faq;

  const form = useForm<FaqFormData>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      categoryId: faq?.categoryId || "",
      question: faq?.question || "",
      answer: faq?.answer || "",
      keywords: faq?.keywords || [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FaqFormData) => {
      const url = isEditing
        ? `/api/knowledge/faqs/${faq!.id}`
        : "/api/knowledge/faqs";
      const method = isEditing ? "PUT" : "POST";
      
      await apiRequest(method, url, data);
    },
    onSuccess: () => {
      // Force refresh all knowledge-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge/faqs"] });
      queryClient.refetchQueries({ queryKey: ["/api/knowledge/faqs"] });
      
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

  const onSubmit = (data: FaqFormData) => {
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
                      <SelectTrigger>
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
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddKeyword}
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
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px] disabled:opacity-50"
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