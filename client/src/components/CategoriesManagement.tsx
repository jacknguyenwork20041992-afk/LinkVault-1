import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, Trash2, Tags, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CreateCategoryModal from "@/components/modals/CreateCategoryModal";
import { apiRequest } from "@/lib/queryClient";
import type { Category, Program } from "@shared/schema";

export default function CategoriesManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<(Category & { program: Program }) | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa danh mục",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Lỗi",
        description: "Không thể xóa danh mục",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (category: Category & { program: Program }) => {
    setEditingCategory(category);
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingCategory(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Quản lý danh mục</h3>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-primary-foreground"
          data-testid="button-create-category"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Tags className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Chưa có danh mục nào</p>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4"
            variant="outline"
          >
            Thêm danh mục đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category: Category & { program: Program }) => (
            <Card key={category.id} data-testid={`card-category-${category.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mr-4">
                    <Tags className="text-accent text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{category.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      <Book className="h-3 w-3 mr-1" />
                      {category.program.name}
                    </Badge>
                  </div>
                </div>

                {category.description && (
                  <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                )}

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(category)}
                    data-testid={`button-edit-${category.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${category.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateCategoryModal 
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        editingCategory={editingCategory}
      />
    </div>
  );
}
