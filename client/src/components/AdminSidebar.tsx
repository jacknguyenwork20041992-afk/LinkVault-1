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
  FolderOpen,
  AlertTriangle,
  Key,
  Menu,
  Brain,
  Upload,
  HelpCircle,
  UserPlus,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { User } from "@shared/schema";

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  user: User;
  isMobile?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebar({ activeView, onViewChange, user, isMobile, onMobileClose }: AdminSidebarProps) {
  const handleItemClick = (itemId: string) => {
    onViewChange(itemId);
    if (onMobileClose) {
      onMobileClose();
    }
  };
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
        { id: "activities", label: "Hoạt động", icon: Activity },
      ]
    },
    {
      title: "Quản lý công việc",
      items: [
        { id: "projects", label: "Quản lý dự án", icon: FolderOpen },
        { id: "accounts", label: "Danh sách tài khoản", icon: Key },
      ]
    },
    {
      title: "Quản lý nội dung", 
      items: [
        { id: "programs", label: "Chương trình", icon: Book },
        { id: "categories", label: "Khóa học", icon: Tags },
        { id: "documents", label: "Tài liệu", icon: FileText },
        { id: "important-documents", label: "Tài liệu quan trọng", icon: AlertTriangle },
      ]
    },
    {
      title: "AI Chat Bot",
      items: [
        { id: "knowledge-base", label: "Cơ sở kiến thức AI", icon: Brain },
        { id: "training-files", label: "File Training AI", icon: Upload },
      ]
    },
    {
      title: "HỖ TRỢ",
      items: [
        { id: "support-tickets", label: "Yêu cầu hỗ trợ", icon: HelpCircle },
        { id: "account-requests", label: "Request for Account", icon: UserPlus },
      ]
    },
    {
      title: "Hệ thống",
      items: [
        { id: "users", label: "Người dùng", icon: Users },
        { id: "notifications", label: "Thông báo", icon: Bell },
        { id: "theme-management", label: "Quản lý giao diện", icon: Palette },
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 w-full border-r border-border/30 shadow-lg flex flex-col h-full">
      {/* Header với gradient background */}
      <div className="relative p-6 border-b border-border/30 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 dark:from-blue-400/5 dark:to-indigo-400/5"></div>
        <div className="relative flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
            <GraduationCap className="text-white text-xl" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg">Admin Panel</h1>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Quản lý hệ thống</p>
          </div>
        </div>
      </div>

      <nav className="p-6 space-y-8 overflow-y-auto flex-1 pb-32">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title}>
            {/* Section Header */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                {section.title}
              </h3>
            </div>
            
            {/* Section Items */}
            <ul className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <li key={item.id}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-sm group transition-all duration-200 h-10 sm:h-11 ${
                        isActive 
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 shadow-sm font-medium" 
                          : "text-muted-foreground hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-800/50 dark:hover:to-slate-700/50 hover:text-foreground"
                      }`}
                      onClick={() => handleItemClick(item.id)}
                      data-testid={`button-nav-${item.id}`}
                    >
                      <div className={`p-2 rounded-lg mr-3 transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30"
                          : "bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-800/50"
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          isActive 
                            ? "text-blue-600 dark:text-blue-400" 
                            : "text-muted-foreground group-hover:text-foreground"
                        }`} />
                      </div>
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
            
            {/* Divider after each section except the last */}
            {sectionIndex < menuSections.length - 1 && (
              <div className="mt-6 border-t border-border/30"></div>
            )}
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 p-6 border-t border-border/30 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-950/80 dark:to-slate-900/80 backdrop-blur-sm">
        <div className="bg-white/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-border/30 backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
                <Shield className="text-white text-sm" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground block" data-testid="text-admin-name">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email || "Admin"
                  }
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Administrator</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 rounded-xl p-2"
              data-testid="button-admin-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
