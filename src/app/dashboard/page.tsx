// File: src/app/dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { type UserProfile } from "@/lib/types";

import AdminDashboard from "@/components/dashboards/AdminDashboard";
import ClientDashboard from "@/components/dashboards/ClientDashboard";
import { Button } from "@/components/ui/button";

// Loading Spinner
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-700 font-semibold">Loading Your Dashboard...</p>
    </div>
  </div>
);

// Main Dashboard Page Component
export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndFetchProfile = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("Session Error:", sessionError);
        if (isMounted) router.push("/login");
        return;
      }

      if (isMounted) setSessionUser(session.user);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profileData) {
        console.error("Error fetching profile:", profileError);
        await supabase.auth.signOut();
        if (isMounted) router.push("/login");
        return;
      }

      if (isMounted) {
        setProfile(profileData);
        setLoading(false);
      }
    };

    checkAuthAndFetchProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          if (isMounted) {
            setProfile(null);
            setSessionUser(null);
            router.push("/login");
          }
        } else if (event === "SIGNED_IN" && session && isMounted && !profile) {
          setLoading(true);
          checkAuthAndFetchProfile();
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, profile]);

  // Logout Function
  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // ✅ FIXED: Now passing 'profile' prop to AdminDashboard
  if (profile?.role === "admin") {
    return (
      <AdminDashboard
        user={sessionUser}
        profile={profile}
        handleLogout={handleLogout}
      />
    );
  }

  if (profile?.role === "client") {
    return (
      <ClientDashboard
        user={sessionUser}
        profile={profile}
        handleLogout={handleLogout}
      />
    );
  }

  // Fallback/Error case
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-red-50 p-4 text-center">
      <h2 className="text-2xl font-bold text-red-700 mb-4">
        Access Denied or Error
      </h2>
      <p className="text-lg text-red-600">
        Could not load dashboard. Your user profile might be missing a role.
      </p>
      <p className="mt-2 text-gray-600">
        Please contact support or try logging out.
      </p>
      <Button onClick={handleLogout} variant="destructive" className="mt-6">
        Logout
      </Button>
    </div>
  );
}
