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
        className={`fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white ${
          isOpen ? 'hidden' : 'flex'
        } items-center justify-center transition-all duration-300 hover:scale-110`}
        data-testid="button-floating-chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Bot */}
      <ChatBot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}