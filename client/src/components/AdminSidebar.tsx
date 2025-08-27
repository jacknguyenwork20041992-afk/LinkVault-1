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
  Activity,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  user: User;
}

export default function AdminSidebar({ activeView, onViewChange, user }: AdminSidebarProps) {
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        window.location.href = "/";
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuSections = [
    {
      title: "Tổng quan",
      items: [
        { id: "dashboard", label: "Dashboard", icon: Gauge },
        { id: "projects", label: "Quản lý dự án", icon: FolderOpen },
      ]
    },
    {
      title: "Quản lý nội dung",
      items: [
        { id: "programs", label: "Chương trình", icon: Book },
        { id: "categories", label: "Khóa học", icon: Tags },
        { id: "documents", label: "Tài liệu", icon: FileText },
        { id: "users", label: "Người dùng", icon: Users },
      ]
    },
    {
      title: "Hệ thống",
      items: [
        { id: "notifications", label: "Thông báo", icon: Bell },
        { id: "activities", label: "Hoạt động", icon: Activity },
      ]
    }
  ];

  return (
    <div className="bg-card w-64 border-r border-border shadow-lg relative">
      <div className="p-6 border-b border-border bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
            <GraduationCap className="text-white h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Quản lý hệ thống</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title}>
            <div className="px-3 mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <li key={item.id}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start text-sm transition-all duration-200 ${
                        isActive 
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm"
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
            {sectionIndex < menuSections.length - 1 && (
              <div className="mt-4 border-t border-border/50"></div>
            )}
          </div>
        ))}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-border bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
              <Shield className="text-white text-sm" />
            </div>
            <div>
              <span className="text-sm font-medium text-foreground block" data-testid="text-admin-name">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.email || "Admin"
                }
              </span>
              <span className="text-xs text-muted-foreground">Administrator</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 rounded-lg"
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
