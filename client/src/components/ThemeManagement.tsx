import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Check, Settings, Star, Snowflake, Ghost, Moon, GraduationCap } from "lucide-react";

interface ThemeSetting {
  id: string;
  themeName: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

const predefinedThemes = [
  {
    themeName: "default",
    displayName: "Mặc định",
    description: "Giao diện tiêu chuẩn của hệ thống",
    icon: Settings,
    color: "bg-gray-100 text-gray-700"
  },
  {
    themeName: "tet",
    displayName: "Tết Nguyên Đán",
    description: "Giao diện trang trí Tết truyền thống Việt Nam",
    icon: Star,
    color: "bg-red-100 text-red-700"
  },
  {
    themeName: "christmas",
    displayName: "Giáng sinh",
    description: "Giao diện trang trí Giáng sinh với màu sắc ấm cúng",
    icon: Snowflake,
    color: "bg-green-100 text-green-700"
  },
  {
    themeName: "halloween",
    displayName: "Halloween",
    description: "Giao diện Halloween với màu cam đen huyền bí",
    icon: Ghost,
    color: "bg-orange-100 text-orange-700"
  },
  {
    themeName: "mid_autumn",
    displayName: "Trung thu",
    description: "Giao diện Tết Trung thu với hình ảnh trăng sao",
    icon: Moon,
    color: "bg-yellow-100 text-yellow-700"
  },
  {
    themeName: "teachers_day",
    displayName: "Ngày Nhà giáo Việt Nam",
    description: "Giao diện tôn vinh ngày Nhà giáo 20/11",
    icon: GraduationCap,
    color: "bg-blue-100 text-blue-700"
  }
];

export default function ThemeManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTheme, setSelectedTheme] = useState<string>("");

  // Get all themes
  const { data: themes = [], isLoading } = useQuery<ThemeSetting[]>({
    queryKey: ["/api/themes"],
  });

  // Get active theme
  const { data: activeTheme } = useQuery<ThemeSetting>({
    queryKey: ["/api/themes/active"],
  });

  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: async (themeData: any) => {
      return apiRequest("POST", "/api/themes", themeData);
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo giao diện mới",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo giao diện",
        variant: "destructive",
      });
    },
  });

  // Activate theme mutation
  const activateThemeMutation = useMutation({
    mutationFn: async (themeName: string) => {
      console.log("DEBUG Frontend: Making API request for theme:", themeName);
      return apiRequest("POST", "/api/themes/activate", { themeName });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thay đổi giao diện trang chủ",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/themes/active"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thay đổi giao diện",
        variant: "destructive",
      });
    },
  });

  const handleCreateTheme = async (themeInfo: any) => {
    await createThemeMutation.mutateAsync({
      themeName: themeInfo.themeName,
      displayName: themeInfo.displayName,
      description: themeInfo.description,
      isActive: false,
    });
  };

  const handleActivateTheme = async (themeName: string) => {
    console.log("DEBUG Frontend: Activating theme:", themeName);
    try {
      await activateThemeMutation.mutateAsync(themeName);
      console.log("DEBUG Frontend: Theme activation successful");
    } catch (error) {
      console.error("DEBUG Frontend: Theme activation failed:", error);
    }
  };

  const initializePredefinedThemes = async () => {
    for (const theme of predefinedThemes) {
      const existing = themes.find(t => t.themeName === theme.themeName);
      if (!existing) {
        await handleCreateTheme(theme);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
            <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quản lý giao diện</h1>
            <p className="text-muted-foreground">Thay đổi giao diện trang chủ theo các ngày lễ và sự kiện</p>
          </div>
        </div>
        <Button 
          onClick={initializePredefinedThemes}
          variant="outline"
          disabled={createThemeMutation.isPending}
        >
          Khởi tạo giao diện mặc định
        </Button>
      </div>

      {/* Active Theme Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-600" />
            <span>Giao diện hiện tại</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTheme ? (
            <div className="flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  {activeTheme.displayName}
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Đang được áp dụng cho trang chủ người dùng
                </p>
              </div>
              <Badge className="ml-auto bg-green-600 text-white">Đang hoạt động</Badge>
            </div>
          ) : (
            <p className="text-muted-foreground">Chưa có giao diện nào được kích hoạt</p>
          )}
        </CardContent>
      </Card>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn giao diện</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedTheme} onValueChange={setSelectedTheme}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn giao diện để áp dụng..." />
            </SelectTrigger>
            <SelectContent>
              {predefinedThemes.map((theme) => (
                <SelectItem key={theme.themeName} value={theme.themeName}>
                  <div className="flex items-center space-x-2">
                    <theme.icon className="h-4 w-4" />
                    <span>{theme.displayName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => handleActivateTheme(selectedTheme)}
            disabled={!selectedTheme || activateThemeMutation.isPending}
            className="w-full"
          >
            {activateThemeMutation.isPending ? "Đang áp dụng..." : "Áp dụng giao diện"}
          </Button>
        </CardContent>
      </Card>

      {/* Available Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {predefinedThemes.map((theme) => {
          const isActive = activeTheme?.themeName === theme.themeName;
          const Icon = theme.icon;
          
          return (
            <Card 
              key={theme.themeName}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isActive ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedTheme(theme.themeName)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${theme.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {isActive && (
                    <Badge className="bg-green-600 text-white">
                      <Check className="h-3 w-3 mr-1" />
                      Đang dùng
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {theme.displayName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {theme.description}
                </p>
                <Button 
                  variant={isActive ? "secondary" : "outline"}
                  size="sm"
                  className="w-full mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isActive) {
                      handleActivateTheme(theme.themeName);
                    }
                  }}
                  disabled={isActive || activateThemeMutation.isPending}
                >
                  {isActive ? "Đang sử dụng" : "Áp dụng"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}