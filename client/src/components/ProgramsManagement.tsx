import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, Trash2, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CreateProgramModal from "@/components/modals/CreateProgramModal";
import { apiRequest } from "@/lib/queryClient";
import type { Program } from "@shared/schema";

export default function ProgramsManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/programs"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/programs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa chương trình",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
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
        description: "Không thể xóa chương trình",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa chương trình này?")) {
      deleteMutation.mutate(id);
    }
  };


  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingProgram(null);
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
        <h3 className="text-lg font-semibold text-foreground">Quản lý chương trình</h3>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 rounded-xl font-medium"
          data-testid="button-create-program"
        >
          <Plus className="h-5 w-5 mr-2" />
          Thêm chương trình
        </Button>
      </div>

      {programs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Book className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Chưa có chương trình nào</p>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4"
            variant="outline"
          >
            Thêm chương trình đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program: Program) => (
            <Card key={program.id} data-testid={`card-program-${program.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                    <Book className="text-primary text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{program.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {program.curriculum && (
                        <Badge className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                          📚 {program.curriculum}
                        </Badge>
                      )}
                      {program.ageRange && (
                        <Badge className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          👥 {program.ageRange}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {program.description && (
                  <p className="text-sm text-muted-foreground mb-4">{program.description}</p>
                )}

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(program)}
                    data-testid={`button-edit-${program.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(program.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${program.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProgramModal 
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        editingProgram={editingProgram}
      />
    </div>
  );
}
