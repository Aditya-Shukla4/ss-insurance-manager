// File: src/app/dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";
// SUPABASE CLIENT: Agar tera client '@/lib/supabaseClient' pe hai toh theek, warna path badal liyo
import { supabase } from "@/lib/supabaseClient"; 
import { useEffect, useState } from "react";
// TYPES: Agar types '@/lib/types' pe hain toh theek, warna path badal liyo
import { type UserProfile } from "@/lib/types"; 

// 1. Apne ASLI dashboard components ko import kar (PATHS CHECK KAR LENA!)
import AdminDashboard from "@/components/dashboards/AdminDashboard"; 
import ClientDashboard from "@/components/dashboards/ClientDashboard"; 
import { Button } from "@/components/ui/button";

// 2. Loading Spinner
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-700 font-semibold">Loading Your Dashboard...</p>
    </div>
  </div>
);

// 3. Main Dashboard Page Component
export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // User object state (optional, agar dashboard components ko user object chahiye)
  const [sessionUser, setSessionUser] = useState<any | null>(null); // Use 'any' or proper User type from Supabase

  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component

    const checkAuthAndFetchProfile = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Session Error:', sessionError);
        if (isMounted) router.push("/login");
        return;
      }

       // Session user object ko state mein save kar le agar zaroorat hai
       if (isMounted) setSessionUser(session.user);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name") // Sirf role aur name fetch kar rahe hain
        .eq("id", session.user.id)
        .single();

      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError);
        await supabase.auth.signOut(); // Logout kar de agar profile nahi mila
        if (isMounted) router.push("/login");
        return;
      }

      if (isMounted) {
        setProfile(profileData);
        setLoading(false);
      }
    };

    checkAuthAndFetchProfile();

    // Auth state change listener (logout, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          if (isMounted) {
             setProfile(null);
             setSessionUser(null);
             router.push("/login");
          }
        } 
        // Agar user SIGNED_IN hua hai (e.g., password reset ke baad), toh profile refetch kar sakte hain
        else if (event === "SIGNED_IN" && session && isMounted && !profile) {
            setLoading(true); // Show loading again
            checkAuthAndFetchProfile();
        }
      }
    );

    // Cleanup function
    return () => {
      isMounted = false; 
      authListener.subscription.unsubscribe();
    };
  // IMPORTANT: router ko dependency array mein rakhna zaroori hai
  }, [router]); 

  // ----- Logout Function (Dashboards ko pass karne ke liye) -----
  const handleLogout = async () => {
     setLoading(true); // Show loading spinner during logout
     await supabase.auth.signOut();
     // Listener will handle the redirect to /login
  };


  // ========= 4. YEH HAI ASLI LOGIC! (The Return Block) =========

  if (loading) {
    return <LoadingSpinner />;
  }

  // Ab role check kar aur seedha component render kar
  if (profile?.role === "admin") {
    // AdminDashboard ko zaroori props pass kar (user object aur logout function)
    return <AdminDashboard user={sessionUser} handleLogout={handleLogout} />;
  }

  if (profile?.role === "client") {
    // ClientDashboard ko zaroori props pass kar (user object, profile, logout function)
    return <ClientDashboard user={sessionUser} profile={profile} handleLogout={handleLogout} />;
  }

  // Fallback/Error case (agar role nahi mila)
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-red-50 p-4 text-center">
      <h2 className="text-2xl font-bold text-red-700 mb-4">
        Access Denied or Error
      </h2>
      <p className="text-lg text-red-600">
        Could not load dashboard. Your user profile might be missing a role.
      </p>
      <p className="mt-2 text-gray-600">Please contact support or try logging out.</p>
      <Button onClick={handleLogout} variant="destructive" className="mt-6">
         Logout
      </Button>
    </div>
  );
}