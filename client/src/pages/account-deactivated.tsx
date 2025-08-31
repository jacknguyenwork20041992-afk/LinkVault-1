import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountDeactivatedPage() {

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

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Giờ làm việc phòng R&D:</strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Thứ 2 - Thứ 6: 8:30 - 18:00<br />
                Thứ 7: 9:00 - 12:00
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