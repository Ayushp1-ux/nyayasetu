import { supabase } from "../../lib/supabaseClient";

export default function LogoutButton() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; // 👈 Changed to just "/" for home page
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 hover:bg-red-700 transition text-white px-4 py-2 rounded"
    >
      Logout
    </button>
  );
}
