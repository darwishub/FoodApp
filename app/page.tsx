"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import NutritionLabel, { NutritionData } from "@/components/NutritionLabel";
import NutritionLabelSkeleton from "@/components/NutritionLabelSkeleton";
import ChatInterface, { Message } from "@/components/ChatInterface";

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"label" | "chat">("chat");

  const analyzeImage = async (
    base64: string,
    mimeType: string,
    preview: string,
    isNewUpload: boolean
  ) => {
    setImagePreview(preview);
    setIsAnalyzing(true);
    if (isNewUpload) {
      setNutrition(null);
      setMessages([]);
      setError(null);
    }

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error || "Analysis failed");

      setNutrition(data.nutrition);

      if (isNewUpload) {
        const systemSeed: Message = {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: "text", text: "This is the food image I've uploaded. I'll ask you questions about it." },
          ],
          displayContent: undefined,
        };
        const seedReply: Message = {
          role: "assistant",
          content: `Got it! I've scanned the nutrition info for you. Are you looking to track calories, check for allergens, or just curious about what's in it?`,
          displayContent: `Got it! I've scanned the nutrition info for you. Are you looking to track calories, check for allergens, or just curious about what's in it?`,
        };
        setMessages([systemSeed, seedReply]);
      } else {
        const imageMsg: Message = {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: "text", text: "Here's a new food I'd like to ask about." },
          ],
          displayContent: "New food uploaded",
          imagePreviewUrl: preview,
        };
        const replyMsg: Message = {
          role: "assistant",
          content: `Got the new food! I've updated the nutrition label. What would you like to know about it?`,
          displayContent: `Got the new food! I've updated the nutrition label. What would you like to know about it?`,
        };
        setMessages((prev) => [...prev, imageMsg, replyMsg]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (isNewUpload) {
        setError(msg);
      } else {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: msg,
          displayContent: msg,
        }]);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (base64: string, mimeType: string, preview: string) =>
    analyzeImage(base64, mimeType, preview, true);

  const handleNewImageInChat = (base64: string, mimeType: string, preview: string) =>
    analyzeImage(base64, mimeType, preview, false);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = { role: "user", content: text, displayContent: text };
    const withUser = [...messages, userMessage];
    setMessages(withUser);
    setIsChatActive(true);

    try {
      const apiMessages = withUser.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Chat failed");
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([...withUser, {
          role: "assistant",
          content: accumulated,
          displayContent: accumulated,
        }]);
      }
      // flush remaining bytes
      const tail = decoder.decode();
      if (tail) {
        accumulated += tail;
        setMessages([...withUser, {
          role: "assistant",
          content: accumulated,
          displayContent: accumulated,
        }]);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages([...withUser, {
        role: "assistant",
        content: `Sorry, I ran into an error: ${errMsg}`,
        displayContent: `Sorry, I ran into an error: ${errMsg}`,
      }]);
    } finally {
      setIsChatActive(false);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setNutrition(null);
    setMessages([]);
    setError(null);
    setIsAnalyzing(false);
    setMobileTab("chat");
  };

  const showResults = nutrition || isAnalyzing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-gray-900 font-bold text-lg leading-none">NutriScan</h1>
              <p className="text-gray-500 text-xs">AI Food Nutrition Analyzer</p>
            </div>
          </div>
          {showResults && (
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Start over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!showResults ? (
          /* ── Upload screen ── */
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">What are you eating?</h2>
              <p className="text-gray-500">
                Upload a photo of any food to get instant FDA-format nutrition facts
              </p>
            </div>

            <ImageUpload onImageUpload={handleImageUpload} isAnalyzing={isAnalyzing} />

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { icon: "📸", title: "Upload Photo", desc: "Any food, any angle" },
                { icon: "🔬", title: "AI Analysis", desc: "Powered by Gemini" },
                { icon: "📊", title: "FDA Label", desc: "Official format" },
              ].map((item) => (
                <div key={item.title} className="text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-gray-900 font-semibold text-sm">{item.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── Results screen ── */
          <div>
            {/* Mobile tabs */}
            <div className="flex lg:hidden mb-4 bg-white rounded-xl border border-gray-200 p-1 gap-1">
              {(["label", "chat"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    mobileTab === tab
                      ? "bg-emerald-500 text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "label" ? "Nutrition Facts" : "Chat"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: image + label */}
              <div className={`lg:col-span-1 space-y-4 ${mobileTab === "chat" ? "hidden lg:block" : ""}`}>
                {imagePreview && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Analyzed food"
                        className="w-full max-h-56 object-cover"
                      />
                      {isAnalyzing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                          <div className="flex gap-1 mb-2">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="w-2.5 h-2.5 bg-white rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                          <p className="text-white text-xs font-medium">Analyzing...</p>
                        </div>
                      )}
                    </div>
                    {nutrition && (
                      <div className="px-4 py-3">
                        <h3 className="font-bold text-gray-900 text-lg">{nutrition.foodName}</h3>
                        <p className="text-gray-500 text-sm">Per {nutrition.servingSize}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                  {nutrition ? (
                    <NutritionLabel data={nutrition} />
                  ) : (
                    <NutritionLabelSkeleton />
                  )}
                </div>
              </div>

              {/* Right: chat */}
              <div className={`lg:col-span-2 ${mobileTab === "label" ? "hidden lg:block" : ""}`}>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <h3 className="font-semibold text-gray-900">Ask about this food</h3>
                  </div>
                  <div className="flex-1 min-h-0">
                    <ChatInterface
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      onNewImage={handleNewImageInChat}
                      isChatActive={isChatActive}
                      isAnalyzing={isAnalyzing}
                      foodName={nutrition?.foodName}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
