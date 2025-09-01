// Button styling constants để đảm bảo consistency across toàn bộ ứng dụng

export const BUTTON_STYLES = {
  // Primary action buttons
  primary: {
    blue: "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium",
    green: "bg-green-600 hover:bg-green-700 text-white border border-green-600 hover:border-green-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium",
    orange: "bg-orange-600 hover:bg-orange-700 text-white border border-orange-600 hover:border-orange-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium",
    indigo: "bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 hover:border-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium",
    gradient: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border border-blue-600 hover:border-purple-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg font-medium"
  },
  
  // Secondary action buttons (cancel, outline)
  secondary: {
    outline: "border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 px-6 py-2 rounded-lg font-medium"
  },
  
  // File upload buttons
  upload: {
    blue: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
  }
} as const;

// Helper function để get button style theo type và color
export const getButtonStyle = (type: 'primary' | 'secondary' | 'upload', color: string = 'blue') => {
  if (type === 'secondary') {
    return BUTTON_STYLES.secondary.outline;
  }
  
  if (type === 'upload') {
    return BUTTON_STYLES.upload[color as keyof typeof BUTTON_STYLES.upload] || BUTTON_STYLES.upload.blue;
  }
  
  return BUTTON_STYLES.primary[color as keyof typeof BUTTON_STYLES.primary] || BUTTON_STYLES.primary.blue;
};