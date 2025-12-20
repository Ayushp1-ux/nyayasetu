import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function ChatAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const systemMessage: Message = {
    role: "system",
    content: "You are a helpful legal assistant providing accurate legal information.",
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };

    // Add user message locally
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const payloadMessages =
        messages.length === 0
          ? [systemMessage, userMessage]
          : [systemMessage, ...messages, userMessage];

      const res = await fetch(
        "https://wutkiwsapywuxdirpngh.supabase.co/functions/v1/openrouter-chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payloadMessages }),
        }
      );

      const data = await res.json();

      // OpenRouter-style response: choices[0].message.content
      const aiContent =
        data?.choices?.[0]?.message?.content ??
        "No answer from AI.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiContent },
      ]);
    } catch (err) {
      console.error("AI error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error getting response. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col h-screen w-screen border rounded-none shadow-none bg-white dark:bg-gray-900 px-6 py-4"
      role="region"
      aria-label="AI Legal Assistant chat interface"
    >
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-indigo-300 h-full"
        tabIndex={0}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[70%] p-3 rounded-lg whitespace-pre-wrap break-words ${
              msg.role === "user"
                ? "bg-indigo-600 text-white self-end rounded-br-none"
                : msg.role === "assistant"
                ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 self-start rounded-bl-none"
                : "bg-yellow-200 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-300 self-center rounded-lg font-semibold italic"
            }`}
            role="article"
            aria-label={
              msg.role === "user"
                ? "User message"
                : msg.role === "assistant"
                ? "AI response"
                : "System message"
            }
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ))}
        {loading && (
          <div className="text-gray-500 italic select-none" aria-live="polite">
            AI is typing...
          </div>
        )}
      </div>
      <div className="flex space-x-3 w-full pb-6">
        <textarea
          rows={2}
          className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
          placeholder="Ask your legal question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          aria-label="Type your legal question"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
}
