"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { type Client } from "@/app/dashboard/page"; // Reuse the type from dashboard
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define a type for our Policy data
export type Policy = {
  id: string;
  company: string;
  plan_name: string;
  policy_no: string;
  premium: number;
  due_date: string;
  status: string;
  commission_percentage: number;
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      const fetchClientData = async () => {
        setLoading(true);

        // Fetch client details and policies in parallel for speed
        const [clientRes, policiesRes] = await Promise.all([
          supabase.from("clients").select("*").eq("id", clientId).single(),
          supabase.from("policies").select("*").eq("client_id", clientId),
        ]);

        if (clientRes.error) {
          console.error("Error fetching client:", clientRes.error);
        } else {
          setClient(clientRes.data);
        }

        if (policiesRes.error) {
          console.error("Error fetching policies:", policiesRes.error);
          alert("Could not fetch policies. Did you set the RLS policies?");
        } else {
          setPolicies(policiesRes.data);
        }

        setLoading(false);
      };
      fetchClientData();
    }
  }, [clientId]);

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading client details and policies...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <p>Client not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-6">
        <h1 className="text-4xl font-bold">{client.name}</h1>
        <p className="text-lg text-gray-500">Client Profile & Policies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-lg border mb-8">
        <div>
          <h3 className="font-semibold text-gray-500">Phone Number</h3>
          <p>{client.phone}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-500">Email Address</h3>
          <p>{client.email || "Not Provided"}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-500">Date of Birth</h3>
          <p>{client.dob || "Not Provided"}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Policies</h2>
          <Button>Add New Policy</Button> {/* This will be our next feature */}
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan Name</TableHead>
                <TableHead>Policy No.</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.length > 0 ? (
                policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">
                      {policy.company}
                    </TableCell>
                    <TableCell>{policy.plan_name}</TableCell>
                    <TableCell>{policy.policy_no}</TableCell>
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    No policies found for this client.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
