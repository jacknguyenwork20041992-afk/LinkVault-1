import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingSupportButton() {
  const handleSupportClick = () => {
    window.open("https://forms.gle/LYhsWMt67N14WER97", "_blank");
  };

  return (
    <Button
      onClick={handleSupportClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center"
      data-testid="button-floating-support"
      aria-label="Hỗ trợ"
    >
      <HelpCircle className="h-6 w-6" />
    </Button>
  );
}