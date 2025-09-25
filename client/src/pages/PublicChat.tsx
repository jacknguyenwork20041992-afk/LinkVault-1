import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function PublicChat() {
  const [messages, setMessages] = useState<Array<{ content: string; isUser: boolean }>>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState(false);

  const addMessage = (content: string, isUser = false) => {
    setMessages(prev => [...prev, { content, isUser }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const message = inputValue.trim();
    if (!message) return;
    
    // Add user message
    addMessage(message, true);
    setInputValue("");
    setIsLoading(true);
    setRateLimitWarning(false);
    
    try {
      try {
        const response = await apiRequest('POST', '/api/public-chat', { message });
        const data = await response.json();
        
        if (response.status === 429) {
          setRateLimitWarning(true);
        } else {
          addMessage(data.message, false);
        }
      } catch (error: any) {
        if (error.message.includes('429')) {
          setRateLimitWarning(true);
        } else {
          addMessage('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.', false);
        }
      }
    } catch (error) {
      addMessage('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.', false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">🤖 AI Trợ lý</h1>
          <p className="opacity-90">VIA English Academy - Hỗ trợ học tập 24/7</p>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-600 py-8">
              <div className="text-lg">👋 Xin chào! Tôi là AI trợ lý của VIA English Academy.</div>
              <div className="mt-2">Hãy hỏi tôi bất kỳ câu hỏi nào về học tiếng Anh!</div>
              <div className="text-sm text-gray-500 mt-2">(Giới hạn: 10 câu hỏi/giờ)</div>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
              {!msg.isUser && (
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  AI
                </div>
              )}
              <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                msg.isUser 
                  ? 'bg-purple-600 text-white rounded-br-sm' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content}
                </div>
              </div>
              {msg.isUser && (
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  U
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                AI
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {rateLimitWarning && (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg">
              ⚠️ Bạn đã sử dụng hết số lượt hỏi trong giờ này. Vui lòng thử lại sau.
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              maxLength={1000}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-full focus:border-purple-500 focus:outline-none"
              disabled={isLoading}
              required
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}