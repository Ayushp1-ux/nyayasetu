import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  MessageCircle,
  FileText,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  QuestionSnapshot,
  QuestionSnapshotData,
} from "../components/ui/QuestionSnapshot";

interface Question extends QuestionSnapshotData {
  user_id: string;
  status: string;
  response: string | null;
}

interface Booking {
  id: string;
  user_id: string;
  booking_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    full_name: string;
  }[];
}

export default function LawyerDashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);
  const [myRating, setMyRating] = useState({
    avg: 0,
    count: 0,
    reviews: [] as any[],
  });
  const [showRatingDetails, setShowRatingDetails] = useState(false);
  const statuses = ["all", "pending", "answered"];
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      let query = supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (!error && data) {
        setQuestions(data as Question[]);
      }
    }
    fetchQuestions();
  }, [filterStatus]);

  useEffect(() => {
    async function fetchMyRatings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reviews } = await supabase
        .from("lawyer_reviews")
        .select("rating, review, created_at")
        .eq("lawyer_id", user.id)
        .order("created_at", { ascending: false });

      if (reviews && reviews.length > 0) {
        const avg =
          reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          reviews.length;
        setMyRating({
          avg: parseFloat(avg.toFixed(1)),
          count: reviews.length,
          reviews: reviews.slice(0, 3),
        });
      }
    }
    fetchMyRatings();
  }, []);

  useEffect(() => {
    async function fetchBookings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setLoadingBookings(true);

      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, user_id, booking_time, status, created_at, updated_at, user_profile:profiles!bookings_user_id_fkey(full_name)"
        )
        .eq("lawyer_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBookings(data as Booking[]);
      }
      setLoadingBookings(false);
    }
    fetchBookings();
  }, []);

  async function updateBookingStatus(bookingId: string, newStatus: string) {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (!error)
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: newStatus, updated_at: new Date().toISOString() }
            : b
        )
      );
  }

  const handleSelect = (question: Question) => {
    setSelectedQuestion(question);
    setResponseText(question.response || "");
  };

  const handleSaveResponse = async () => {
    if (!selectedQuestion) return;
    setLoading(true);

    const { error } = await supabase
      .from("questions")
      .update({ response: responseText, status: "answered" })
      .eq("id", selectedQuestion.id);

    if (!error) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === selectedQuestion.id
            ? { ...q, response: responseText, status: "answered" }
            : q
        )
      );
      setSelectedQuestion(null);
      setResponseText("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          👨‍⚖️ Lawyer Dashboard
        </h1>

        {myRating.count > 0 && (
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg mb-6 overflow-hidden">
            <button
              onClick={() => setShowRatingDetails(!showRatingDetails)}
              className="w-full p-6 flex items-center justify-between hover:bg-yellow-600/20 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Star className="h-8 w-8 fill-white" />
                <div className="text-left">
                  <h2 className="text-2xl font-bold">
                    Your Rating: ⭐ {myRating.avg}
                  </h2>
                  <p className="text-sm opacity-90">
                    {myRating.count} total review
                    {myRating.count > 1 ? "s" : ""} • Click to{" "}
                    {showRatingDetails ? "hide" : "view"} details
                  </p>
                </div>
              </div>
              {showRatingDetails ? (
                <ChevronUp className="h-6 w-6" />
              ) : (
                <ChevronDown className="h-6 w-6" />
              )}
            </button>

            {showRatingDetails && (
              <div className="px-6 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
                <div className="pt-4 border-t border-yellow-400">
                  <p className="font-semibold text-lg mb-3">Recent Reviews:</p>
                  {myRating.reviews.map((review: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-yellow-400/20 backdrop-blur-sm p-4 rounded-lg mb-3"
                    >
                      <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "fill-white text-white"
                                : "text-white/40"
                            }`}
                          />
                        ))}
                      </div>
                      {review.review && (
                        <p className="text-sm leading-relaxed mb-2">
                          "{review.review}"
                        </p>
                      )}
                      <p className="text-xs opacity-75">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS SECTION */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-3">
            Consultation Bookings
          </h2>
          {loadingBookings ? (
            <div>Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="text-gray-500">No consultation requests yet.</div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const formattedBookingTime = new Date(
                  booking.booking_time
                ).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                });
                const formattedCreatedAt = new Date(
                  booking.created_at
                ).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <div
                    key={booking.id}
                    className="rounded border px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold">
                        {booking.user_profile &&
                        booking.user_profile.length > 0 &&
                        booking.user_profile[0]?.full_name
                          ? booking.user_profile[0].full_name
                          : "Unknown User"}
                      </div>
                      <div className="text-sm mt-1">
                        Date & Time:{" "}
                        <span className="font-mono">
                          {formattedBookingTime}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Requested: {formattedCreatedAt}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-2 md:mt-0 min-w-[170px]">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-1 ${
                          booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : booking.status === "accepted"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {booking.status.toUpperCase()}
                      </span>
                      {booking.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              updateBookingStatus(booking.id, "accepted")
                            }
                            className="px-4 py-1 bg-green-600 text-white rounded text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              updateBookingStatus(booking.id, "rejected")
                            }
                            className="px-4 py-1 bg-red-600 text-white rounded text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 mt-2">
                          Last updated:{" "}
                          {new Date(booking.updated_at).toLocaleString(
                            "en-IN",
                            {
                              timeZone: "Asia/Kolkata",
                              dateStyle: "medium",
                              timeStyle: "short",
                            }
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/lawyer-chats"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <MessageCircle className="h-12 w-12" />
              <div>
                <h3 className="text-xl font-bold mb-1">Client Messages</h3>
                <p className="text-blue-100 text-sm">
                  View and respond to client chats
                </p>
              </div>
            </div>
          </Link>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <FileText className="h-12 w-12" />
              <div>
                <h3 className="text-xl font-bold mb-1">Questions</h3>
                <p className="text-green-100 text-sm">
                  {questions.length} total questions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUESTIONS SECTION */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Questions list */}
          <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex gap-2 mb-6 flex-wrap">
              {statuses.map((status) => (
                <button
                  key={status}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm
                  ${
                    filterStatus === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }
                  transition-colors`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
              User Questions
            </h3>

            {questions.length === 0 && (
              <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                No questions found.
              </div>
            )}

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {questions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => handleSelect(q)}
                  className={`p-4 rounded-lg cursor-pointer border-2 transition-all
                  ${
                    selectedQuestion && selectedQuestion.id === q.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                >
                  {/* Snapshot at top */}
                  <QuestionSnapshot question={q} />

                  <div className="flex items-center justify-between mt-1">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full font-semibold
                      ${
                        q.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {q.status}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {q.created_at
                        ? new Date(q.created_at).toLocaleString()
                        : ""}
                    </span>
                  </div>

                  {q.file_url && (
                    <div className="mt-2">
                      <a
                        href={
                          supabase.storage
                            .from("question-documents")
                            .getPublicUrl(q.file_url).data.publicUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 underline text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📎 View Document
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Response view */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            {selectedQuestion ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  {selectedQuestion.title}
                </h2>

                <div className="mb-3">
                  <QuestionSnapshot question={selectedQuestion} />
                </div>

                <div className="text-gray-700 dark:text-gray-300 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {selectedQuestion.description}
                </div>

                {selectedQuestion.file_url && (
                  <p className="mb-4">
                    <a
                      href={
                        supabase.storage
                          .from("question-documents")
                          .getPublicUrl(selectedQuestion.file_url).data
                          .publicUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline"
                    >
                      📎 View Uploaded Document
                    </a>
                  </p>
                )}

                <textarea
                  className="w-full p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none mb-4"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response here..."
                  rows={8}
                />
                <button
                  disabled={loading}
                  onClick={handleSaveResponse}
                  className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save Response"}
                </button>
              </>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center h-full">
                <FileText className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-lg">Select a question to respond</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
