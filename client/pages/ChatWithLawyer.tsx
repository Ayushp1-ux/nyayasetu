import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ArrowLeft, Send, Star, Check, Paperclip, Lock } from "lucide-react";
import RatingModal from "../components/ui/RatingModal";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

export default function ChatWithLawyer() {
  const { lawyerId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [otherPersonName, setOtherPersonName] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);

  // NEW: file + close‑chat state
  const [file, setFile] = useState<File | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [closing, setClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initChat();
  }, [lawyerId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user && lawyerId) {
        fetchMessages();
        fetchChatStatus();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [user, lawyerId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function initChat() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUser(user);

      // Get current user's role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setCurrentUserRole(profileData?.role || null);

      // Existing rating check
      if (lawyerId) {
        const { data: existingRating } = await supabase
          .from("lawyer_reviews")
          .select("rating")
          .eq("user_id", user.id)
          .eq("lawyer_id", lawyerId)
          .single();

        if (existingRating) {
          setHasRated(true);
          setMyRating(existingRating.rating);
        }
      }

      if (lawyerId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", lawyerId)
          .single();

        if (profile) {
          setOtherPersonName(profile.full_name || "User");
        } else {
          setOtherPersonName("User");
        }
      }

      await fetchMessages();
      await fetchChatStatus();
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages() {
    if (!user || !lawyerId) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${lawyerId}),and(sender_id.eq.${lawyerId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as Message[]);
    }
  }

  async function fetchChatStatus() {
    if (!user || !lawyerId) return;

    const first = user.id < lawyerId ? user.id : lawyerId;
    const second = user.id < lawyerId ? lawyerId : user.id;

    const { data } = await supabase
      .from("chat_status")
      .select("is_closed")
      .eq("user_a", first)
      .eq("user_b", second)
      .maybeSingle();

    if (data) setIsClosed(data.is_closed);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      alert("Max 10 MB file size.");
      return;
    }
    setFile(f);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !lawyerId) return;
    if (isClosed) return;
    if (!newMessage.trim() && !file) return;

    setSending(true);

    try {
      let file_url: string | null = null;
      let file_name: string | null = null;

      if (file) {
        const path = `${user.id}/${lawyerId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("chat-files")
          .upload(path, file);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("chat-files")
          .getPublicUrl(data.path);

        file_url = publicUrlData.publicUrl;
        file_name = file.name;
      }

      const { error } = await supabase.from("messages").insert([
        {
          sender_id: user.id,
          receiver_id: lawyerId,
          content: newMessage.trim() || null,
          file_url,
          file_name,
        },
      ]);

      if (!error) {
        setNewMessage("");
        setFile(null);
        await fetchMessages();
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setSending(false);
    }
  }

  async function handleCloseChat() {
    if (!user || !lawyerId || isClosed) return;
    if (!confirm("Close this chat? You won't be able to send new messages.")) {
      return;
    }

    try {
      setClosing(true);
      const first = user.id < lawyerId ? user.id : lawyerId;
      const second = user.id < lawyerId ? lawyerId : user.id;

      const { data: existing } = await supabase
        .from("chat_status")
        .select("id")
        .eq("user_a", first)
        .eq("user_b", second)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("chat_status")
          .update({ is_closed: true })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("chat_status").insert({
          user_a: first,
          user_b: second,
          is_closed: true,
        });
        if (error) throw error;
      }

      setIsClosed(true);
    } catch (err) {
      console.error("Error closing chat", err);
      alert("Could not close chat.");
    } finally {
      setClosing(false);
    }
  }

  async function handleRatingSubmitted() {
    setShowRatingModal(false);
    setHasRated(true);
    const { data } = await supabase
      .from("lawyer_reviews")
      .select("rating")
      .eq("user_id", user?.id)
      .eq("lawyer_id", lawyerId)
      .single();
    if (data) {
      setMyRating(data.rating);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="mb-4">Please log in to chat</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {otherPersonName.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {otherPersonName || "User"}
                </h2>
                {isClosed && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <Lock className="h-3 w-3" /> Chat closed. You can read
                    messages but cannot send new ones.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Close chat button (both sides can close for now) */}
              <button
                onClick={handleCloseChat}
                disabled={isClosed || closing}
                className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-red-400 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Lock className="h-3 w-3" />
                {isClosed ? "Closed" : closing ? "Closing..." : "Close chat"}
              </button>

              {/* Rating controls (same as before) */}
              {currentUserRole !== "lawyer" && (
                <>
                  {hasRated ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium text-sm">
                      <Check className="h-4 w-4" />
                      Rated {myRating}⭐
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      <Star className="h-4 w-4" />
                      Rate
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              💬 No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender_id === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.sender_id === user?.id
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
                }`}
              >
                {msg.content && (
                  <p className="break-words text-sm">{msg.content}</p>
                )}

                {msg.file_url && (
                  <a
                    href={msg.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center text-xs underline"
                  >
                    📄 {msg.file_name || "Attachment"}
                  </a>
                )}

                <p className="text-xs mt-1 opacity-75">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto px-6 py-4 flex gap-3 items-center"
        >
          <label
            className={`p-2 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isClosed ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Paperclip className="h-4 w-4" />
            <input
              type="file"
              className="hidden"
              disabled={isClosed}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
          </label>

          {file && (
            <span className="text-xs text-gray-600 dark:text-gray-300 max-w-[160px] truncate">
              {file.name}
            </span>
          )}

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isClosed ? "Chat is closed." : "Type your message..."}
            disabled={sending || isClosed}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={
              sending || isClosed || (!newMessage.trim() && !file)
            }
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          lawyerId={lawyerId || ""}
          lawyerName={otherPersonName}
          onClose={() => setShowRatingModal(false)}
          onSubmit={handleRatingSubmitted}
        />
      )}
    </div>
  );
}
