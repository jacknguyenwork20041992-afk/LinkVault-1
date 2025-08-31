import { AlertTriangle, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountDeactivatedPage() {
  const handleEmailContact = () => {
    window.location.href = "mailto:rd@viaenglish.com";
  };

  const handlePhoneContact = () => {
    window.location.href = "tel:+84123456789";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto border-red-200 dark:border-red-800">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-bold text-red-800 dark:text-red-200">
            Tài khoản chưa được kích hoạt
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-gray-600 dark:text-gray-300 text-base">
              Tài khoản của bạn hiện chưa được kích hoạt. 
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Hãy liên hệ phòng R&D để được kích hoạt tài khoản
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleEmailContact}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-email-contact"
            >
              <Mail className="w-4 h-4 mr-2" />
              Gửi email: rd@viaenglish.com
            </Button>
            
            <Button 
              onClick={handlePhoneContact}
              variant="outline"
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
              data-testid="button-phone-contact"
            >
              <Phone className="w-4 h-4 mr-2" />
              Gọi điện: 0123 456 789
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Giờ làm việc phòng R&D:</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Thứ 2 - Thứ 6: 8:00 - 17:30<br />
                Thứ 7: 8:00 - 12:00
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Vui lòng cung cấp thông tin tài khoản khi liên hệ
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}