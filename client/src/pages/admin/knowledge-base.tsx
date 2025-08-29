import { useState, lazy, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, BookOpen, HelpCircle, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
// Knowledge Base form components
const KnowledgeCategoryForm = lazy(() => import("@/components/admin/KnowledgeCategoryForm"));
const KnowledgeArticleForm = lazy(() => import("@/components/admin/KnowledgeArticleForm"));
const FaqItemForm = lazy(() => import("@/components/admin/FaqItemForm"));

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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Danh mục Kiến thức</h2>
            <Button 
              onClick={() => setShowCategoryForm(true)}
              data-testid="button-add-category"
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Bài viết Kiến thức</h2>
            <Button 
              onClick={() => setShowArticleForm(true)}
              data-testid="button-add-article"
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Câu hỏi Thường gặp</h2>
            <Button 
              onClick={() => setShowFaqForm(true)}
              data-testid="button-add-faq"
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
      <Suspense fallback={<div>Loading...</div>}>
        {showCategoryForm && (
          <KnowledgeCategoryForm
            category={selectedCategory}
            onClose={handleCloseForm}
          />
        )}

        {showArticleForm && (
          <KnowledgeArticleForm
            article={selectedArticle}
            categories={categories}
            onClose={handleCloseForm}
          />
        )}

        {showFaqForm && (
          <FaqItemForm
            faq={selectedFaq}
            categories={categories}
            onClose={handleCloseForm}
          />
        )}
      </Suspense>
    </div>
  );
}