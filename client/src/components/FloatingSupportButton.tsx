import { useState } from "react";
import { HelpCircle, UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SupportTicketModal from "@/components/modals/SupportTicketModal";
import AccountRequestModal from "@/components/modals/AccountRequestModal";
import ChatBot from "./ChatBot";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { useAuth } from "@/hooks/useAuth";

export default function FloatingSupportButton() {
  const { user } = useAuth();
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
      {/* Floating button cluster - responsive positioning */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-stretch sm:flex-row sm:gap-3 sm:items-center md:bottom-6 md:right-6 md:gap-4">
        {/* Chat Widget - Admin only */}
        {user && user.role === 'admin' && (
          <div className="relative">
            <ChatWidget />
          </div>
        )}
        
        {/* Support Button */}
        <Button
          onClick={handleSupportClick}
          className="h-12 px-3 sm:h-14 sm:px-4 md:h-16 md:px-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white shadow-2xl hover:shadow-blue-500/25 transition-colors duration-300 flex items-center justify-center gap-2 md:gap-3"
          data-testid="button-floating-support"
          aria-label="Hỗ trợ"
        >
          <div className="p-1 sm:p-1.5 rounded-full bg-white/20">
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">Hỗ trợ</span>
        </Button>

        {/* Account Request Button */}
        <Button
          onClick={handleAccountRequestClick}
          className="h-12 px-3 sm:h-14 sm:px-4 md:h-16 md:px-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 text-white shadow-2xl hover:shadow-emerald-500/25 transition-colors duration-300 flex items-center justify-center gap-2 md:gap-3"
          data-testid="button-floating-account-request"
          aria-label="Yêu cầu tài khoản"
        >
          <div className="p-1 sm:p-1.5 rounded-full bg-white/20">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-center leading-tight">
            <span className="hidden sm:inline">Request for<br />Student Accounts</span>
            <span className="sm:hidden">Account Request</span>
          </span>
        </Button>

        {/* AI Chat Button */}
        <Button
          onClick={handleChatClick}
          className={`h-12 px-3 sm:h-14 sm:px-4 md:h-16 md:px-6 rounded-xl md:rounded-2xl shadow-2xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 hover:from-purple-600 hover:via-violet-700 hover:to-indigo-700 hover:shadow-purple-500/25 text-white ${
            isChatBotOpen ? 'opacity-50' : 'opacity-100'
          } items-center justify-center gap-2 md:gap-3 transition-colors duration-300 flex`}
          data-testid="button-floating-chat"
          disabled={isChatBotOpen}
        >
          <div className="p-1 sm:p-1.5 rounded-full bg-white/20">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">
            <span className="hidden sm:inline">Trợ lý AI-R&D</span>
            <span className="sm:hidden">AI Chat</span>
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

      <ChatBot isOpen={isChatBotOpen} onClose={() => setIsChatBotOpen(false)} />
    </>
  );
}