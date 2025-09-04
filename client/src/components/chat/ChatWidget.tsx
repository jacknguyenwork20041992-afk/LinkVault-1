import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  userId: string;
  senderId: string;
  senderRole: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface OnlineUser {
  id: string;
  userId: string;
  socketId: string;
  connectedAt: string;
  userAgent: string | null;
  ipAddress: string | null;
}

interface ChatWidgetProps {
  targetUserId?: string; // For admin chatting with specific user
  className?: string;
}

export function ChatWidget({ targetUserId, className }: ChatWidgetProps) {
  const { user } = useAuth();
  const { isConnected, sendMessage, lastMessage } = useWebSocket();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>(targetUserId || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isAdmin = user?.role === 'admin';
  const chatUserId = isAdmin ? selectedUserId : user?.id;

  // Get online users (admin only)
  const { data: onlineUsers = [] } = useQuery<OnlineUser[]>({
    queryKey: ['/api/chat/online-users'],
    enabled: isAdmin && isOpen,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Get chat history
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/chat', chatUserId],
    enabled: !!chatUserId && isOpen,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const endpoint = isAdmin ? `/api/chat/${selectedUserId}/send` : `/api/chat/${user?.id}/send`;
      return apiRequest('POST', endpoint, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', chatUserId] });
      setNewMessage('');
      
      // Send WebSocket message to notify the other party
      if (isConnected) {
        sendMessage({
          type: 'new_message',
          targetUserId: isAdmin ? selectedUserId : 'admin-001',
          senderId: user?.id,
          senderRole: user?.role,
          message: newMessage
        });
      }
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isAdmin ? `/api/chat/${selectedUserId}/mark-read` : `/api/chat/${user?.id}/mark-read`;
      return apiRequest('POST', endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', chatUserId] });
    },
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'new_message') {
      queryClient.invalidateQueries({ queryKey: ['/api/chat'] });
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ['/api/chat/online-users'] });
      }
    }
  }, [lastMessage, queryClient, isAdmin]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen && chatUserId && messages.length > 0) {
      const unreadMessages = messages.filter((msg: Message) => 
        !msg.isRead && msg.senderRole !== user?.role
      );
      if (unreadMessages.length > 0) {
        markAsReadMutation.mutate();
      }
    }
  }, [isOpen, chatUserId, messages, user?.role, markAsReadMutation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chatUserId) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const unreadCount = messages.filter((msg: Message) => 
    !msg.isRead && msg.senderRole !== user?.role
  ).length;

  if (!user) return null;

  return (
    <div className={cn("fixed bottom-4 z-50", !isAdmin ? "right-[460px] sm:right-[500px] md:right-[560px]" : "right-4", className)}>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 px-3 sm:h-14 sm:px-4 md:h-16 md:px-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white shadow-2xl hover:shadow-orange-500/25 transition-colors duration-300 flex items-center justify-center gap-2 md:gap-3 relative"
          data-testid="button-open-chat"
        >
          <div className="p-1 sm:p-1.5 rounded-full bg-white/20">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">
            {isAdmin ? "Chat quản lý" : "Chat cùng Admin"}
          </span>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
              data-testid="badge-unread-count"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "w-96 transition-all duration-200",
          isMinimized ? "h-14" : "h-[500px]"
        )}>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Quản lý Chat' : 'Chat cùng Admin'}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0"
                data-testid="button-minimize-chat"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-4 pt-0 flex flex-col h-[calc(500px-4rem)]">
              {/* Online Users List (Admin only) */}
              {isAdmin && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Người dùng đang online</h4>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {onlineUsers?.length > 0 ? (
                      onlineUsers.map((onlineUser: OnlineUser) => (
                        <Button
                          key={onlineUser.userId}
                          variant={selectedUserId === onlineUser.userId ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setSelectedUserId(onlineUser.userId)}
                          className="w-full justify-start text-xs h-8"
                          data-testid={`button-select-user-${onlineUser.userId}`}
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                          User {onlineUser.userId.slice(0, 8)}...
                        </Button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">Không có người dùng online</p>
                    )}
                  </div>
                </div>
              )}

              {/* Connection Status */}
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                </span>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 mb-4">
                {isLoading ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    Đang tải tin nhắn...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    {isAdmin && !selectedUserId 
                      ? 'Chọn người dùng để bắt đầu chat'
                      : 'Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!'
                    }
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="messages-container">
                    {messages.map((msg: Message) => {
                      const isFromCurrentUser = msg.senderRole === user?.role;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isFromCurrentUser ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-start gap-2 max-w-[80%]",
                              isFromCurrentUser && "flex-row-reverse"
                            )}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {msg.senderRole === 'admin' ? 'A' : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={cn(
                                "rounded-lg px-3 py-2 text-sm",
                                isFromCurrentUser
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}
                              data-testid={`message-${msg.id}`}
                            >
                              <p>{msg.message}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs opacity-70">
                                  {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {isFromCurrentUser && (
                                  <span className="text-xs opacity-70">
                                    {msg.isRead ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              {(!isAdmin || selectedUserId) && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendMessageMutation.isPending || !isConnected}
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending || !isConnected}
                    size="sm"
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}