"use client";

import { useState, useEffect } from "react";
// !! Reverting to alias paths - Ensure tsconfig/jsconfig is set up correctly !!
import { supabase } from "@/lib/supabaseClient"; // Using alias path
import { type Client, type Policy, type UserProfile } from "@/lib/types"; // Using alias path
import { Button } from "@/components/ui/button"; // Using alias path
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Using alias path
import { AddClientForm } from "@/components/forms/AddClientForm"; // Using alias path
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Using alias path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Using alias path
import { Users, FileText, CalendarClock, BellRing, LogOut } from "lucide-react";
// Removed Link import again

// Type for Summary Statistics
type SummaryStats = {
  clientCount: number;
  activePolicyCount: number;
  renewalsDueMonthCount: number;
};

// Type for Upcoming Renewals display
type UpcomingRenewal = Pick<Policy, 'id' | 'plan_name' | 'due_date' | 'premium'> & {
    client_name: string | null;
};

// ====================================================================
// HELPER FUNCTION - Fetch Summary Stats
// ====================================================================
async function fetchSummaryStats(): Promise<SummaryStats> {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

  const [
    { count: clientCount, error: clientError },
    { count: activePolicyCount, error: policyError },
    { count: renewalsDueMonthCount, error: renewalError },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("policies").select("*", { count: "exact", head: true }).eq("status", "Active"),
    supabase.from("policies").select("*", { count: "exact", head: true })
        .gte("due_date", firstDayOfMonth)
        .lte("due_date", lastDayOfMonth)
        .eq("status", "Active"),
  ]);

  if (clientError) console.error("Error fetching client count:", clientError);
  if (policyError) console.error("Error fetching active policy count:", policyError);
  if (renewalError) console.error("Error fetching renewals due count:", renewalError);

  return {
    clientCount: clientCount || 0,
    activePolicyCount: activePolicyCount || 0,
    renewalsDueMonthCount: renewalsDueMonthCount || 0,
  };
}

// ====================================================================
// HELPER FUNCTION - Fetch Upcoming Renewals
// ====================================================================
async function fetchUpcomingRenewals(): Promise<{ next7Days: UpcomingRenewal[], next30Days: UpcomingRenewal[] }> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const next7Date = new Date();
    next7Date.setDate(today.getDate() + 7);
    const next7Str = next7Date.toISOString().split('T')[0];

    const next30Date = new Date();
    next30Date.setDate(today.getDate() + 30);
    const next30Str = next30Date.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('policies')
        .select(`
            id,
            plan_name,
            due_date,
            premium,
            clients ( name )
        `)
        .eq('status', 'Active')
        .gte('due_date', todayStr)
        .lte('due_date', next30Str)
        .order('due_date', { ascending: true });

    if (error) {
        console.error("Error fetching upcoming renewals:", error);
        return { next7Days: [], next30Days: [] };
    }

    const renewals: UpcomingRenewal[] = data.map((p: any) => ({
        id: p.id,
        plan_name: p.plan_name || 'N/A',
        due_date: p.due_date,
        premium: p.premium || 0,
        client_name: p.clients && typeof p.clients === 'object' && p.clients.name ? p.clients.name : 'Client Name Missing'
    }));

    const next7Days = renewals.filter(r => r.due_date <= next7Str);
    const next30Days = renewals;

    return { next7Days, next30Days };
}


// ====================================================================
// ADMIN-ONLY DASHBOARD COMPONENT
// ====================================================================
interface AdminDashboardProps {
  profile: UserProfile;
  handleLogout: () => void;
}

