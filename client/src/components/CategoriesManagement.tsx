import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, Trash2, Tags, Book, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateCategoryModal from "@/components/modals/CreateCategoryModal";
import BulkCreateCategoryModal from "@/components/modals/BulkCreateCategoryModal";
import { apiRequest } from "@/lib/queryClient";
import type { Category, Program } from "@shared/schema";

export default function CategoriesManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<(Category & { program: Program }) | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
    retry: false,
  });

  // Filter và search logic
  const filteredCategories = categories.filter((category: Category & { program: Program }) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.program.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = selectedProgram === "all" || category.program.id === selectedProgram;
    
    return matchesSearch && matchesProgram;
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa khóa học",
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
        description: "Không thể xóa khóa học",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (category: Category & { program: Program }) => {
    setEditingCategory(category);
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa khóa học này?")) {
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
        <h3 className="text-lg font-semibold text-foreground">Quản lý khóa học</h3>
        <Button 
          onClick={() => setIsBulkCreateModalOpen(true)}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 rounded-xl font-medium"
          data-testid="button-bulk-create-categories"
        >
          <Plus className="h-5 w-5 mr-2" />
          Thêm khóa học
        </Button>
      </div>

      {/* Search và Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-categories"
          />
        </div>
        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
          <SelectTrigger className="w-[200px]" data-testid="select-program-filter">
            <SelectValue placeholder="Lọc theo chương trình" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chương trình</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.id}>
                {program.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Tags className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Chưa có khóa học nào</p>
          <Button 
            onClick={() => setIsBulkCreateModalOpen(true)}
            className="mt-4"
            variant="outline"
          >
            Thêm khóa học đầu tiên
          </Button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Không tìm thấy khóa học nào</p>
          <Button 
            onClick={() => {
              setSearchTerm("");
              setSelectedProgram("all");
            }}
            className="mt-4"
            variant="outline"
          >
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(
            filteredCategories.reduce((acc: Record<string, (Category & { program: Program })[]>, category) => {
              const programName = category.program.name;
              if (!acc[programName]) acc[programName] = [];
              acc[programName].push(category);
              return acc;
            }, {})
          ).map(([programName, programCategories]) => (
            <div key={programName} className="space-y-4">
              <div className="flex items-center border-b border-border pb-2">
                <Book className="text-primary mr-2 h-5 w-5" />
                <h4 className="text-lg font-semibold text-foreground">{programName}</h4>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {programCategories.length} khóa học
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-6">
                {programCategories.map((category) => (
                  <Card key={category.id} data-testid={`card-category-${category.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mr-3">
                          <Tags className="text-accent text-lg" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-sm">{category.name}</h3>
                        </div>
                      </div>

                      {category.description && (
                        <p className="text-xs text-muted-foreground mb-3">{category.description}</p>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(category)}
                          data-testid={`button-edit-${category.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${category.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCategoryModal 
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        editingCategory={editingCategory}
      />
      
      <BulkCreateCategoryModal
        isOpen={isBulkCreateModalOpen}
        onClose={() => setIsBulkCreateModalOpen(false)}
      />
    </div>
  );
}
