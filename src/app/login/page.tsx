"use client"; // Very Important: Tells Next.js to run this in the browser

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
import { supabase } from "@/lib/supabaseClient"; // Import our Supabase client

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      // A better UI than alert will be implemented later
      alert("Error logging in: " + error.message);
    } else {
      // A better UI than alert will be implemented later
      alert("Login Successful!");
      router.push("/dashboard"); // Redirect to dashboard on success
    }
  };

  // Optional: Handle Sign Up button click
  const handleSignUp = () => {
    // For now, let's just log it. We'll build this page later.
    router.push("/signup");
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
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleLogin}>
            Login
          </Button>
          <Button variant="outline" className="w-full" onClick={handleSignUp}>
            Sign Up
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
