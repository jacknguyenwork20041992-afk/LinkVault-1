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
        className={`fixed bottom-20 right-6 z-50 h-16 w-16 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white ${
          isOpen ? 'hidden' : 'flex'
        } items-center justify-center transition-all duration-300 hover:scale-110`}
        data-testid="button-floating-chat"
      >
        <MessageCircle className="h-8 w-8" />
      </Button>

      {/* Chat Bot */}
      <ChatBot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}