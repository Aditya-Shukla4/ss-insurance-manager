"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { type Policy, type UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Props are now strongly typed
interface ClientDashboardProps {
  user: User | null;
  profile: UserProfile;
  handleLogout: () => void;
}

// ====================================================================
// CLIENT-ONLY DASHBOARD COMPONENT
// ====================================================================
function ClientDashboard({
  user,
  profile,
  handleLogout,
}: ClientDashboardProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyPolicies = async () => {
      // Call our secure Postgres function
      const { data, error } = await supabase.rpc("get_my_policies");

      if (error) {
        console.error("Error fetching client's policies:", error);
      } else {
        setPolicies(data || []);
      }
      setLoading(false);
    };

    fetchMyPolicies();

    // REAL-TIME LISTENER: Listen for any changes in the policies table
    const policyListener = supabase
      .channel("public:policies:client")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "policies" },
        (_payload) => {
          // Refetch policies on any change
          fetchMyPolicies();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(policyListener);
    };
  }, []);

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-gray-500">
            Welcome, {profile?.full_name || user?.email}!
          </p>
        </div>
        <Button onClick={handleLogout} variant="destructive">
          Logout
        </Button>
      </header>
      <main>
        <h2 className="text-2xl font-bold mb-4">My Policies</h2>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan Name</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading policies...
                  </TableCell>
                </TableRow>
              ) : policies.length > 0 ? (
                policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">
                      {policy.company}
                    </TableCell>
                    <TableCell>{policy.plan_name}</TableCell>
                    <TableCell>
                      ₹{policy.premium.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      {new Date(policy.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{policy.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No policies found for your account.
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

// Default export
export default ClientDashboard;
