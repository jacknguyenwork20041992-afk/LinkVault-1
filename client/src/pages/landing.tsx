import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/5 animate-fade-in">
      <Card className="w-full max-w-md mx-4 shadow-lg border border-border">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="text-primary-foreground text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Trung Tâm Ngoại Ngữ</h1>
            <p className="text-muted-foreground mt-2">Hệ thống quản lý tài liệu</p>
          </div>

          <Button 
            onClick={handleLogin}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors font-medium"
            data-testid="button-login"
          >
            Đăng nhập
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Chỉ admin có thể tạo tài khoản mới
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
