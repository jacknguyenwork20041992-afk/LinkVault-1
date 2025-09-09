import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Plus, Search, Edit, Trash2, Calendar, User, ExternalLink, Filter, ChevronDown, CheckCircle, Clock, Play, XCircle, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import CreateProjectModal from "@/components/modals/CreateProjectModal";
import EditProjectModal from "@/components/modals/EditProjectModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Project } from "@/types";

export default function ProjectsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const { data: projects = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/projects-with-tasks"],
    retry: false,
  });

  // Filter logic
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.assignee?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Status update mutations
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      await apiRequest("PATCH", `/api/projects/${projectId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects-with-tasks"] });
      toast({
        title: "Thành công",
        description: "Trạng thái dự án đã được cập nhật",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái dự án",
        variant: "destructive",
      });
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      await apiRequest("PATCH", `/api/tasks/${taskId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects-with-tasks"] });
      toast({
        title: "Thành công",
        description: "Trạng thái công việc đã được cập nhật",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái công việc",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects-with-tasks"] });
      toast({
        title: "Thành công",
        description: "Dự án đã được xóa thành công",
      });
      setProjectToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa dự án",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "todo": { label: "Chờ thực hiện", variant: "outline" as const, color: "text-gray-600", icon: Clock },
      "in_progress": { label: "Đang thực hiện", variant: "default" as const, color: "text-blue-600", icon: Play },
      "completed": { label: "Hoàn thành", variant: "secondary" as const, color: "text-green-600", icon: CheckCircle },
      "cancelled": { label: "Đã hủy", variant: "destructive" as const, color: "text-red-600", icon: XCircle },
    };
    
    const config = statusConfig[status] || statusConfig["todo"];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const StatusSelect = ({ 
    currentStatus, 
    onStatusChange, 
    type = "project" 
  }: { 
    currentStatus: string; 
    onStatusChange: (status: string) => void;
    type?: "project" | "task";
  }) => {
    const statusOptions = [
      { value: "todo", label: "Chờ thực hiện", icon: Clock },
      { value: "in_progress", label: "Đang thực hiện", icon: Play },
      { value: "completed", label: "Hoàn thành", icon: CheckCircle },
      { value: "cancelled", label: "Đã hủy", icon: XCircle },
    ];

    return (
      <Select value={currentStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center space-x-2">
                  <Icon className="h-3 w-3" />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Search and Filter */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <FolderOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý dự án</h1>
            <p className="text-muted-foreground mt-1">Theo dõi và quản lý các dự án của trung tâm</p>
          </div>
        </div>
        
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
          data-testid="button-create-project"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm dự án</span>
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="modern-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo tên, mô tả hoặc người thực hiện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 focus:border-blue-400 transition-colors duration-200"
              data-testid="input-search-projects"
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px] border-2 focus:border-blue-400 text-foreground" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2 text-blue-600" />
                <SelectValue placeholder="Lọc trạng thái" className="text-foreground" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border">
                <SelectItem value="all" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Tất cả trạng thái</SelectItem>
                <SelectItem value="todo" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Chờ làm</SelectItem>
                <SelectItem value="in_progress" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Đang làm</SelectItem>
                <SelectItem value="completed" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Hoàn thành</SelectItem>
                <SelectItem value="cancelled" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {projects.length === 0 ? (
            <>
              <FolderOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Chưa có dự án nào</p>
            </>
          ) : (
            <>
              <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Không tìm thấy dự án nào</p>
              <Button onClick={clearFilters} className="mt-4" variant="outline">
                Xóa bộ lọc
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredProjects.map((project) => {
            const isTasksExpanded = expandedTasks[project.id] || false;
            const toggleTasks = () => {
              setExpandedTasks(prev => ({
                ...prev,
                [project.id]: !prev[project.id]
              }));
            };
            
            return (
              <div key={project.id} className="modern-card hover-lift group" data-testid={`card-project-${project.id}`}>
                <div className="p-6">
                  {/* Project Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                        <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-blue-600 transition-colors duration-200">
                          {project.name}
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                          {getStatusBadge(project.status)}
                          <StatusSelect
                            currentStatus={project.status}
                            onStatusChange={(status) => 
                              updateProjectStatusMutation.mutate({ projectId: project.id, status })
                            }
                            type="project"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingProject(project)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                        data-testid={`button-edit-project-${project.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProjectToDelete(project)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                        data-testid={`button-delete-project-${project.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Project Overview */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Tổng quan dự án
                    </h4>
                    {project.description && (
                      <p className="text-muted-foreground text-sm mb-4 leading-relaxed bg-muted/20 p-3 rounded-lg">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-3 p-3 bg-muted/10 rounded-lg">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <span className="text-xs text-muted-foreground block">Project Leader</span>
                          <span className="text-sm font-medium text-foreground">{project.assignee}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-muted/10 rounded-lg">
                        <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <div>
                          <span className="text-xs text-muted-foreground block">Deadline</span>
                          <span className="text-sm font-medium text-foreground">
                            {new Date(project.deadline).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {project.link && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm"
                          data-testid={`link-project-${project.id}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          <span>Xem link dự án</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Tasks Section */}
                  <Collapsible open={isTasksExpanded} onOpenChange={toggleTasks}>
                    <div className="border-t border-border pt-4">
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between p-0 hover:bg-transparent"
                          data-testid={`button-toggle-tasks-${project.id}`}
                        >
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Phân công công việc ({project.tasks?.length || 0})
                          </h4>
                          {isTasksExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="space-y-3 mt-4">
                        {project.tasks && project.tasks.length > 0 ? (
                          project.tasks.map((task: any) => (
                            <div 
                              key={task.id} 
                              className="p-4 bg-muted/5 border border-border rounded-lg hover:bg-muted/10 transition-colors"
                              data-testid={`task-${task.id}`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h5 className="font-medium text-foreground mb-1">{task.name}</h5>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                                  )}
                                </div>
                                <StatusSelect
                                  currentStatus={task.status}
                                  onStatusChange={(status) => 
                                    updateTaskStatusMutation.mutate({ taskId: task.id, status })
                                  }
                                  type="task"
                                />
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="flex items-center space-x-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{task.assignee}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(task.deadline).toLocaleDateString("vi-VN")}
                                  </span>
                                </div>
                              </div>
                              
                              {task.link && (
                                <div className="mt-2">
                                  <a
                                    href={task.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-xs"
                                    data-testid={`link-task-${task.id}`}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    <span>Xem link</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <p className="text-sm">Chưa có công việc nào được phân công</p>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa dự án</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa dự án "{projectToDelete?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => projectToDelete && deleteProjectMutation.mutate(projectToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}