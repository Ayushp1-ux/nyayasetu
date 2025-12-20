import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Star, MapPin, Phone, Mail } from "lucide-react";

interface Lawyer {
  id: string;
  name: string;
  specialization: string;
  location: string;
  email: string;
  phone: string;
  rating: number;
  reviews: number;
  experience: number;
  bio: string;
  profileImage?: string;
}

export default function LawyerDirectory() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpec, setFilterSpec] = useState("all");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [bookingSlot, setBookingSlot] = useState<{ [lawyerId: string]: string }>({});

  useEffect(() => {
    fetchCurrentUser();
    fetchLawyers();
  }, []);

  async function fetchCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setCurrentUserRole(data?.role || null);
    }
  }

  async function fetchLawyerWithRating(lawyerId: string) {
    const { data: reviews } = await supabase
      .from("lawyer_reviews")
      .select("rating")
      .eq("lawyer_id", lawyerId);

    if (reviews && reviews.length > 0) {
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      return {
        rating: parseFloat(avgRating.toFixed(1)),
        reviewCount: reviews.length,
      };
    }
    return { rating: 0, reviewCount: 0 };
  }

  async function fetchLawyers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "lawyer");

      if (error) throw error;

      const lawyersWithRatings = await Promise.all(
        data.map(async (lawyer: any) => {
          const ratingData = await fetchLawyerWithRating(lawyer.id);
          return {
            id: lawyer.id,
            name: lawyer.full_name || "Unknown",
            specialization: lawyer.specialization || "General Practice",
            location: lawyer.location || "Not specified",
            email: lawyer.email || "",
            phone: lawyer.phone || "",
            rating: ratingData.rating || 0,
            reviews: ratingData.reviewCount || 0,
            experience: lawyer.experience || 0,
            bio: lawyer.bio || "Experienced legal professional",
            profileImage: lawyer.profile_image_url,
          };
        })
      );

      setLawyers(lawyersWithRatings);
    } catch (err) {
      console.error("Error fetching lawyers:", err);
    } finally {
      setLoading(false);
    }
  }

  async function bookConsultation(lawyerId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please login first");
      return;
    }
    const bookingTime = bookingSlot[lawyerId];
    if (!bookingTime) {
      alert("Please pick a slot!");
      return;
    }
    const { error } = await supabase
      .from("bookings")
      .insert([{ user_id: user.id, lawyer_id: lawyerId, booking_time: bookingTime }]);
    if (error) {
      alert("Booking failed: " + error.message);
    } else {
      alert("Booking requested! Wait for confirmation.");
      setBookingSlot({ ...bookingSlot, [lawyerId]: "" });
    }
  }

  const filteredLawyers = lawyers.filter(
    (lawyer) =>
      (lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterSpec === "all" || lawyer.specialization === filterSpec)
  );

  const specializations = [
    "all",
    "Criminal Law",
    "Family Law",
    "Corporate Law",
    "Property Law",
    "Labour Law",
    "Tax Law"
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300">Loading lawyers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            👨‍⚖️ Find Trusted Lawyers
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Connect with experienced legal professionals in your area
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="Search by name, specialization, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex flex-wrap gap-2">
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setFilterSpec(spec)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterSpec === spec
                    ? "bg-primary text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300"
                }`}
              >
                {spec === "all" ? "All" : spec}
              </button>
            ))}
          </div>
        </div>

        {filteredLawyers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              No lawyers found matching your criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
              >
                <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{lawyer.name}</h3>
                  <p className="text-sm opacity-90 mb-3">{lawyer.specialization}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                      <span className="font-semibold">
                        {lawyer.rating > 0 ? lawyer.rating : "New"}
                      </span>
                      <span className="text-xs opacity-75">({lawyer.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{lawyer.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>{lawyer.phone || "Available on chat"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="truncate text-xs">{lawyer.email}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {lawyer.bio}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      📚 {lawyer.experience}+ years experience
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {currentUserRole === "lawyer" ? (
                      <button
                        disabled
                        className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg font-medium text-sm cursor-not-allowed"
                      >
                        💬 Chat Disabled
                      </button>
                    ) : (
                      <Link
                        to={`/chat/${lawyer.id}`}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium text-sm transition-colors text-center block"
                      >
                        💬 Chat
                      </Link>
                    )}
                    <button className="flex-1 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 font-medium text-sm transition-colors">
                      ℹ️ Info
                    </button>
                  </div>

                  {/* -------- Booking UI Here -------- */}
                  <div className="flex flex-col gap-2 pt-4">
                    <label className="text-xs text-gray-500 mb-0.5">Pick time:</label>
                    <input
                      type="datetime-local"
                      value={bookingSlot[lawyer.id] || ""}
                      onChange={e => setBookingSlot({ ...bookingSlot, [lawyer.id]: e.target.value })}
                      className="w-full px-2 py-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
                    />
                    <button
                      onClick={() => bookConsultation(lawyer.id)}
                      className="w-full mt-1 px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm transition-colors"
                    >
                      📅 Book Consultation
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
