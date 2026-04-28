import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage, resetChat, SUGGESTED_QUESTIONS, ChatContext } from '../../services/gemini';
import { useAuth } from '../../hooks/useAuth';
import { useNeeds } from '../../hooks/useNeeds';
import { useTasks } from '../../hooks/useTasks';
import { useVolunteer } from '../../hooks/useVolunteers';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

function MarkdownText({ text }: { text: string }) {
  // Simple markdown: bold, bullet points, links
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          const content = line.trim().slice(2);
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-current opacity-60 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
            </div>
          );
        }

        // Numbered list
        const numMatch = line.trim().match(/^(\d+)\.\s(.+)/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-current opacity-60 shrink-0 font-medium">{numMatch[1]}.</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }} />
            </div>
          );
        }

        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        );
      })}
    </div>
  );
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-black/10 px-1 rounded text-xs">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="underline">$1</a>');
}

export default function GeminiChat() {
  const { user, role } = useAuth();
  const { needs } = useNeeds();
  const { tasks } = useTasks();
  const { volunteer } = useVolunteer(user?.uid ?? '');

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Build context from live Firestore data
  const ctx: ChatContext = {
    role: role as ChatContext['role'],
    userName: volunteer?.name ?? user?.email ?? undefined,
    needsCount: needs.length,
    criticalNeedsCount: needs.filter(n => n.urgencyScore >= 75).length,
    openTasksCount: tasks.filter(t => t.status === 'open' || t.status === 'assigned').length,
    completedTasksCount: tasks.filter(t => t.status === 'completed').length,
    topNeedAreas: needs
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 3)
      .map(n => n.area),
    volunteerSkills: volunteer?.skills,
    volunteerReliability: volunteer?.reliabilityScore,
    volunteerTasksCompleted: volunteer?.tasksCompleted,
  };

  const suggestions = role === 'coordinator'
    ? SUGGESTED_QUESTIONS.coordinator
    : SUGGESTED_QUESTIONS.volunteer;

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcome = role === 'coordinator'
        ? `Hi! I'm your AI assistant 🤖\n\nI can see you have **${needs.length} needs** in the system${needs.filter(n => n.urgencyScore >= 75).length > 0 ? `, including **${needs.filter(n => n.urgencyScore >= 75).length} critical** ones` : ''}. How can I help you coordinate today?`
        : `Hi ${volunteer?.name ?? 'there'}! I'm your AI assistant 🤖\n\nI'm here to help you with your volunteer tasks, safety tips, and anything else you need. What can I help you with?`;

      setMessages([{
        id: 'welcome',
        role: 'assistant',
        text: welcome,
        timestamp: new Date(),
      }]);
    }
  }, [open]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setShowSuggestions(false);

    const response = await sendMessage(text.trim(), ctx);

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: response,
      timestamp: new Date(),
    }]);
    setLoading(false);
  }, [loading, ctx]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }

  function handleReset() {
    resetChat();
    setMessages([]);
    setShowSuggestions(true);
    setTimeout(() => {
      if (open) {
        const welcome = role === 'coordinator'
          ? `Hi! I'm your AI assistant 🤖\n\nHow can I help you coordinate today?`
          : `Hi! I'm your AI assistant 🤖\n\nHow can I help you today?`;
        setMessages([{ id: 'welcome', role: 'assistant', text: welcome, timestamp: new Date() }]);
      }
    }, 100);
  }

  const roleColor = role === 'coordinator' ? 'from-red-600 to-red-700' : 'from-green-600 to-green-700';
  const roleLabel = role === 'coordinator' ? 'Coordinator AI' : 'Volunteer AI';

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br ${roleColor} text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${open ? 'scale-90' : 'hover:scale-110'}`}
        title="AI Assistant"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
        {/* Unread dot */}
        {!open && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden slide-up"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className={`bg-gradient-to-r ${roleColor} px-4 py-3 flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">🤖</div>
              <div>
                <p className="text-white font-bold text-sm">{roleLabel} Assistant</p>
                <p className="text-white/70 text-xs">Powered by Gemini</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} title="New conversation"
                className="text-white/70 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-red-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant'
                    ? <MarkdownText text={msg.text} />
                    : <p>{msg.text}</p>
                  }
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Suggested questions */}
            {showSuggestions && messages.length <= 1 && !loading && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-gray-400 font-medium">Suggested questions:</p>
                {suggestions.map((q) => (
                  <button key={q} onClick={() => handleSend(q)}
                    className="w-full text-left text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 shrink-0">
            <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200 focus-within:border-red-400 focus-within:bg-white transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none max-h-24"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || loading}
                className="w-8 h-8 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all shrink-0"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-1.5">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}
