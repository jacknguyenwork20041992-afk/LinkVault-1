import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

interface ThemeSetting {
  id: string;
  themeName: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export function useTheme() {
  // Get active theme from API
  const { data: activeTheme, isLoading } = useQuery<ThemeSetting>({
    queryKey: ["/api/themes/active"],
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Apply theme to document body
  useEffect(() => {
    if (activeTheme?.themeName) {
      // Remove any existing theme classes
      document.body.classList.remove(
        'theme-default',
        'theme-tet',
        'theme-christmas',
        'theme-halloween',
        'theme-mid_autumn',
        'theme-teachers_day'
      );
      
      // Add the active theme class
      document.body.classList.add(`theme-${activeTheme.themeName}`);
    } else {
      // Default theme
      document.body.classList.remove(
        'theme-tet',
        'theme-christmas',
        'theme-halloween',
        'theme-mid_autumn',
        'theme-teachers_day'
      );
      document.body.classList.add('theme-default');
    }
  }, [activeTheme?.themeName]);

  return {
    activeTheme,
    isLoading,
    themeName: activeTheme?.themeName || 'default',
    displayName: activeTheme?.displayName || 'Mặc định',
  };
}