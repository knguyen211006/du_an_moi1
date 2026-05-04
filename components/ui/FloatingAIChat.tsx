"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Lock, LogIn } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; 
import Link from 'next/link';

// 👇 CHÚ Ý: Import hàm onAuthStateChanged từ thư viện gốc
import { onAuthStateChanged } from 'firebase/auth'; 
// 👇 Import biến auth đã được khởi tạo sẵn từ Mật thất Firebase của ngài
import { auth } from '@/lib/firebase/config';

export default function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'Chào bạn! Mình là AI trợ giảng. Bạn muốn hỏi gì về tiếng Trung hôm nay?' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 👇 Lắng nghe trạng thái đăng nhập một cách sạch sẽ và an toàn
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setAuthLoading(false);
    });

    return () => unsubscribe(); // Dọn dẹp chân khí khi thoát
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentUser) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      if (!response.ok) {
        let errorMsg = 'Có lỗi xảy ra khi gọi API.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.reply || errorMsg;
        } catch {
          try {
            const errorText = await response.text();
            errorMsg = errorText;
          } catch {}
        }
        console.error('Chat API error:', response.status, response.statusText, errorMsg);
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Lỗi: ${errorMsg}` }]);
        setIsLoading(false);
        return;
      }

      // Handle stream response
      const reader = response.body?.getReader();
      if (!reader) {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Không thể đọc phản hồi.' }]);
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantMessage = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          assistantMessage += chunk;
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = assistantMessage;
            return newMsgs;
          });
        }
      } catch (streamErr) {
        console.error('Stream error:', streamErr);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Lỗi: ${error instanceof Error ? error.message : String(error)}` }]);
      setIsLoading(false);
    }
  };

  // Nút mở chatbox (Chưa click)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-fade-in">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="font-bold flex items-center gap-2">
          <span>AI Trợ Giảng</span>
          <span className="text-xl">🤖</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Nội dung Chatbox */}
      <div className="flex-1 overflow-y-auto bg-gray-50 text-sm">
        {authLoading ? (
          // Đang tải kiểm tra đăng nhập
          <div className="flex items-center justify-center h-full p-4">
            <div className="animate-pulse space-y-4 w-full">
              <div className="bg-gray-200 h-8 rounded-lg w-3/4 mx-auto"></div>
              <div className="bg-gray-200 h-6 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : !currentUser ? (
          // 👇 MÀN HÌNH KHÓA: Khi chưa đăng nhập 👇
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-2">
              <Lock className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Tính năng giới hạn</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed pb-4">
              Vui lòng đăng nhập để được AI giải đáp mọi thắc mắc về tiếng Trung nhé!
            </p>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)} // Click xong tự động thu gọn Chatbox lại
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <LogIn className="w-5 h-5" />
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          // Khu vực tin nhắn (Khi đã đăng nhập)
          <div className="p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-sm'
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc ml-6 mb-2 space-y-1 mt-2" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal ml-6 mb-2 space-y-1 mt-2" {...props} />,
                        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold text-blue-800 dark:text-blue-300" {...props} />,
                        code: ({ node, ...props }) => <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-sm" {...props} />,
                        pre: ({ node, ...props }) => <pre className="bg-slate-900 text-white p-4 rounded-xl overflow-x-auto mt-4" {...props} />,
                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-400 pl-4 italic my-4 bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-r-lg" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 border border-gray-100 shadow-sm p-3 rounded-2xl rounded-bl-sm animate-pulse">
                  Đang suy nghĩ...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 👇 CỤM FORM NHẬP LIỆU: Chỉ hiện thị khi ĐÃ ĐĂNG NHẬP 👇 */}
      {!authLoading && currentUser && (
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi mình điều gì đó..."
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      )}
    </div>
  );
}