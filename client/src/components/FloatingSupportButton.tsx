import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportTicketModal from "@/components/modals/SupportTicketModal";

export default function FloatingSupportButton() {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const handleSupportClick = () => {
    setIsSupportModalOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleSupportClick}
        className="fixed bottom-6 left-6 h-16 px-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center gap-2 animate-gentle-shake"
        data-testid="button-floating-support"
        aria-label="Hỗ trợ"
      >
        <HelpCircle className="h-5 w-5" />
        <span className="text-sm font-medium whitespace-nowrap">Hỗ trợ</span>
      </Button>

      <SupportTicketModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </>
  );
}