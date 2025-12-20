import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import LogoutButton from "./LogoutButton";
import { Link as ScrollLink } from "react-scroll";
import { Scale } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const noNavRoutes = ["/login", "/signup"];

  if (noNavRoutes.includes(location.pathname)) {
    return null;
  }

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLawyer, setIsLawyer] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setIsLawyer(data?.role === "lawyer");
      }
    }
    fetchUser();

    const saved = localStorage.getItem('savedNews');
    if (saved) {
      setSavedCount(JSON.parse(saved).length);
    }

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('savedNews');
      setSavedCount(saved ? JSON.parse(saved).length : 0);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  return (
    <nav className="sticky top-0 left-0 w-full z-50 bg-white dark:bg-gray-900 backdrop-blur-sm shadow-sm px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center space-x-2">
        <Scale className="h-8 w-8 text-primary dark:text-primary" />
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">NyayaPath</span>
      </Link>

      <div className="hidden md:flex items-center space-x-8">
        <ScrollLink
          to="services"
          smooth={true}
          duration={500}
          offset={-80}
          className="cursor-pointer text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
        >
          Services
        </ScrollLink>
        <ScrollLink
          to="about"
          smooth={true}
          duration={500}
          offset={-80}
          className="cursor-pointer text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
        >
          About
        </ScrollLink>
        <ScrollLink
          to="contact"
          smooth={true}
          duration={500}
          offset={-80}
          className="cursor-pointer text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
        >
          Contact
        </ScrollLink>

        <Link
          to="/court-news"
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
        >
          📰 Latest Court News
        </Link>
        <Link
          to="/case-search"
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
        >
          🔍 Case Search
        </Link>
        <Link
          to="/lawyers"
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors font-semibold"
        >
          👨‍⚖️ Find Lawyers
        </Link>
        <Link
          to="/saved-news"
          className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors font-semibold"
        >
          📌 Saved ({savedCount})
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <Link
          to="/ask-question"
          className="text-primary font-semibold hover:underline dark:text-primary"
        >
          Ask a Legal Question
        </Link>

        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
          type="button"
        >
          {isDarkMode ? "🌙" : "☀️"}
        </button>

        {userEmail ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="User menu"
              className="text-primary font-bold text-xl focus:outline-none focus:ring-2 focus:ring-primary"
              type="button"
            >
              &#8942;
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md z-50 divide-y divide-gray-200 dark:divide-gray-600">
                <div className="px-4 py-2 text-gray-900 dark:text-gray-100 font-semibold truncate">
                  {userEmail}
                </div>
                <nav className="flex flex-col">
                  {/* 👇 ADD EDIT PROFILE LINK HERE */}
                  <Link
                    to="/edit-profile"
                    onClick={() => setDropdownOpen(false)}
                    className="px-4 py-2 text-primary hover:bg-primary/10 dark:text-primary dark:hover:bg-primary/20"
                  >
                    ⚙️ Edit Profile
                  </Link>
                  
                  <Link
                    to="/my-questions"
                    onClick={() => setDropdownOpen(false)}
                    className="px-4 py-2 text-primary hover:bg-primary/10 dark:text-primary dark:hover:bg-primary/20"
                  >
                    My Legal Questions
                  </Link>
                  
                  {!isLawyer && (
                    <Link
                      to="/my-chats"
                      onClick={() => setDropdownOpen(false)}
                      className="px-4 py-2 text-primary hover:bg-primary/10 dark:text-primary dark:hover:bg-primary/20"
                    >
                      💬 My Chats
                    </Link>
                  )}
                  
                  {isLawyer && (
                    <Link
                      to="/lawyer"
                      onClick={() => setDropdownOpen(false)}
                      className="px-4 py-2 text-primary hover:bg-primary/10 dark:text-primary dark:hover:bg-primary/20"
                    >
                      Lawyer Dashboard
                    </Link>
                  )}
                  <div className="px-4 py-2">
                    <LogoutButton />
                  </div>
                </nav>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline dark:text-primary"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="text-primary font-semibold hover:underline dark:text-primary"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
