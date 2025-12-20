import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: JSX.Element;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const [isLawyer, setIsLawyer] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLawyer(false);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsLawyer(data?.role === "lawyer");
    }
    checkRole();
  }, []);

  if (isLawyer === null) {
    return null; // Or a loader/spinner
  }

  if (!isLawyer) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