function AdminDashboard({ profile, handleLogout }: AdminDashboardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    clientCount: 0,
    activePolicyCount: 0,
    renewalsDueMonthCount: 0,
  });
  const [renewals7Days, setRenewals7Days] = useState<UpcomingRenewal[]>([]);
  const [renewals30Days, setRenewals30Days] = useState<UpcomingRenewal[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      setLoadingData(true);
      setFetchError(null);
      try {
        const [clientsRes, summaryRes, renewalsRes] = await Promise.all([
          supabase.from("clients").select("id, name, phone, email, dob, user_id").order("name"),
          fetchSummaryStats(),
          fetchUpcomingRenewals(),
        ]);

        if (!isMounted) return;

        if (clientsRes.error) throw new Error(`Client Fetch Error: ${clientsRes.error.message}`);

        setClients(clientsRes.data || []);
        setSummaryStats(summaryRes);
        setRenewals7Days(renewalsRes.next7Days);
        setRenewals30Days(renewalsRes.next30Days);

      } catch (error: any) {
         console.error("Error fetching dashboard data:", error);
         if (isMounted) setFetchError(error.message || "Failed to load dashboard data.");
      } finally {
         if (isMounted) setLoadingData(false);
      }
    };

    fetchData();

    const changes = supabase
      .channel('admin-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, payload => {
        console.log('Client change received, refetching...', payload);
        if(isMounted) fetchData();
      })
       .on('postgres_changes', { event: '*', schema: 'public', table: 'policies' }, payload => {
        console.log('Policy change received, refetching...', payload);
        if(isMounted) fetchData();
      })
      .subscribe((status, err) => {
         if (err) console.error("Realtime subscription failed:", err);
         else console.log("Realtime subscription status:", status);
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(changes).catch(err => console.error("Error removing realtime channel", err));
    };
  }, []);

  if (loadingData) {
     return (
         <div className="flex justify-center items-center h-screen">
             <div className="text-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                 <p className="text-gray-700 font-semibold">Loading Admin Dashboard...</p>
             </div>
         </div>
     );
  }

  if (fetchError) {
      return (
          <div className="flex flex-col justify-center items-center h-screen p-4 text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Oops! Something went wrong.</h2>
              <p className="text-red-500 mb-4">{fetchError}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome back, {profile?.full_name || 'Admin'}!</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add New Client</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add a New Client</DialogTitle>
                <DialogDescription>Fill in the details below.</DialogDescription>
              </DialogHeader>
              <AddClientForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button onClick={handleLogout} variant="outline" size="sm">
             <LogOut className="w-4 h-4 mr-2"/> Logout
          </Button>
        </div>
      </header>

      {/* Summary Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.clientCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.activePolicyCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewals Due This Month</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.renewalsDueMonthCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Renewals Section */}
      <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-orange-400 border-l-4 shadow-sm">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600 text-lg font-semibold">
                      <BellRing className="h-5 w-5 animate-pulse"/>
                      Renewals Due Soon (Next 7 Days)
                  </CardTitle>
              </CardHeader>
              <CardContent>
                   {renewals7Days.length > 0 ? (
                      <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                          {renewals7Days.map(r => (
                              <li key={r.id} className="text-sm border-b pb-2 last:border-b-0 hover:bg-orange-50/50 p-1 rounded">
                                  <p className="font-semibold text-gray-800">{r.client_name || 'N/A'}</p>
                                  <p className="text-gray-600">{r.plan_name}</p>
                                  <div className="flex justify-between items-center text-gray-500 mt-1">
                                      <span>
                                          Due: <span className="font-medium text-orange-700">{new Date(r.due_date).toLocaleDateString()}</span>
                                      </span>
                                       <span>
                                          Premium: <span className="font-medium">₹{r.premium?.toLocaleString('en-IN') ?? 'N/A'}</span>
                                      </span>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-gray-500 italic py-4">No renewals due in the next 7 days. Great job!</p>
                  )}
              </CardContent>
          </Card>

           <Card className="border-blue-400 border-l-4 shadow-sm">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600 text-lg font-semibold">
                       <CalendarClock className="h-5 w-5"/>
                       Upcoming Renewals (Next 30 Days)
                  </CardTitle>
              </CardHeader>
              <CardContent>
                   {renewals30Days.length > 0 ? (
                      <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                          {renewals30Days.map(r => (
                               <li key={r.id} className="text-sm border-b pb-2 last:border-b-0 hover:bg-blue-50/50 p-1 rounded">
                                  <p className="font-semibold text-gray-800">{r.client_name || 'N/A'}</p>
                                  <p className="text-gray-600">{r.plan_name}</p>
                                   <div className="flex justify-between items-center text-gray-500 mt-1">
                                      <span>
                                          Due: <span className="font-medium">{new Date(r.due_date).toLocaleDateString()}</span>
                                      </span>
                                      <span>
                                          Premium: <span className="font-medium">₹{r.premium?.toLocaleString('en-IN') ?? 'N/A'}</span>
                                      </span>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-gray-500 italic py-4">No upcoming renewals in the next 30 days.</p>
                  )}
              </CardContent>
          </Card>
      </div>

      {/* Client List Table */}
      <main>
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">Clients</h2>
        <Card>
         <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50"><TableRow>
                  <TableHead className="px-6 py-3">Name</TableHead>
                  <TableHead className="px-6 py-3">Phone</TableHead>
                  <TableHead className="hidden sm:table-cell px-6 py-3">Email</TableHead>
                  <TableHead className="text-right px-6 py-3">Actions</TableHead>
                </TableRow></TableHeader>
              <TableBody>
                {clients.length > 0 ? clients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium px-6 py-4">{client.name}</TableCell>
                    <TableCell className="px-6 py-4">{client.phone || 'N/A'}</TableCell>
                     <TableCell className="hidden sm:table-cell px-6 py-4">{client.email || 'N/A'}</TableCell>
                    <TableCell className="text-right px-6 py-4">
                       {/* Use standard <a> tag */}
                      <a href={`/dashboard/clients/${client.id}`}>
                        <Button variant="outline" size="sm">
                          View / Edit
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                      No clients found. Click "Add New Client" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default AdminDashboard;

