import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Cloud, 
  HardDrive, 
  Info, 
  Settings, 
  ToggleLeft, 
  ToggleRight,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

interface GoogleDriveInfo {
  isConfigured: boolean;
  clientId: string;
  driveAccount: string;
  folderId: string;
  currentUploadMethod: string;
}

export default function UploadMethodManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);

  // Fetch Google Drive info
  const { data: driveInfo, isLoading: isLoadingInfo } = useQuery({
    queryKey: ['/api/admin/google-drive-info'],
    retry: false,
  });

  // Toggle upload method mutation
  const toggleMethodMutation = useMutation({
    mutationFn: async (useGoogleDrive: boolean) => {
      const response = await apiRequest('POST', '/api/admin/toggle-upload-method', {
        useGoogleDrive
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Thành công",
        description: `Đã chuyển sang ${data.currentMethod}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/google-drive-info'] });
      setIsToggling(false);
    },
    onError: (error) => {
      console.error('Error toggling upload method:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi phương thức upload",
        variant: "destructive",
      });
      setIsToggling(false);
    },
  });

  const handleToggleMethod = async () => {
    if (!info?.isConfigured) {
      toast({
        title: "Cần cấu hình",
        description: "Google Drive chưa được cấu hình. Cần GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET.",
        variant: "destructive",
      });
      return;
    }

    setIsToggling(true);
    const useGoogleDrive = info.currentUploadMethod === 'Google Cloud Storage';
    toggleMethodMutation.mutate(useGoogleDrive);
  };

  if (isLoadingInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Upload Method Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Đang tải thông tin...
          </div>
        </CardContent>
      </Card>
    );
  }

  const info = driveInfo as GoogleDriveInfo;
  const isUsingGoogleDrive = info?.currentUploadMethod === 'Google Drive';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quản lý phương thức Upload
        </CardTitle>
        <CardDescription>
          Cấu hình và chuyển đổi giữa Google Cloud Storage và Google Drive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Method Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {isUsingGoogleDrive ? (
              <HardDrive className="h-6 w-6 text-blue-600" />
            ) : (
              <Cloud className="h-6 w-6 text-green-600" />
            )}
            <div>
              <h3 className="font-semibold">Phương thức hiện tại</h3>
              <p className="text-sm text-gray-600">{info?.currentUploadMethod}</p>
            </div>
          </div>
          <Badge variant={isUsingGoogleDrive ? "default" : "secondary"}>
            {isUsingGoogleDrive ? "Google Drive" : "Cloud Storage"}
          </Badge>
        </div>

        {/* Google Drive Configuration Status */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Info className="h-4 w-4" />
            Thông tin Google Drive
          </h4>
          
          <div className="grid gap-3">
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">Trạng thái cấu hình:</span>
              <div className="flex items-center gap-2">
                {info?.isConfigured ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${info?.isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                  {info?.isConfigured ? 'Đã cấu hình' : 'Chưa cấu hình'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">Client ID:</span>
              <code className="text-xs bg-white px-2 py-1 rounded border">
                {info?.clientId}
              </code>
            </div>

            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">Tài khoản Drive:</span>
              <span className="text-sm text-gray-600">{info?.driveAccount}</span>
            </div>

            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">Thư mục đích:</span>
              <code className="text-xs bg-white px-2 py-1 rounded border">
                {info?.folderId}
              </code>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Chuyển đổi phương thức</h4>
              <p className="text-sm text-gray-600">
                {isUsingGoogleDrive ? 
                  'Chuyển về Google Cloud Storage' : 
                  'Chuyển sang Google Drive'
                }
              </p>
            </div>
            
            <Button
              onClick={handleToggleMethod}
              disabled={isToggling || toggleMethodMutation.isPending}
              variant={isUsingGoogleDrive ? "outline" : "default"}
              className="flex items-center gap-2"
            >
              {isToggling || toggleMethodMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isUsingGoogleDrive ? (
                <ToggleLeft className="h-4 w-4" />
              ) : (
                <ToggleRight className="h-4 w-4" />
              )}
              {isToggling || toggleMethodMutation.isPending ? 'Đang chuyển...' : 
                isUsingGoogleDrive ? 'Chuyển về Cloud Storage' : 'Chuyển sang Google Drive'
              }
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <strong>Lưu ý:</strong> 
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Google Drive: File sẽ được lưu vào Google Drive account liên kết với Client ID</li>
            <li>Cloud Storage: File sẽ được lưu vào Google Cloud Storage bucket</li>
            <li>Thay đổi này ảnh hưởng đến tất cả upload mới (Support tickets và Account requests)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}