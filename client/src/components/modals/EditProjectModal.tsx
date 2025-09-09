import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type InsertProject, type Project } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarIcon, Plus, Trash2, User, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProjectModal({ project, isOpen, onClose }: EditProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date(project.deadline));
  const [activeTab, setActiveTab] = useState("overview");
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    assigneeId: "",
    deadline: new Date(),
    link: ""
  });

  // Get project with tasks
  const { data: projectWithTasks } = useQuery({
    queryKey: ["/api/projects-with-tasks"],
    enabled: isOpen,
  });

  // Get all users for task assignment
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin-users"],
    enabled: isOpen,
  });

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || "",
      assigneeId: project.assigneeId,
      status: project.status,
      link: project.link || "",
    },
  });

  // Reset form when project changes
  useEffect(() => {
    form.reset({
      name: project.name,
      description: project.description || "",
      assigneeId: project.assigneeId,
      status: project.status,
      link: project.link || "",
    });
    setDate(new Date(project.deadline));
  }, [project, form]);

  const updateProjectMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      await apiRequest("PUT", `/api/projects/${project.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects-with-tasks"] });
      toast({
        title: "Thành công",
        description: "Dự án đã được cập nhật thành công",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật dự án",
        variant: "destructive",
      });
    },
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      await apiRequest("POST", "/api/tasks", {
        ...taskData,
        projectId: project.id,
        deadline: taskData.deadline.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects-with-tasks"] });
      setNewTask({
        name: "",
        description: "",
        assigneeId: "",
        deadline: new Date(),
        link: ""
      });
      toast({
        title: "Thành công",
        description: "Công việc đã được thêm thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm công việc",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects-with-tasks"] });
      toast({
        title: "Thành công",
        description: "Công việc đã được xóa thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa công việc",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProject) => {
    if (!date) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày deadline",
        variant: "destructive",
      });
      return;
    }
    
    updateProjectMutation.mutate({
      ...data,
      deadline: date,
    });
  };

  const handleAddTask = () => {
    if (!newTask.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên công việc",
        variant: "destructive",
      });
      return;
    }
    addTaskMutation.mutate(newTask);
  };

  // Get current project's tasks
  const currentProjectTasks = Array.isArray(projectWithTasks) ? 
    projectWithTasks.find((p: any) => p.id === project.id)?.tasks || [] : 
    [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Chỉnh sửa dự án: {project.name}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Cập nhật thông tin dự án và quản lý công việc
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="tasks">Phân công công việc</TabsTrigger>
          </TabsList>

          {/* Project Overview Tab */}
          <TabsContent value="overview" className="space-y-4 overflow-y-auto max-h-[500px]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên dự án *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên dự án" {...field} data-testid="input-edit-project-name" />
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
                            placeholder="Mô tả chi tiết về dự án"
                            className="min-h-[100px] resize-none"
                            {...field}
                            data-testid="textarea-edit-project-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="assigneeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Leader</FormLabel>
                          <FormControl>
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <SelectTrigger className="bg-background border border-border text-foreground">
                                <SelectValue placeholder="Chọn Project Leader" />
                              </SelectTrigger>
                              <SelectContent>
                                {users.map((user: any) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trạng thái *</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange} data-testid="select-edit-project-status">
                              <SelectTrigger className="bg-background border border-border text-foreground focus:border-blue-400">
                                <SelectValue placeholder="Chọn trạng thái" className="text-foreground" />
                              </SelectTrigger>
                              <SelectContent className="bg-background border border-border">
                                <SelectItem value="todo" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Chờ thực hiện</SelectItem>
                                <SelectItem value="in_progress" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Đang thực hiện</SelectItem>
                                <SelectItem value="completed" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Hoàn thành</SelectItem>
                                <SelectItem value="cancelled" className="text-foreground hover:bg-muted focus:bg-muted focus:text-foreground">Đã hủy</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel>Deadline *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background border border-border text-foreground hover:bg-muted",
                              !date && "text-muted-foreground"
                            )}
                            data-testid="button-edit-project-deadline"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background border border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                            initialFocus
                            className="bg-background"
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link dự án</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} data-testid="input-edit-project-link" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    className="border border-border text-foreground hover:bg-muted"
                    data-testid="button-cancel-edit-project"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateProjectMutation.isPending}
                    className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    data-testid="button-submit-edit-project"
                  >
                    {updateProjectMutation.isPending ? "Đang cập nhật..." : "Cập nhật dự án"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Task Management Tab */}
          <TabsContent value="tasks" className="space-y-4 overflow-y-auto max-h-[500px]">
            {/* Add New Task Form */}
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <h4 className="font-semibold mb-4">Thêm công việc mới</h4>
              <div className="grid gap-4">
                <Input
                  placeholder="Tên công việc *"
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                />
                <Textarea
                  placeholder="Mô tả công việc"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="min-h-[80px]"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select 
                    value={newTask.assigneeId} 
                    onValueChange={(value) => setNewTask({...newTask, assigneeId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn người thực hiện" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={newTask.deadline.toISOString().split('T')[0]}
                    onChange={(e) => setNewTask({...newTask, deadline: new Date(e.target.value)})}
                  />
                </div>
                <Input
                  placeholder="Link (tùy chọn)"
                  value={newTask.link}
                  onChange={(e) => setNewTask({...newTask, link: e.target.value})}
                />
                <Button 
                  onClick={handleAddTask}
                  disabled={addTaskMutation.isPending}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addTaskMutation.isPending ? "Đang thêm..." : "Thêm công việc"}
                </Button>
              </div>
            </div>

            {/* Current Tasks List */}
            <div className="space-y-3">
              <h4 className="font-semibold">Danh sách công việc hiện tại</h4>
              {currentProjectTasks && currentProjectTasks.length > 0 ? (
                currentProjectTasks.map((task: any) => (
                  <div key={task.id} className="border border-border rounded-lg p-4 bg-background">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-foreground">{task.name}</h5>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        disabled={deleteTaskMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{task.assignee || 'Chưa phân công'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{new Date(task.deadline).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {task.status === 'todo' && 'Chờ thực hiện'}
                          {task.status === 'in_progress' && 'Đang thực hiện'}
                          {task.status === 'completed' && 'Hoàn thành'}
                          {task.status === 'cancelled' && 'Đã hủy'}
                        </Badge>
                      </div>
                    </div>
                    
                    {task.link && (
                      <div className="mt-2">
                        <a
                          href={task.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Xem link
                        </a>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Chưa có công việc nào được phân công</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}