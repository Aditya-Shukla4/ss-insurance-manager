"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Dashboard component mounted");

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(
          "Auth state changed - Event:",
          event,
          "Session:",
          !!session
        );

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);

        // If the user is not logged in after checking, redirect to login
        if (!currentUser) {
          console.log("No user found - redirecting to login");
          router.push("/login");
        } else {
          console.log("User found:", currentUser.email);
        }
      }
    );

    // Cleanup the subscription on component unmount
    return () => {
      console.log("Cleaning up auth listener");
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user?.email}!</h1>
        <Button onClick={handleLogout} variant="destructive">
          Logout
        </Button>
      </header>

      <main>
        <h2 className="text-xl">Your Dashboard Content Goes Here</h2>
        {/* We will add client lists, policy reminders etc. here later */}
      </main>
    </div>
  );
}
