import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestData: {
    id: string;
    requestType: "new_account" | "un_tag_account";
    branchName: string;
    fileUrl?: string;
  };
}

export default function EmailModal({ isOpen, onClose, requestData }: EmailModalProps) {
  const { toast } = useToast();
  
  // Tạo nội dung email mặc định dựa trên requestType
  const generateEmailContent = () => {
    if (requestData.requestType === 'new_account') {
      return {
        subject: `VIA Academy - Student Account Request for ${requestData.branchName}`,
        content: `Dear Support Team,

We are submitting a new student account creation request for our academic program.

Request Details:
• Branch Location: ${requestData.branchName}
• Request Type: New Student Accounts
• Program: SWE (Software Engineering)
• Date: ${new Date().toLocaleDateString('vi-VN')}

The complete student enrollment list is available through our secure document system:
${requestData.fileUrl || '[File URL will be attached]'}

Please process this request and provide the login credentials at your earliest convenience. Our students are scheduled to begin their coursework soon.

Thank you for your continued support.

Best regards,
VIA English Academy
Academic Administration Department`
      };
    } else {
      return {
        subject: `VIA Academy - Account Un-tagging Request for ${requestData.branchName}`,
        content: `Dear Support Team,

We need your assistance with account un-tagging for students who require device access updates.

Request Details:
• Branch Location: ${requestData.branchName}
• Request Type: Account Un-tagging
• Reason: New device login access
• Date: ${new Date().toLocaleDateString('vi-VN')}

The affected student accounts are listed in our secure document:
${requestData.fileUrl || '[File URL will be attached]'}

Please un-tag these accounts so students can log in with their new devices. Kindly confirm completion when the process is finished.

Thank you for your prompt support.

Best regards,
VIA English Academy
Academic Administration Department`
      };
    }
  };

  const defaultEmail = generateEmailContent();
  
  const [emailData, setEmailData] = useState({
    to: "nphuc210@gmail.com",
    cc: "",
    subject: defaultEmail.subject,
    content: defaultEmail.content,
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof emailData) => {
      return await apiRequest("POST", `/api/account-requests/${requestData.id}/send-custom-email`, data);
    },
    onSuccess: () => {
      toast({
        title: "Email đã gửi",
        description: "Email đã được gửi thành công đến support team.",
      });
      onClose();
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
      console.error("Send email error:", error);
      toast({
        title: "Lỗi gửi email",
        description: "Không thể gửi email. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!emailData.to.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập email người nhận.",
        variant: "destructive",
      });
      return;
    }
    if (!emailData.subject.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề email.",
        variant: "destructive",
      });
      return;
    }
    if (!emailData.content.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung email.",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate(emailData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Gửi Email Yêu Cầu
          </DialogTitle>
          <DialogDescription>
            Gửi email yêu cầu tạo tài khoản cho chi nhánh {requestData.branchName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-to">Gửi đến *</Label>
            <Input
              id="email-to"
              data-testid="input-email-to"
              value={emailData.to}
              onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="support@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-cc">CC (Tùy chọn)</Label>
            <Input
              id="email-cc"
              data-testid="input-email-cc"
              value={emailData.cc}
              onChange={(e) => setEmailData(prev => ({ ...prev, cc: e.target.value }))}
              placeholder="manager@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Tiêu đề *</Label>
            <Input
              id="email-subject"
              data-testid="input-email-subject"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Tiêu đề email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-content">Nội dung *</Label>
            <Textarea
              id="email-content"
              data-testid="textarea-email-content"
              value={emailData.content}
              onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Nội dung email"
              rows={12}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            data-testid="button-cancel-email"
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSend}
            disabled={sendEmailMutation.isPending}
            data-testid="button-send-email"
            style={{ 
              backgroundColor: '#2563eb', 
              color: '#ffffff', 
              border: 'none' 
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            <span style={{ color: '#ffffff' }}>
              {sendEmailMutation.isPending ? "Đang gửi..." : "Gửi Email"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}