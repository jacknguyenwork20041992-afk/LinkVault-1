import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, insertProjectTaskSchema, type InsertProject, type InsertProjectTask, type User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>();
  const [tasks, setTasks] = useState<Array<InsertProjectTask & { tempId: string; deadline: Date }>>([]);

  // Fetch admin users for dropdowns
  const { data: adminUsers = [], isLoading: isLoadingAdmins } = useQuery<User[]>({
    queryKey: ["/api/admin-users"],
    enabled: isOpen,
  });

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      assigneeId: "",
      status: "todo" as const,
      link: "",
    },
  });

  const taskForm = useForm<InsertProjectTask & { deadline: Date }>({
    resolver: zodResolver(insertProjectTaskSchema.extend({
      deadline: insertProjectTaskSchema.shape.deadline || insertProjectSchema.shape.deadline
    })),
    defaultValues: {
      projectId: "",
      name: "",
      assigneeId: "",
      description: "",
      link: "",
      status: "todo" as const,
      deadline: new Date(),
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { project: InsertProject; tasks: Array<InsertProjectTask> }) => {
      const response = await apiRequest("POST", "/api/projects-with-tasks", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Thành công",
        description: "Dự án và các công việc đã được tạo thành công",
      });
      onClose();
      form.reset();
      taskForm.reset();
      setDate(undefined);
      setTasks([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo dự án",
        variant: "destructive",
      });
    },
  });

  const addTask = () => {
    const taskData = taskForm.getValues();
    if (!taskData.name || !taskData.assigneeId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên công việc và chọn người thực hiện",
        variant: "destructive",
      });
      return;
    }

    const newTask = {
      ...taskData,
      tempId: Date.now().toString(),
      projectId: "", // Will be set when project is created
    };

    setTasks(prev => [...prev, newTask]);
    taskForm.reset({
      projectId: "",
      name: "",
      assigneeId: "",
      description: "",
      link: "",
      status: "todo" as const,
      deadline: new Date(),
    });
  };

  const removeTask = (tempId: string) => {
    setTasks(prev => prev.filter(task => task.tempId !== tempId));
  };

  const onSubmit = (data: InsertProject) => {
    console.log("🚀 onSubmit called with data:", data);
    console.log("📅 Selected date:", date);
    console.log("📋 Tasks:", tasks);
    
    if (!date) {
      console.log("❌ No date selected");
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày deadline cho dự án",
        variant: "destructive",
      });
      return;
    }

    const projectData = {
      ...data,
      deadline: date.toISOString(),
    };

    const tasksData = tasks.map(task => ({
      name: task.name,
      assigneeId: task.assigneeId,
      description: task.description,
      link: task.link,
      status: task.status,
      deadline: task.deadline.toISOString(),
      projectId: "", // Will be set by backend
    }));

    console.log("📤 Submitting project:", projectData);
    console.log("📤 Submitting tasks:", tasksData);
    
    createProjectMutation.mutate({ project: projectData, tasks: tasksData });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo dự án mới</DialogTitle>
          <DialogDescription>
            Tạo dự án mới với thông tin tổng quan và phân công công việc chi tiết.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log("❌ Form validation errors:", errors);
            toast({
              title: "Lỗi validation",
              description: "Vui lòng kiểm tra lại thông tin",
              variant: "destructive",
            });
          })} className="space-y-6">
            
            {/* Section 1: Tổng quan dự án */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Tổng quan dự án</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên dự án *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên dự án" {...field} data-testid="input-project-name" />
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
                          placeholder="Nhập mô tả dự án" 
                          className="min-h-[80px]" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="textarea-project-description"
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
                        <FormLabel>Project Leader *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-leader">
                              <SelectValue placeholder={isLoadingAdmins ? "Đang tải..." : "Chọn Project Leader"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {adminUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trạng thái</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-status">
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="todo">Chờ làm</SelectItem>
                            <SelectItem value="in_progress">Đang làm</SelectItem>
                            <SelectItem value="completed">Hoàn thành</SelectItem>
                            <SelectItem value="cancelled">Đã hủy</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Deadline *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                          data-testid="button-project-deadline"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Chọn ngày deadline</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(day) => day && setDate(day)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link dự án</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://..." 
                            type="url" 
                            {...field} 
                            value={field.value || ""}
                            data-testid="input-project-link"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Phân công công việc */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚡ Phân công công việc</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Task Form */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-3">Thêm công việc mới</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FormLabel>Tên công việc *</FormLabel>
                      <Input 
                        placeholder="Nhập tên công việc"
                        {...taskForm.register("name")}
                        data-testid="input-task-name"
                      />
                    </div>
                    <div>
                      <FormLabel>Người thực hiện *</FormLabel>
                      <Select onValueChange={(value) => taskForm.setValue("assigneeId", value)}>
                        <SelectTrigger data-testid="select-task-assignee">
                          <SelectValue placeholder={isLoadingAdmins ? "Đang tải..." : "Chọn người thực hiện"} />
                        </SelectTrigger>
                        <SelectContent>
                          {adminUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <FormLabel>Link</FormLabel>
                      <Input 
                        placeholder="https://..."
                        type="url"
                        {...taskForm.register("link")}
                        data-testid="input-task-link"
                      />
                    </div>
                    <div>
                      <FormLabel>Deadline *</FormLabel>
                      <Input 
                        type="datetime-local"
                        {...taskForm.register("deadline", {
                          setValueAs: (value) => new Date(value),
                        })}
                        data-testid="input-task-deadline"
                      />
                    </div>
                    <div>
                      <FormLabel>Trạng thái</FormLabel>
                      <Select onValueChange={(value) => taskForm.setValue("status", value)} defaultValue="todo">
                        <SelectTrigger data-testid="select-task-status">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">Chờ làm</SelectItem>
                          <SelectItem value="in_progress">Đang làm</SelectItem>
                          <SelectItem value="completed">Hoàn thành</SelectItem>
                          <SelectItem value="cancelled">Đã hủy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <FormLabel>Mô tả</FormLabel>
                    <Textarea 
                      placeholder="Mô tả công việc (không bắt buộc)"
                      className="min-h-[60px]"
                      {...taskForm.register("description")}
                      data-testid="textarea-task-description"
                    />
                  </div>

                  <Button 
                    type="button" 
                    onClick={addTask}
                    className="mt-4"
                    size="sm"
                    data-testid="button-add-task"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm công việc
                  </Button>
                </div>

                {/* Tasks List */}
                {tasks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Danh sách công việc ({tasks.length})</h4>
                    {tasks.map((task) => {
                      const assignedUser = adminUsers.find(u => u.id === task.assigneeId);
                      return (
                        <div key={task.tempId} className="border rounded-lg p-3 bg-background">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-medium">{task.name}</h5>
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs",
                                  task.status === "todo" && "bg-gray-100 text-gray-700",
                                  task.status === "in_progress" && "bg-blue-100 text-blue-700",
                                  task.status === "completed" && "bg-green-100 text-green-700",
                                  task.status === "cancelled" && "bg-red-100 text-red-700"
                                )}>
                                  {task.status === "todo" && "Chờ làm"}
                                  {task.status === "in_progress" && "Đang làm"}
                                  {task.status === "completed" && "Hoàn thành"}
                                  {task.status === "cancelled" && "Đã hủy"}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>👤 {assignedUser?.firstName} {assignedUser?.lastName}</p>
                                <p>📅 {format(new Date(task.deadline), "PPP")}</p>
                                {task.description && <p>📝 {task.description}</p>}
                                {task.link && <p>🔗 <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{task.link}</a></p>}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTask(task.tempId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-remove-task-${task.tempId}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={createProjectMutation.isPending}
                data-testid="button-submit-create-project"
                className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium"
              >
                {createProjectMutation.isPending ? "Đang tạo..." : "Tạo dự án"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}