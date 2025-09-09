import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { 
  Home, 
  HelpCircle, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  FileText, 
  Link2, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image,
  Search,
  Plus,
  Filter,
  X
} from "lucide-react";
import FloatingSupportButton from "@/components/FloatingSupportButton";
import type { SupportTicket } from "@/types";

// Ticket Card Component
interface TicketCardProps {
  ticket: SupportTicket;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

function TicketCard({ ticket, isExpanded, onToggleExpanded }: TicketCardProps) {
  // Only fetch responses when ticket is expanded (lazy loading for better performance)
  const { data: responses = [] } = useQuery<any[]>({
    queryKey: ["/api/support-tickets", ticket.id, "responses"],
    enabled: isExpanded, // Only fetch when expanded
    retry: false,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Mới";
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

  const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "normal":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Khẩn cấp";
      case "high":
        return "Cao";
      case "normal":
        return "Bình thường";
      case "low":
        return "Thấp";
      default:
        return priority;
    }
  };

  return (
    <Card className="border border-border hover:border-accent/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Header with Status and Priority */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={`flex items-center gap-1 ${getStatusClasses(ticket.status)}`}>
                {getStatusIcon(ticket.status)}
                {getStatusText(ticket.status)}
              </Badge>
              <Badge variant={getPriorityVariant(ticket.priority || "normal")}>
                {getPriorityText(ticket.priority || "normal")}
              </Badge>
            </div>

            {/* Content */}
            <div className="space-y-3">
              {/* Description */}
              <div>
                <p className="text-foreground font-medium mb-1">Mô tả vấn đề:</p>
                <p className="text-muted-foreground">{ticket.description || "Không có mô tả"}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ngày:</span>
                  <span className="font-medium">{new Date(ticket.issueDate).toLocaleDateString('vi-VN')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Chi nhánh:</span>
                  <span className="font-medium">{ticket.branch}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Lớp:</span>
                  <span className="font-medium">{ticket.classLevel}</span>
                </div>
              </div>

              {/* Document Link */}
              {ticket.documentLink && (
                <div className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tài liệu:</span>
                  <a 
                    href={ticket.documentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Xem tài liệu
                  </a>
                </div>
              )}

              {/* Images */}
              {ticket.imageUrls && Array.isArray(ticket.imageUrls) && ticket.imageUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Hình ảnh ({ticket.imageUrls.length}):</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {ticket.imageUrls.slice(0, 4).map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={imageUrl}
                          alt={`Hình ảnh ${index + 1}`}
                          className="w-full h-20 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            window.open(imageUrl, '_blank');
                          }}
                        />
                        {ticket.imageUrls && ticket.imageUrls.length > 4 && index === 3 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center text-white text-xs font-medium">
                            +{ticket.imageUrls.length - 3}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Responses Section */}
              {!isExpanded && (
                <div className="pt-3 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onToggleExpanded}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 border-0"
                    data-testid={`button-expand-ticket-${ticket.id}`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">💬 Xem phản hồi</span>
                  </Button>
                </div>
              )}
              
              {isExpanded && responses.length > 0 && (
                <div className="space-y-3 pt-3 border-t bg-green-50 dark:bg-green-950/20 -mx-6 px-6 pb-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 dark:text-green-400">Phản hồi từ hỗ trợ ({responses.length})</span>
                  </h4>
                  
                  <div className="space-y-3">
                    {responses.map((response: any) => (
                      <div key={response.id} className="bg-background rounded-lg p-4 border border-green-200 dark:border-green-800 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-white">
                              {response.responder?.firstName?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">
                                {response.responder?.firstName && response.responder?.lastName 
                                  ? `${response.responder.firstName} ${response.responder.lastName}`
                                  : 'Admin'
                                }
                              </span>
                              <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                                Hỗ trợ viên
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm mb-2 bg-green-50 dark:bg-green-950/30 p-3 rounded-md border-l-4 border-green-500">
                              {response.response}
                            </p>
                            
                            {/* Display response images */}
                            {response.imageUrls && response.imageUrls.length > 0 && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                  <Image className="h-4 w-4" />
                                  <span className="font-medium">Hình ảnh đính kèm ({response.imageUrls.length}):</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {response.imageUrls.map((imageUrl: string, index: number) => (
                                    <div key={index} className="relative group">
                                      <img
                                        src={imageUrl}
                                        alt={`Response image ${index + 1}`}
                                        className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity"
                                        onClick={() => window.open(imageUrl, '_blank')}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(response.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onToggleExpanded}
                      className="flex items-center gap-2"
                      data-testid={`button-collapse-ticket-${ticket.id}`}
                    >
                      Ẩn phản hồi
                    </Button>
                  </div>
                </div>
              )}
              
              {isExpanded && responses.length === 0 && (
                <div className="space-y-3 pt-3 border-t bg-gray-50 dark:bg-gray-950/20 -mx-6 px-6 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Chưa có phản hồi</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onToggleExpanded}
                      className="flex items-center gap-2"
                      data-testid={`button-collapse-ticket-${ticket.id}`}
                    >
                      Ẩn
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-right text-xs text-muted-foreground space-y-1">
            <div>Tạo: {formatDateTime(ticket.createdAt || null)}</div>
            {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
              <div>Cập nhật: {formatDateTime(ticket.updatedAt || null)}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Format date time function
const formatDateTime = (date: string | Date | null) => {
  if (!date) return "Chưa xác định";
  
  const notificationDate = new Date(date);
  if (isNaN(notificationDate.getTime())) return "Chưa xác định";
  
  const day = notificationDate.getDate().toString().padStart(2, '0');
  const month = (notificationDate.getMonth() + 1).toString().padStart(2, '0');
  const year = notificationDate.getFullYear();
  const hours = notificationDate.getHours().toString().padStart(2, '0');
  const minutes = notificationDate.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function SupportTicketsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedSender, setSelectedSender] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const TICKETS_PER_PAGE = 5;

  // Fetch user's support tickets
  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support-tickets"],
    retry: false,
  });

  // Toggle expanded state for tickets
  const toggleExpanded = (ticketId: string) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  // Get unique branches and senders from tickets
  const uniqueBranches = Array.from(new Set(tickets.map(ticket => ticket.branch))).sort();
  
  // Filter tickets based on all criteria
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.classLevel.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = selectedBranch === "all" || ticket.branch === selectedBranch;
    
    // Date filtering
    const ticketDate = new Date(ticket.issueDate);
    const matchesDateFrom = !dateFrom || ticketDate >= dateFrom;
    const matchesDateTo = !dateTo || ticketDate <= dateTo;
    
    return matchesSearch && matchesBranch && matchesDateFrom && matchesDateTo;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / TICKETS_PER_PAGE);
  const startIndex = (currentPage - 1) * TICKETS_PER_PAGE;
  const endIndex = startIndex + TICKETS_PER_PAGE;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Clear filters function
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBranch("all");
    setSelectedSender("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    resetPagination();
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedBranch !== "all" || selectedSender !== "all" || dateFrom || dateTo;

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBranch, dateFrom, dateTo]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Mới";
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

  const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "normal":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Khẩn cấp";
      case "high":
        return "Cao";
      case "normal":
        return "Bình thường";
      case "low":
        return "Thấp";
      default:
        return priority;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 backdrop-blur-sm">
                  <GraduationCap className="text-white h-5 w-5" />
                </div>
                <h1 className="text-xl font-bold text-white">VIA ENGLISH ACADEMY</h1>
              </div>
            </Link>
            
            <Link href="/">
              <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20" data-testid="button-back-home">
                <Home className="h-4 w-4" />
                Trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <HelpCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-purple-700 bg-clip-text text-transparent">
                    Yêu cầu hỗ trợ của tôi ({filteredTickets.length})
                  </h1>
                  {filteredTickets.length > TICKETS_PER_PAGE && (
                    <p className="text-sm text-muted-foreground">
                      Trang {currentPage}/{totalPages}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="space-y-4 mt-4">
              {/* Top Row: Search + Basic Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo nội dung, chi nhánh, lớp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-tickets"
                  />
                </div>
                
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Branch Filter */}
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-[130px]" data-testid="select-branch-filter">
                      <SelectValue placeholder="Tất cả chi nhánh" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                      {uniqueBranches.filter(branch => branch && branch.trim() !== "").map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date From */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[120px] justify-start text-left font-normal"
                        data-testid="button-date-from"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "dd/MM") : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Date To */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[120px] justify-start text-left font-normal"
                        data-testid="button-date-to"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "dd/MM") : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Clear Filters Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="flex items-center gap-1"
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Bộ lọc đang áp dụng:</span>
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      Tìm kiếm: "{searchTerm}"
                    </Badge>
                  )}
                  {selectedBranch !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Chi nhánh: {selectedBranch}
                    </Badge>
                  )}
                  {dateFrom && (
                    <Badge variant="secondary" className="text-xs">
                      Từ: {format(dateFrom, "dd/MM/yyyy")}
                    </Badge>
                  )}
                  {dateTo && (
                    <Badge variant="secondary" className="text-xs">
                      Đến: {format(dateTo, "dd/MM/yyyy")}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? "Không tìm thấy yêu cầu nào" : "Chưa có yêu cầu hỗ trợ"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Hãy thử thay đổi từ khóa tìm kiếm"
                    : "Bạn chưa gửi yêu cầu hỗ trợ nào. Nhấn nút bên dưới để tạo yêu cầu mới."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedTickets.map((ticket) => {
                  const isExpanded = expandedTickets.has(ticket.id);
                  
                  return (
                  <TicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    isExpanded={isExpanded}
                    onToggleExpanded={() => toggleExpanded(ticket.id)}
                  />
                  );
                })}
              </div>
            )}
            
            {/* Pagination Controls */}
            {filteredTickets.length > TICKETS_PER_PAGE && (
              <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                  data-testid="button-prev-page"
                >
                  ← Trước
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {startIndex + 1}-{Math.min(endIndex, filteredTickets.length)} / {filteredTickets.length}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                  data-testid="button-next-page"
                >
                  Sau →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Support Button */}
      <FloatingSupportButton />
    </div>
  );
}