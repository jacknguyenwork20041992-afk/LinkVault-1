import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User,
  Loader2,
  Trash2,
  Plus
} from "lucide-react";
import type { ChatConversation, ChatMessage } from "@shared/schema";

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [message, setMessage] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch conversations
  const { data: conversations = [] } = useQuery<ChatConversation[]>({
    queryKey: ["/api/chat/conversations"],
    enabled: isOpen,
    refetchOnWindowFocus: false,
  });

  // Fetch current conversation messages
  const { data: currentConversation } = useQuery<ChatConversation & { messages: ChatMessage[] }>({
    queryKey: ["/api/chat/conversations", currentConversationId],
    enabled: isOpen && !!currentConversationId,
    refetchOnWindowFocus: false,
  });

  // Update messages when conversation changes
  useEffect(() => {
    if (currentConversation?.messages) {
      setMessages(currentConversation.messages);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; conversationId?: string }): Promise<{message: ChatMessage, conversationId: string}> => {
      const response = await apiRequest("POST", "/api/chat", data);
      return response.json();
    },
    onSuccess: (data) => {
      const { message: aiMessage, conversationId } = data;
      
      // Update messages state
      setMessages(prev => [...prev, aiMessage]);
      
      // Set conversation ID if it's a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
      }
      
      // Refresh conversations list
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    },
    onError: (error: any) => {
      console.error("Chat error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("DELETE", `/api/chat/conversations/${conversationId}`);
    },
    onSuccess: () => {
      setCurrentConversationId(null);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      toast({
        title: "Thành công",
        description: "Đã xóa cuộc trò chuyện",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa cuộc trò chuyện",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    const userMessage = {
      id: Date.now().toString(),
      conversationId: currentConversationId || "",
      role: "user" as const,
      content: message.trim(),
      createdAt: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    
    // Send message
    sendMessageMutation.mutate({
      message: message.trim(),
      conversationId: currentConversationId || undefined,
    });

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const selectConversation = (conversation: ChatConversation) => {
    setCurrentConversationId(conversation.id);
  };

  const deleteConversation = (conversationId: string) => {
    deleteConversationMutation.mutate(conversationId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-end sm:justify-end p-2 sm:p-4">
      <Card className="w-full h-full sm:w-[500px] sm:h-[700px] flex flex-col shadow-2xl">
        <CardHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-blue-600" />
              Trợ lý AI-R&D
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewConversation}
                disabled={sendMessageMutation.isPending}
                data-testid="button-new-conversation"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-3 gap-3 min-h-0 overflow-hidden">
          {/* Conversations Sidebar - Mobile: Hidden when in conversation */}
          <div className={`${currentConversationId ? 'hidden sm:block' : 'block'} ${currentConversationId ? 'sm:w-full' : 'w-full'}`}>
            <div className="text-sm font-medium mb-2">Cuộc trò chuyện</div>
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted ${
                      currentConversationId === conv.id ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => selectConversation(conv)}
                    data-testid={`conversation-${conv.id}`}
                  >
                    <div className="flex-1 truncate">
                      <div className="text-sm font-medium truncate">{conv.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString('vi-VN') : ''}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="h-6 w-6 p-0"
                      data-testid={`delete-conversation-${conv.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Messages */}
          <div className={`flex-1 flex flex-col min-h-0 ${!currentConversationId && conversations.length > 0 ? 'hidden sm:flex' : 'flex'}`}>
            <ScrollArea className="flex-1 pr-2 overflow-hidden">
              <div className="space-y-3 max-w-full">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Chào bạn! Tôi là trợ lý AI của VIA R&D Department.</p>
                    <p className="text-sm">Hãy hỏi tôi về chương trình học, tài liệu, hoặc bất cứ điều gì bạn muốn biết!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={`${msg.id}-${index}`}
                      className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[75%] p-3 rounded-lg overflow-hidden ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-muted"
                        }`}
                        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                      >
                        <div className="text-sm whitespace-pre-wrap break-words overflow-hidden">{msg.content}</div>
                      </div>

                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {sendMessageMutation.isPending && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Đang suy nghĩ...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="flex gap-2 pt-3 border-t">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={sendMessageMutation.isPending}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="sm"
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}