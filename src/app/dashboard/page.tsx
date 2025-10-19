"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddClientForm } from "@/components/forms/AddClientForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  dob: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  // This single, powerful useEffect handles auth, data, and real-time updates
  useEffect(() => {
    // 1. Define the function to fetch clients
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .order("name", { ascending: true }); // Let's sort by name

        if (error) {
          console.error("❌ Data Fetch Error:", error);
          alert(`Could not fetch clients: ${error.message}`);
        } else {
          setClients(data || []);
        }
      } catch (err) {
        console.error("❌ Unexpected error:", err);
        alert(
          `Unexpected error: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    };

    // 2. Set up the authentication listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Fetch user's data
          fetchClients();
        } else {
          // If user is logged out, redirect to login
          router.push("/login");
        }
        setLoading(false);
      }
    );

    // 3. Set up the real-time listener for the clients table
    const clientListener = supabase
      .channel("public:clients")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        (payload) => {
          // When a change occurs, refetch the clients
          fetchClients();
        }
      )
      .subscribe();

    // 4. Cleanup function to remove listeners when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(clientListener);
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleClientAdded = () => {
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.email}!</p>
        </div>
        <div className="flex gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add New Client</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add a New Client</DialogTitle>
                <DialogDescription>
                  Fill in the details below. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <AddClientForm onSuccess={handleClientAdded} />
            </DialogContent>
          </Dialog>
          <Button onClick={handleLogout} variant="destructive">
            Logout
          </Button>
        </div>
      </header>
      <main>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.email || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      {/* THIS IS THE ONLY CHANGE */}
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No clients found. Add your first client!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
