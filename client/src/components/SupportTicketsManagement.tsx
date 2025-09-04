import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import {
  HelpCircle,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  GraduationCap,
  FileText,
  Link,
  Image,
  Send,
  AlertTriangle,
  Search,
  Filter,
  X,
  Brain,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupportTicketsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all support tickets
  const { data: tickets = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/support-tickets"],
    retry: false,
  });

  // Fetch ticket responses when viewing a ticket
  const { data: responses = [] } = useQuery<any[]>({
    queryKey: ["/api/support-tickets", selectedTicket?.id, "responses"],
    enabled: !!selectedTicket?.id,
    retry: false,
  });

  // Respond to ticket mutation
  const respondMutation = useMutation({
    mutationFn: async ({ ticketId, response }: { ticketId: string; response: string }) => {
      await apiRequest("POST", `/api/support-tickets/${ticketId}/respond`, { response });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã gửi phản hồi",
      });
      setResponseText("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets", selectedTicket?.id, "responses"] });
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
      console.error("Respond error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi phản hồi. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      await apiRequest("PUT", `/api/support-tickets/${ticketId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      if (selectedTicket) {
        setSelectedTicket({ ...selectedTicket, status: updateStatusMutation.variables?.status });
      }
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
      console.error("Update status error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Convert support ticket to training data mutation
  const convertToTrainingMutation = useMutation({
    mutationFn: async ({ ticketId }: { ticketId: string }) => {
      await apiRequest("POST", `/api/support-tickets/${ticketId}/convert-to-training`, {});
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: "Đã chuyển đổi yêu cầu hỗ trợ thành dữ liệu học AI",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-tickets"] });
      setIsViewModalOpen(false);
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
      console.error("Convert to training error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể chuyển đổi thành dữ liệu học. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesSearch = 
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.classLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.user?.firstName && ticket.user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ticket.user?.lastName && ticket.user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ticket.user?.email && ticket.user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200";
      case "in_progress":
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200";
      case "resolved":
        return "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200";
      case "closed":
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    const getStatusIcon = (status: string) => {
      switch (status) {
        case "open":
          return <Clock className="h-3 w-3" />;
        case "in_progress":
          return <AlertTriangle className="h-3 w-3" />;
        case "resolved":
          return <CheckCircle className="h-3 w-3" />;
        case "closed":
          return <XCircle className="h-3 w-3" />;
        default:
          return <Clock className="h-3 w-3" />;
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case "open":
          return "Đang mở";
        case "in_progress":
          return "Đang xử lý";
        case "resolved":
          return "Đã giải quyết";
        case "closed":
          return "Đã đóng";
        default:
          return status;
      }
    };

    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${getStatusClasses(status)}`}>
        {getStatusIcon(status)}
        {getStatusText(status)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge variant="outline" className="text-green-600 border-green-200">Thấp</Badge>;
      case "normal":
        return <Badge variant="secondary">Bình thường</Badge>;
      case "high":
        return <Badge variant="destructive">Cao</Badge>;
      case "urgent":
        return <Badge className="bg-red-600 hover:bg-red-700">Khẩn cấp</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  const handleRespond = () => {
    if (!responseText.trim() || !selectedTicket) return;
    respondMutation.mutate({ ticketId: selectedTicket.id, response: responseText });
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedTicket) return;
    updateStatusMutation.mutate({ ticketId: selectedTicket.id, status });
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedTicket(null);
    setResponseText("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <HelpCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-purple-700 bg-clip-text text-transparent">
              Quản lý yêu cầu hỗ trợ
            </h1>
            <p className="text-muted-foreground">{tickets.length} yêu cầu tổng cộng</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm theo nội dung, chi nhánh, lớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-tickets"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="open">Đang mở</SelectItem>
              <SelectItem value="in_progress">Đang xử lý</SelectItem>
              <SelectItem value="resolved">Đã giải quyết</SelectItem>
              <SelectItem value="closed">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-priority-filter">
              <SelectValue placeholder="Độ ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
              <SelectItem value="low">Thấp</SelectItem>
              <SelectItem value="normal">Bình thường</SelectItem>
              <SelectItem value="high">Cao</SelectItem>
              <SelectItem value="urgent">Khẩn cấp</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPriorityFilter("all");
            }}
            data-testid="button-clear-filters"
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Không có yêu cầu hỗ trợ nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Người gửi</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Chi nhánh</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Lớp</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Ngày tạo</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground">Xem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t border-border hover:bg-muted/20" data-testid={`row-ticket-${ticket.id}`}>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-foreground">
                            {ticket.user?.firstName && ticket.user?.lastName 
                              ? `${ticket.user.firstName} ${ticket.user.lastName}` 
                              : ticket.user?.email || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">{ticket.user?.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{ticket.branch}</td>
                      <td className="py-4 px-4 text-muted-foreground">{ticket.classLevel}</td>
                      <td className="py-4 px-4">{getStatusBadge(ticket.status)}</td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                          data-testid={`button-view-ticket-${ticket.id}`}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Xem
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Ticket Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              Chi tiết yêu cầu hỗ trợ
            </DialogTitle>
            <DialogDescription>
              ID: {selectedTicket?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thông tin người gửi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <strong>Tên:</strong>
                      <span>
                        {selectedTicket.user?.firstName && selectedTicket.user?.lastName 
                          ? `${selectedTicket.user.firstName} ${selectedTicket.user.lastName}` 
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Email:</strong>
                      <span>{selectedTicket.user?.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <strong>Chi nhánh:</strong>
                      <span>{selectedTicket.branch}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-500" />
                      <strong>Lớp:</strong>
                      <span>{selectedTicket.classLevel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <strong>Ngày gặp vấn đề:</strong>
                      <span>{new Date(selectedTicket.issueDate).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trạng thái & Độ ưu tiên</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Trạng thái:</label>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedTicket.status)}
                        <Select value={selectedTicket.status} onValueChange={handleUpdateStatus}>
                          <SelectTrigger className="w-40" data-testid="select-ticket-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Đang mở</SelectItem>
                            <SelectItem value="in_progress">Đang xử lý</SelectItem>
                            <SelectItem value="resolved">Đã giải quyết</SelectItem>
                            <SelectItem value="closed">Đã đóng</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Độ ưu tiên:</label>
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-500" />
                    Mô tả vấn đề
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{selectedTicket.description}</p>
                </CardContent>
              </Card>

              {/* Document Link & Image */}
              {(selectedTicket.documentLink || selectedTicket.imageUrl) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tài liệu đính kèm</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedTicket.documentLink && (
                      <div className="flex items-center gap-2">
                        <Link className="h-4 w-4 text-yellow-500" />
                        <a
                          href={selectedTicket.documentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          data-testid="link-document"
                        >
                          {selectedTicket.documentLink}
                        </a>
                      </div>
                    )}
                    {(selectedTicket.imageUrls && selectedTicket.imageUrls.length > 0) && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Image className="h-4 w-4 text-indigo-500" />
                          <span className="font-medium">Hình ảnh vấn đề ({selectedTicket.imageUrls.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedTicket.imageUrls.map((imageUrl, index) => (
                            <div key={index} className="border rounded-lg p-3 bg-gray-50">
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-600">Hình ảnh {index + 1}</span>
                              </div>
                              <div 
                                className="relative cursor-pointer group"
                                onClick={() => {
                                  // Open image in new tab
                                  window.open(`/api/support-images/${imageUrl.split('/').pop()?.split('?')[0] || ''}`, '_blank');
                                }}
                              >
                                <img 
                                  src={`/api/support-images/${imageUrl.split('/').pop()?.split('?')[0] || ''}`}
                                  alt={`Hình ảnh vấn đề ${index + 1}`}
                                  className="w-full h-48 md:h-64 object-cover rounded-md shadow-md transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    console.error('Image load error');
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling!.style.display = 'block';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-md flex items-center justify-center">
                                  <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    🔍 Click để xem lớn
                                  </div>
                                </div>
                              </div>
                              <div style={{display: 'none'}} className="text-center text-gray-500 py-4">
                                <p className="text-xs">❌ Không thể tải ảnh {index + 1}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Responses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    Phản hồi ({responses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {responses.length === 0 ? (
                    <p className="text-muted-foreground">Chưa có phản hồi nào</p>
                  ) : (
                    <div className="space-y-3">
                      {responses.map((response) => (
                        <div key={response.id} className="border rounded-lg p-4 bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-blue-600">Admin</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(response.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <p className="text-foreground whitespace-pre-wrap">{response.response}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Response */}
                  <div className="space-y-3 pt-4 border-t">
                    <label className="text-sm font-medium">Thêm phản hồi:</label>
                    <Textarea
                      placeholder="Nhập phản hồi của bạn..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      className="min-h-[100px]"
                      data-testid="textarea-response"
                    />
                    <Button
                      onClick={handleRespond}
                      disabled={!responseText.trim() || respondMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      data-testid="button-send-response"
                    >
                      {respondMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang gửi...
                        </div>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Gửi phản hồi
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            {/* Convert to Training Data button - only show for resolved/closed tickets with responses */}
            {selectedTicket && 
             (selectedTicket.status === "resolved" || selectedTicket.status === "closed") &&
             responses.some((r: any) => !r.isInternal) && (
              <Button
                onClick={() => convertToTrainingMutation.mutate({ ticketId: selectedTicket.id })}
                disabled={convertToTrainingMutation.isPending}
                data-testid="button-convert-to-training"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Brain className="h-4 w-4 mr-2" />
                {convertToTrainingMutation.isPending ? "Đang chuyển đổi..." : "Chuyển thành dữ liệu học AI"}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setIsViewModalOpen(false)}
              data-testid="button-close-modal"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}