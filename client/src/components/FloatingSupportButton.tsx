import { useState } from "react";
import { HelpCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportTicketModal from "@/components/modals/SupportTicketModal";
import AccountRequestModal from "@/components/modals/AccountRequestModal";

export default function FloatingSupportButton() {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isAccountRequestModalOpen, setIsAccountRequestModalOpen] = useState(false);

  const handleSupportClick = () => {
    setIsSupportModalOpen(true);
  };

  const handleAccountRequestClick = () => {
    setIsAccountRequestModalOpen(true);
  };

  return (
    <>
      {/* Floating button container */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
        {/* Support Button */}
        <Button
          onClick={handleSupportClick}
          className="h-16 px-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 animate-gentle-shake"
          data-testid="button-floating-support"
          aria-label="Hỗ trợ"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="text-sm font-medium whitespace-nowrap">Hỗ trợ</span>
        </Button>

        {/* Account Request Button */}
        <Button
          onClick={handleAccountRequestClick}
          className="h-16 px-4 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          data-testid="button-floating-account-request"
          aria-label="Yêu cầu tài khoản"
        >
          <UserPlus className="h-5 w-5" />
          <span className="text-xs font-medium whitespace-nowrap leading-tight">
            Request for<br />
            Student Accounts
          </span>
        </Button>
      </div>

      <SupportTicketModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      <AccountRequestModal
        isOpen={isAccountRequestModalOpen}
        onClose={() => setIsAccountRequestModalOpen(false)}
      />
    </>
  );
}