import { useEffect, useState } from 'react';
import { GraduationCap, BookOpen, Users, Award, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Đang tải..." }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentIcon, setCurrentIcon] = useState(0);
  const [loadingText, setLoadingText] = useState(message);

  const icons = [
    { icon: GraduationCap, label: "Khởi động hệ thống" },
    { icon: BookOpen, label: "Tải tài liệu" },
    { icon: Users, label: "Kết nối người dùng" },
    { icon: Award, label: "Chuẩn bị nội dung" },
  ];

  const loadingMessages = [
    "Đang khởi tạo...",
    "Kết nối cơ sở dữ liệu...",
    "Tải thông tin người dùng...",
    "Hoàn tất...",
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 15;
      });
    }, 200);

    const iconInterval = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % icons.length);
    }, 800);

    const textInterval = setInterval(() => {
      setLoadingText(prev => {
        const currentIndex = loadingMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(iconInterval);
      clearInterval(textInterval);
    };
  }, []);

  const CurrentIcon = icons[currentIcon].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <Sparkles className="h-6 w-6 text-purple-400" />
          </div>
        ))}
      </div>

      {/* Main Loading Content */}
      <div className="relative z-10 text-center space-y-8 p-8">
        {/* Logo/Brand Area */}
        <div className="space-y-4">
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center animate-pulse-scale">
              <CurrentIcon className="h-10 w-10 text-white animate-bounce-gentle" />
            </div>
            
            {/* Rotating Ring */}
            <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-transparent border-t-purple-500 border-r-blue-500 rounded-full animate-spin"></div>
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
            VIA English Academy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
            Hệ thống quản lý tài liệu & hỗ trợ
          </p>
        </div>

        {/* Progress Section */}
        <div className="space-y-4 max-w-md mx-auto">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
          
          {/* Progress Text */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400 animate-pulse">
              {loadingText}
            </span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              {Math.round(Math.min(progress, 100))}%
            </span>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>

        {/* Feature Icons */}
        <div className="flex justify-center space-x-6 mt-8">
          {icons.map((iconItem, index) => (
            <div
              key={index}
              className={`p-3 rounded-full transition-all duration-500 ${
                index === currentIcon
                  ? 'bg-purple-100 dark:bg-purple-900/50 scale-110'
                  : 'bg-gray-100 dark:bg-gray-800 scale-90'
              }`}
            >
              <iconItem.icon className={`h-6 w-6 ${
                index === currentIcon
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-400 dark:text-gray-600'
              }`} />
            </div>
          ))}
        </div>

        {/* Motivational Text */}
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-fade-in-out">
          "Mỗi giây chờ đợi là một bước tiến đến thành công" ✨
        </p>
      </div>
    </div>
  );
}