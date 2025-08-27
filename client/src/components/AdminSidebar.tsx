import { 
  GraduationCap, 
  Gauge, 
  Book, 
  Tags, 
  FileText, 
  Users, 
  Bell, 
  LogOut,
  Shield,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  user: User;
}

export default function AdminSidebar({ activeView, onViewChange, user }: AdminSidebarProps) {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Gauge },
    { id: "programs", label: "Chương trình", icon: Book },
    { id: "categories", label: "Danh mục", icon: Tags },
    { id: "documents", label: "Tài liệu", icon: FileText },
    { id: "users", label: "Người dùng", icon: Users },
    { id: "notifications", label: "Thông báo", icon: Bell },
    { id: "activities", label: "Hoạt động", icon: Activity },
  ];

  return (
    <div className="bg-card w-64 border-r border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
            <GraduationCap className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Quản lý hệ thống</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start text-sm ${
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => onViewChange(item.id)}
                  data-testid={`button-nav-${item.id}`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center mr-2">
              <Shield className="text-accent-foreground text-sm" />
            </div>
            <span className="text-sm font-medium text-foreground" data-testid="text-admin-name">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.email || "Admin"
              }
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
