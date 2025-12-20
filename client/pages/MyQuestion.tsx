import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface Question {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  contact_method: string;
  response: string | null;
  created_at: string;
}

function getStatusBadge(status: string) {
  if (status === "pending") {
    return (
      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        Pending
      </span>
    );
  }
  if (status === "answered") {
    return (
      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Answered
      </span>
    );
  }
  return (
    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
      {status}
    </span>
  );
}

export default function MyQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setQuestions(data);
      setLoading(false);
    }
    fetchQuestions();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-700 dark:text-gray-300">Loading...</div>;
  if (questions.length === 0)
    return <div className="p-10 text-center text-gray-700 dark:text-gray-300">No questions submitted yet.</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 dark:bg-gray-950 py-10">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-7 text-indigo-700 dark:text-indigo-400">My Legal Questions</h2>
        {questions.map(q => (
          <div key={q.id} className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">{q.title}</div>
              {getStatusBadge(q.status)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{q.category} | {new Date(q.created_at).toLocaleString()}</div>
            <div className="mt-2 text-gray-800 dark:text-gray-200">{q.description}</div>
            <div className="mt-2 text-gray-700 dark:text-gray-300"><span className="font-semibold">Contact:</span> {q.contact_method}</div>
            {q.response && (
              <div className="mt-4 bg-blue-50 dark:bg-indigo-900 p-4 rounded-lg">
                <span className="font-bold text-blue-700 dark:text-indigo-200">Lawyer's Response:</span>
                <div className="mt-1 text-gray-800 dark:text-gray-100">{q.response}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
