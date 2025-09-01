import { useState } from "react";
import { HelpCircle, UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportTicketModal from "@/components/modals/SupportTicketModal";
import AccountRequestModal from "@/components/modals/AccountRequestModal";
import ChatBot from "./ChatBot";

export default function FloatingSupportButton() {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isAccountRequestModalOpen, setIsAccountRequestModalOpen] = useState(false);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);

  const handleSupportClick = () => {
    setIsSupportModalOpen(true);
  };

  const handleAccountRequestClick = () => {
    setIsAccountRequestModalOpen(true);
  };

  const handleChatClick = () => {
    setIsChatBotOpen(true);
  };

  return (
    <>
      {/* Floating button cluster - positioned at bottom right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {/* Support Button */}
        <Button
          onClick={handleSupportClick}
          className="h-14 px-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 animate-gentle-shake"
          data-testid="button-floating-support"
          aria-label="Hỗ trợ"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="text-sm font-medium whitespace-nowrap">Hỗ trợ</span>
        </Button>

        {/* Account Request Button */}
        <Button
          onClick={handleAccountRequestClick}
          className="h-14 px-4 rounded-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          data-testid="button-floating-account-request"
          aria-label="Yêu cầu tài khoản"
        >
          <UserPlus className="h-5 w-5" />
          <span className="text-xs font-medium whitespace-nowrap leading-tight">
            Request for<br />
            Student Accounts
          </span>
        </Button>

        {/* AI Chat Button */}
        <Button
          onClick={handleChatClick}
          className={`h-14 px-4 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white ${
            isChatBotOpen ? 'hidden' : 'flex'
          } items-center justify-center gap-2 transition-all duration-300 hover:scale-105`}
          data-testid="button-floating-chat"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium whitespace-nowrap">Trợ lý AI-R&D</span>
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

      <ChatBot isOpen={isChatBotOpen} onClose={() => setIsChatBotOpen(false)} />
    </>
  );
}