import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default function AuthPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/5 animate-fade-in">
      <Card className="w-full max-w-md mx-4 shadow-lg border border-border">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-primary-foreground text-2xl" />
          </div>
          <CardTitle className="text-2xl">VIA ENGLISH ACADEMY</CardTitle>
          <CardDescription>Đăng nhập vào hệ thống quản lý tài liệu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            data-testid="button-login"
          >
            🚀 Đăng nhập với Replit
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Sử dụng tài khoản Replit của bạn để đăng nhập
            </p>
          </div>

          <div className="text-center border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Chỉ admin có thể tạo tài khoản người dùng mới
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}