import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

interface ChatThread {
  user_id: string;
  user_name: string;
  last_message: string;
  unread_count: number;
  last_message_time: string;
}

export default function LawyerChatInbox() {
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLawyer, setCurrentLawyer] = useState<any>(null);

  useEffect(() => {
    fetchLawyerChats();
  }, []);

  // Real-time notifications for lawyers
  useEffect(() => {
    if (!currentLawyer) return;

    const subscription = supabase
      .channel('lawyer_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          if (payload.new.receiver_id === currentLawyer?.id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.sender_id)
              .single();
            
            toast.success(`💬 New message from ${profile?.full_name || 'Client'}`, {
              description: payload.new.content.substring(0, 50) + '...',
              action: {
                label: 'View',
                onClick: () => window.location.href = `/chat/${payload.new.sender_id}`
              }
            });
            
            fetchLawyerChats();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentLawyer]);

  async function fetchLawyerChats() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setCurrentLawyer(user);

      const { data: messages } = await supabase
        .from("messages")
        .select("sender_id, content, created_at")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });

      if (!messages) return;

      const chatMap = new Map();

      for (const msg of messages) {
        if (!chatMap.has(msg.sender_id)) {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: 'exact', head: true })
            .eq("sender_id", msg.sender_id)
            .eq("receiver_id", user.id)
            .gt("created_at", localStorage.getItem(`last_read_${msg.sender_id}`) || '2020-01-01');

          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", msg.sender_id)
            .single();

          chatMap.set(msg.sender_id, {
            user_id: msg.sender_id,
            user_name: profile?.full_name || "User",
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
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          💬 Client Messages
        </h1>

        {chats.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300">
              No messages yet. When clients message you, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <Link
                key={chat.user_id}
                to={`/chat/${chat.user_id}`}
                onClick={() => localStorage.setItem(`last_read_${chat.user_id}`, new Date().toISOString())}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 relative"
              >
                {chat.unread_count > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {chat.unread_count} new
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold mb-2 ${chat.unread_count > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                      👤 {chat.user_name}
                    </h3>
                    <p className={`text-sm line-clamp-1 ${chat.unread_count > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {chat.last_message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(chat.last_message_time).toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      Reply →
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
