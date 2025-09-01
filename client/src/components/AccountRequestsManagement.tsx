import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserPlus, 
  Eye, 
  Edit3, 
  ExternalLink, 
  Calendar, 
  User, 
  Mail, 
  MapPin,
  FileText,
  MessageSquare,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import EmailModal from "@/components/modals/EmailModal";

interface AccountRequest {
  id: string;
  userId: string;
  branchName: string;
  email: string;
  requestType: "new_account" | "un_tag_account";
  fileName?: string;
  fileUrl?: string;
  status: "pending" | "processing" | "completed" | "rejected";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function AccountRequestsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: requests = [], isLoading, error } = useQuery<AccountRequest[]>({
    queryKey: ["/api/admin/account-requests"],
  });

  // Handle error separately
  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Phiên đăng nhập hết hạn", 
      description: "Vui lòng đăng nhập lại để tiếp tục.",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/account-requests/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Yêu cầu tài khoản đã được cập nhật.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/account-requests"] });
      setIsUpdateModalOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Update request error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật yêu cầu. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleOpenEmailModal = (request: AccountRequest) => {
    setSelectedRequest(request);
    setIsEmailModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ xử lý</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Đang xử lý</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Từ chối</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case "new_account":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Tài khoản mới</Badge>;
      case "un_tag_account":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Reset tài khoản</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleUpdateRequest = (request: AccountRequest) => {
    setSelectedRequest(request);
    setIsUpdateModalOpen(true);
  };

  const handleSubmitUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateRequestMutation.mutate({
      id: selectedRequest!.id,
      data: {
        status: formData.get("status"),
        adminNotes: formData.get("adminNotes"),
      },
    });
  };

  const filteredRequests = requests.filter((request: AccountRequest) => {
    const statusMatch = filterStatus === "all" || request.status === filterStatus;
    const typeMatch = filterType === "all" || request.requestType === filterType;
    return statusMatch && typeMatch;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-purple-700 bg-clip-text text-transparent">
            Quản lý yêu cầu tài khoản SWE
          </h1>
          <p className="text-muted-foreground mt-2">
            Xem và xử lý các yêu cầu tài khoản học viên cho chương trình SWE
          </p>
        </div>
        <div className="flex items-center gap-4">
          <UserPlus className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Lọc yêu cầu theo trạng thái và loại</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Loại yêu cầu</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="new_account">Tài khoản mới</SelectItem>
                  <SelectItem value="un_tag_account">Reset tài khoản</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người gửi</TableHead>
                  <TableHead>Thao tác</TableHead>
                  <TableHead>Chi nhánh</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Loại yêu cầu</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: AccountRequest) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {request.user.firstName} {request.user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateRequest(request)}
                          data-testid={`button-edit-request-${request.id}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {request.branchName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {request.email}
                      </div>
                    </TableCell>
                    <TableCell>{getRequestTypeBadge(request.requestType)}</TableCell>
                    <TableCell>
                      {request.fileName ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{request.fileName}</span>
                          {request.fileUrl && request.fileUrl !== "simulated-url" && !request.fileUrl.includes("googleapis.com") ? (
                            <a
                              href={request.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="Xem file"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : request.fileUrl && request.fileUrl.includes("storage.googleapis.com") ? (
                            <a
                              href={`/objects/uploads/${request.fileUrl.split('/').pop()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="Xem file"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <span 
                              className="text-muted-foreground cursor-not-allowed" 
                              title="File đang được xử lý"
                            >
                              <ExternalLink className="h-4 w-4 opacity-50" />
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Chưa có file</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Không có yêu cầu nào phù hợp với bộ lọc
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Update Request Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Cập nhật yêu cầu tài khoản
            </DialogTitle>
            <DialogDescription>
              Cập nhật trạng thái và ghi chú cho yêu cầu tài khoản
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <form onSubmit={handleSubmitUpdate} className="space-y-4">
              {/* Request Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Thông tin yêu cầu</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Người gửi:</span>{" "}
                    {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Chi nhánh:</span> {selectedRequest.branchName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedRequest.email}
                  </div>
                  <div>
                    <span className="font-medium">Loại:</span>{" "}
                    {selectedRequest.requestType === "new_account" ? "Tài khoản mới" : "Reset tài khoản"}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Trạng thái
                </label>
                <Select name="status" defaultValue={selectedRequest.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="processing">Đang xử lý</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <label htmlFor="adminNotes" className="text-sm font-medium">
                  Ghi chú admin
                </label>
                <Textarea
                  name="adminNotes"
                  placeholder="Thêm ghi chú về việc xử lý yêu cầu này..."
                  defaultValue={selectedRequest.adminNotes || ""}
                  className="min-h-[100px]"
                />
              </div>

              <DialogFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleOpenEmailModal(selectedRequest)}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Gửi Email
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateRequestMutation.isPending}
                    style={{ 
                      backgroundColor: '#2563eb', 
                      color: '#ffffff', 
                      border: 'none' 
                    }}
                  >
                    <span style={{ color: '#ffffff' }}>
                      {updateRequestMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
                    </span>
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      {selectedRequest && (
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => {
            setIsEmailModalOpen(false);
            setSelectedRequest(null);
          }}
          requestData={{
            id: selectedRequest.id,
            requestType: selectedRequest.requestType,
            branchName: selectedRequest.branchName,
            fileUrl: selectedRequest.fileUrl,
            email: selectedRequest.email,
          }}
        />
      )}
    </div>
  );
}