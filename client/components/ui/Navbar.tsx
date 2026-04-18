import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { Menu, X, User, LogOut, Scale } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserRole(profile?.role || null);
      }
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()
            .then(({ data }) => setUserRole(data?.role || null));
        } else {
          setUserRole(null);
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const publicLinks = [
    { path: "/", label: "Home" },
    { path: "/lawyers", label: "Find Lawyers" },
    { path: "/court-news", label: "Court News" },
    { path: "/case-search", label: "Case Search" },
    { path: "/ai-assistant", label: "AI Assistant" },
  ];

  const userLinks = [
    { path: "/my-questions", label: "My Questions" },
    { path: "/ask-question", label: "Ask Question" },
    { path: "/my-chats", label: "My Chats" },
    { path: "/saved-news", label: "Saved News" },
    { path: "/edit-profile", label: "Edit Profile" },
  ];

  const lawyerLinks = [
    { path: "/lawyer", label: "Dashboard" },
    { path: "/lawyer-chats", label: "Client Chats" },
  ];

  const toolLinks = [
    { path: "/legal-notice", label: "Legal Notice" },
    { path: "/case-strategy", label: "Case Strategy" },
    { path: "/cost-estimator", label: "Cost Estimator" },
    { path: "/lawyer-ai-match", label: "AI Lawyer Match" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Scale className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                NyayaPath
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {publicLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActivePath(link.path)
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <>
                <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2" />
                {userRole === "lawyer" ? (
                  <>
                    {lawyerLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActivePath(link.path)
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    {userLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActivePath(link.path)
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </>
                )}

                <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2" />
                {toolLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath(link.path)
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}

            {!user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user.email?.split("@")[0]}
                  </span>
                  {userRole && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      {userRole}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {publicLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActivePath(link.path)
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {user && (
                <>
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                    {userRole === "lawyer"
                      ? lawyerLinks.map((link) => (
                          <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                              isActivePath(link.path)
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))
                      : userLinks.map((link) => (
                          <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                              isActivePath(link.path)
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                  </div>

                  <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                    {toolLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                          isActivePath(link.path)
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {!user ? (
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 space-y-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                  <div className="px-3 py-2 flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {user.email?.split("@")[0]}
                    </span>
                    {userRole && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        {userRole}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
