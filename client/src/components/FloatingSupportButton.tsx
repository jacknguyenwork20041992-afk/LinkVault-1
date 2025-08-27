import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingSupportButton() {
  const handleSupportClick = () => {
    window.open("https://forms.gle/LYhsWMt67N14WER97", "_blank");
  };

  return (
    <Button
      onClick={handleSupportClick}
      className="fixed bottom-6 right-6 h-16 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center gap-2"
      data-testid="button-floating-support"
      aria-label="Hỗ trợ"
    >
      <HelpCircle className="h-5 w-5" />
      <span className="text-sm font-medium whitespace-nowrap">HỖ TRỢ</span>
    </Button>
  );
}