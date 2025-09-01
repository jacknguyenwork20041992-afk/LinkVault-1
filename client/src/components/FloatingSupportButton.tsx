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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end">
        {/* Support Button */}
        <Button
          onClick={handleSupportClick}
          className="group h-16 px-6 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 flex items-center justify-center gap-3 animate-gentle-shake transform hover:scale-110 hover:-translate-y-1"
          data-testid="button-floating-support"
          aria-label="Hỗ trợ"
        >
          <div className="p-1.5 rounded-full bg-white/20 group-hover:bg-white/30 transition-all duration-300">
            <HelpCircle className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold tracking-wide">Hỗ trợ</span>
        </Button>

        {/* Account Request Button */}
        <Button
          onClick={handleAccountRequestClick}
          className="group h-16 px-6 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:via-green-700 hover:to-teal-700 text-white shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 flex items-center justify-center gap-3 transform hover:scale-110 hover:-translate-y-1"
          data-testid="button-floating-account-request"
          aria-label="Yêu cầu tài khoản"
        >
          <div className="p-1.5 rounded-full bg-white/20 group-hover:bg-white/30 transition-all duration-300">
            <UserPlus className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-center leading-tight">
            Request for<br />
            Student Accounts
          </span>
        </Button>

        {/* AI Chat Button */}
        <Button
          onClick={handleChatClick}
          className={`group h-16 px-6 rounded-2xl shadow-2xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 hover:from-purple-600 hover:via-violet-700 hover:to-indigo-700 hover:shadow-purple-500/25 text-white ${
            isChatBotOpen ? 'hidden' : 'flex'
          } items-center justify-center gap-3 transition-all duration-500 transform hover:scale-110 hover:-translate-y-1`}
          data-testid="button-floating-chat"
        >
          <div className="p-1.5 rounded-full bg-white/20 group-hover:bg-white/30 transition-all duration-300">
            <MessageCircle className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold tracking-wide">Trợ lý AI-R&D</span>
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