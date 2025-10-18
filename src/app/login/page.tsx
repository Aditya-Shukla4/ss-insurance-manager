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
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);
    console.log("Login attempt for:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("Login error:", error);
        alert("Error logging in: " + error.message);
        setLoading(false);
      } else if (data.session) {
        console.log("✅ Login successful! Session:", data.session.user.email);
        console.log("📦 Session data:", data.session);

        // Check if localStorage is working
        const testStorage = localStorage.getItem("supabase.auth.token");
        console.log(
          "💾 LocalStorage test:",
          testStorage ? "Working" : "Not working"
        );

        // CRITICAL: Wait for Supabase to set cookies properly
        console.log("⏳ Waiting for session cookies to be set...");
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Check again after wait
        const afterWait = localStorage.getItem("supabase.auth.token");
        console.log(
          "💾 After wait - LocalStorage:",
          afterWait ? "Session saved!" : "Still not saved"
        );

        console.log("🚀 Redirecting to dashboard...");
        window.location.replace("/dashboard");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred");
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
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
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
