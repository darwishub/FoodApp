"use client";

import { useEffect, useRef, useState } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  displayContent?: string;
  imagePreviewUrl?: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onNewImage: (base64: string, mimeType: string, preview: string) => void;
  isChatActive: boolean;   // disables input for entire request duration
  isAnalyzing: boolean;
  foodName?: string;
}

function buildSuggestions(foodName: string): string[] {
  const name = foodName || "this food";
  return [
    `Good for weight loss?`,
    `Can I eat ${name} daily?`,
    `What nutrients am I missing?`,
  ];
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z" />
          <path d="M10 6a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 11V7a1 1 0 011-1z" />
        </svg>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyzingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z" />
        </svg>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">Analyzing nutrition...</span>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const text =
    message.displayContent ||
    (typeof message.content === "string" ? message.content : "");

  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
      )}
      <div className={`max-w-[78%] rounded-2xl text-sm leading-relaxed overflow-hidden
        ${isUser ? "bg-emerald-500 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"}`}
      >
        {message.imagePreviewUrl && (
          <img
            src={message.imagePreviewUrl}
            alt="Uploaded food"
            className="w-full max-h-40 object-cover"
          />
        )}
        {text && (
          <p className="px-4 py-2.5 whitespace-pre-wrap">{text}</p>
        )}
      </div>
    </div>
  );
}

export default function ChatInterface({
  messages,
  onSendMessage,
  onNewImage,
  isChatActive,
  isAnalyzing,
  foodName,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = isChatActive || isAnalyzing;

  // Show typing dots only while waiting for the first chunk (last assistant message has no content yet)
  const lastMsg = messages.at(-1);
  const showTypingDots =
    isChatActive &&
    (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.displayContent);

  const displayMessages = messages.filter(
    (m) => m.displayContent !== undefined || typeof m.content === "string"
  );

  const suggestions = foodName
    ? buildSuggestions(foodName).filter((s) => !dismissedSuggestions.has(s))
    : [];

  // Scroll to bottom without touching page scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, isChatActive, isAnalyzing]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    // Reset textarea height manually before state update to avoid layout jump
    if (inputRef.current) inputRef.current.style.height = "40px";
    onSendMessage(text);
  };

  const handleSuggestion = (text: string) => {
    if (busy) return;
    setDismissedSuggestions((prev) => new Set(prev).add(text));
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    // Reset so the same file can be re-uploaded
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const base64 = result.split(",")[1];
      onNewImage(base64, file.type, result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">Ask anything about this food</p>
            <p className="text-gray-400 text-xs mt-1">Tap a suggestion below or type your own</p>
          </div>
        ) : (
          displayMessages.map((msg, i) => <ChatBubble key={i} message={msg} />)
        )}

        {isAnalyzing && <AnalyzingIndicator />}
        {showTypingDots && <TypingIndicator />}

        {/* Suggestion chips */}
        {suggestions.length > 0 && !busy && (
          <div className="mt-2 mb-3">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-2">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1.5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3 bg-white">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* Image upload button */}
          <label
            className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-gray-300 cursor-pointer transition-colors
              ${busy ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 hover:border-gray-400"}`}
            title="Upload a new food image"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={busy}
            />
          </label>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "40px";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about ingredients, calories, health tips..."
            rows={1}
            style={{ height: "40px" }}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-colors max-h-[120px] overflow-y-auto"
            disabled={busy}
          />

          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="w-10 h-10 flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line · 📷 to swap food
        </p>
      </div>
    </div>
  );
}
