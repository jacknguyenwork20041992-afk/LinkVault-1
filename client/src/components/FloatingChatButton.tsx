import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import ChatBot from "./ChatBot";

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-20 z-50 h-12 w-12 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white ${
          isOpen ? 'hidden' : 'flex'
        } items-center justify-center transition-all duration-300 hover:scale-110`}
        data-testid="button-floating-chat"
        style={{ position: 'fixed', bottom: '24px', right: '80px' }}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      {/* Chat Bot */}
      <ChatBot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}