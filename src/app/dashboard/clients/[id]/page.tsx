// File: src/app/dashboard/clients/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // Check path
import { type Client, type Policy } from "@/lib/types"; // Check path
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Loading Spinner
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-[50vh]">
    {" "}
    {/* Use less height */}
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-700 font-semibold">Loading Client Details...</p>
    </div>
  </div>
);

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string; // Get client ID from URL

  const [client, setClient] = useState<Client | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return; // Agar ID nahi hai toh kuch mat kar

    const fetchClientData = async () => {
      setLoading(true);
      setError(null);

      // Check if user is admin before fetching? (Security Enhancement later)
      // For now, assume admin is accessing

      // Fetch Client Details
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*") // Fetch all client details
        .eq("id", clientId)
        .single();

      if (clientError || !clientData) {
        console.error("Error fetching client:", clientError);
        setError("Client not found or access denied.");
        setLoading(false);
        return;
      }
      setClient(clientData);

      // Fetch Policies for this Client
      const { data: policiesData, error: policiesError } = await supabase
        .from("policies")
        .select("*") // Fetch all policy details
        .eq("client_id", clientId) // Filter by client ID
        .order("due_date", { ascending: true });

      if (policiesError) {
        console.error("Error fetching policies:", policiesError);
        setError("Could not fetch policies for this client.");
        // Don't stop loading, maybe show partial data
      } else {
        setPolicies(policiesData || []);
      }

      setLoading(false);
    };

    fetchClientData();

    // Optional: Add Supabase listener for real-time updates for THIS client's policies
    // const policyListener = supabase.channel(...) .subscribe();
    // return () => supabase.removeChannel(policyListener);
  }, [clientId]); // Re-run when clientId changes

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-red-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      // Should ideally not happen if error handling is correct
      <div className="p-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <p className="text-center text-gray-500">Client data not available.</p>
      </div>
    );
  }

  // ----- YEH HAI ASLI CLIENT DETAIL PAGE -----
  return (
    <div className="p-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Client List
      </Button>

      <h1 className="text-3xl font-bold mb-2">{client.name}</h1>
      <p className="text-gray-600 mb-1">Phone: {client.phone}</p>
      <p className="text-gray-600 mb-6">Email: {client.email}</p>

      <h2 className="text-2xl font-semibold mb-4">Policies</h2>
      {/* TODO: Add Policy CRUD buttons here (Add/Edit/Delete) */}
      <div className="border rounded-lg overflow-hidden">
        {/* Yahaan pe policies ki table aayegi (reuse ClientDashboard table?) */}
        {policies.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Company
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Plan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Premium
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Due Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.map((policy) => (
                <tr key={policy.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {policy.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.plan_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{policy.premium.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(policy.due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* TODO: Add Edit/Delete buttons */}
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-center text-gray-500">
            No policies found for this client.
          </p>
        )}
      </div>
    </div>
  );
}
