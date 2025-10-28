"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");
    console.log("🔐 Login attempt for:", email);

    try {
      // Step 1: Authenticate user
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

      if (authError) {
        console.error("❌ Auth error:", authError);
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.session || !authData.user) {
        setError("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      console.log("✅ Authentication successful for user:", authData.user.id);

      // Step 2: Fetch user's role from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profileData) {
        console.error("❌ Profile fetch error:", profileError);
        setError("Could not load user profile. Please contact support.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      console.log("✅ Profile loaded. Role:", profileData.role);

      // Step 3: Redirect based on role
      if (profileData.role === "admin") {
        console.log("🚀 Redirecting to admin dashboard...");
        router.push("/dashboard");
      } else if (profileData.role === "client") {
        console.log("🚀 Redirecting to client dashboard...");
        router.push("/dashboard");
      } else {
        setError("Invalid user role. Please contact support.");
        await supabase.auth.signOut();
        setLoading(false);
      }
    } catch (err) {
      console.error("💥 Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[380px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">SS Insurance Manager</CardTitle>
          <CardDescription>
            Welcome back! Please login to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/signup")}
            disabled={loading}
          >
            Sign Up
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
