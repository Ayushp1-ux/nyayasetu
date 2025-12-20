import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ChatThread {
  lawyer_id: string;
  lawyer_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function MyChats() {
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchUserChats();
  }, []);

  // Real-time notifications
  useEffect(() => {
    if (!currentUser) return;

    const subscription = supabase
      .channel('user_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          if (payload.new.receiver_id === currentUser?.id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.sender_id)
              .single();
            
            toast.success(`💬 New message from ${profile?.full_name || 'Lawyer'}`, {
              description: payload.new.content.substring(0, 50) + '...',
              action: {
                label: 'View',
                onClick: () => window.location.href = `/chat/${payload.new.sender_id}`
              }
            });
            
            fetchUserChats();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);

  async function fetchUserChats() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setCurrentUser(user);

      const { data: messages } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!messages) return;

      const chatMap = new Map();

      for (const msg of messages) {
        const lawyerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

        if (!chatMap.has(lawyerId)) {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: 'exact', head: true })
            .eq("sender_id", lawyerId)
            .eq("receiver_id", user.id)
            .gt("created_at", localStorage.getItem(`last_read_${lawyerId}`) || '2020-01-01');

          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", lawyerId)
            .single();

          chatMap.set(lawyerId, {
            lawyer_id: lawyerId,
            lawyer_name: profile?.full_name || "Lawyer",
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: count || 0,
          });
        }
      }

      setChats(Array.from(chatMap.values()));
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            💬 My Conversations
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Continue your conversations with lawyers
          </p>
        </div>

        {chats.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
              No conversations yet
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Start chatting with a lawyer to see your conversations here
            </p>
            <Link
              to="/lawyers"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Find Lawyers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <Link
                key={chat.lawyer_id}
                to={`/chat/${chat.lawyer_id}`}
                onClick={() => localStorage.setItem(`last_read_${chat.lawyer_id}`, new Date().toISOString())}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 relative"
              >
                {chat.unread_count > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {chat.unread_count} new
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {chat.lawyer_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {chat.lawyer_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(chat.last_message_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm ${chat.unread_count > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'} line-clamp-2 ml-15`}>
                      {chat.last_message}
                    </p>
                  </div>
                  <div className="ml-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                      Continue →
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
