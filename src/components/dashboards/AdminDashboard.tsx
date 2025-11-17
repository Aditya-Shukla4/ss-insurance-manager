"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
// !! Relative Paths !!
import { supabase } from "../../lib/supabaseClient";
import { type Client, type UserProfile } from "../../lib/types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { AddClientForm } from "../forms/AddClientForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Users,
  FileText,
  CalendarClock,
  BellRing,
  LogOut,
  Check,
} from "lucide-react";

// Type for Summary Statistics
type SummaryStats = {
  clientCount: number;
  activePolicyCount: number;
  renewalsDueMonthCount: number;
};

// Type for Notifications
type AppNotification = {
  id: string;
  created_at: string;
  message: string;
  policy_id: string | null;
  client_id: string | null;
  due_date: string | null;
  is_read: boolean;
};

// ====================================================================
// HELPER FUNCTION - Fetch Summary Stats
// ====================================================================
async function fetchSummaryStats(): Promise<SummaryStats> {
  const today = new Date();
  const firstDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  ).toISOString();
  const lastDayOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).toISOString();

  const [
    { count: clientCount, error: clientError },
    { count: activePolicyCount, error: policyError },
    { count: renewalsDueMonthCount, error: renewalError },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase
      .from("policies")
      .select("*", { count: "exact", head: true })
      .eq("status", "Active"),
    supabase
      .from("policies")
      .select("*", { count: "exact", head: true })
      .gte("due_date", firstDayOfMonth)
      .lte("due_date", lastDayOfMonth)
      .eq("status", "Active"),
  ]);

  if (clientError)
    console.error("Error fetching client count:", clientError?.message);
  if (policyError)
    console.error("Error fetching active policy count:", policyError?.message);
  if (renewalError)
    console.error("Error fetching renewals due count:", renewalError?.message);

  return {
    clientCount: clientCount || 0,
    activePolicyCount: activePolicyCount || 0,
    renewalsDueMonthCount: renewalsDueMonthCount || 0,
  };
}

async function fetchUnreadNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("is_read", false)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching notifications:", error.message);
    return [];
  }
  return data || [];
}

// ====================================================================
// ADMIN DASHBOARD COMPONENT (FIXED)
// ====================================================================
interface AdminDashboardProps {
  user: User | null;
  profile: UserProfile;
  handleLogout: () => void;
}

function AdminDashboard({ user, profile, handleLogout }: AdminDashboardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    clientCount: 0,
    activePolicyCount: 0,
    renewalsDueMonthCount: 0,
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic UI Update
    setNotifications((prevNotifs) =>
      prevNotifs.filter((n) => n.id !== notificationId)
    );

    // Update database
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error.message);
      fetchData();
    } else {
      console.log("Notification marked as read:", notificationId);
    }
  };

  // Consolidated data fetching function
  const fetchData = async () => {
    setLoadingData(true);
    setFetchError(null);
    try {
      const [clientsRes, summaryRes, notificationsRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id, name, phone, email, dob, user_id")
          .order("name"),
        fetchSummaryStats(),
        fetchUnreadNotifications(),
      ]);

      if (clientsRes.error)
        throw new Error(`Client Fetch Error: ${clientsRes.error.message}`);

      setClients(clientsRes.data || []);
      setSummaryStats(summaryRes);
      setNotifications(notificationsRes);
    } catch (error: unknown) {
      console.error("Error in fetchData:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data.";
      setFetchError(errorMessage);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      fetchData();
    }

    // Realtime listener
    const changes = supabase
      .channel("admin-dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        (_payload: unknown) => {
          console.log("Client change received, refetching clients/stats...");
          if (isMounted) fetchData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "policies" },
        (_payload: unknown) => {
          console.log("Policy change received, refetching stats...");
          if (isMounted) fetchData();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload: { new: AppNotification }) => {
          console.log("New notification received!", payload);
          if (isMounted) {
            setNotifications((prevNotifs) => [payload.new, ...prevNotifs]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload: { new: { id: string; is_read: boolean } }) => {
          console.log("Notification update received!", payload);
          if (isMounted && payload.new.is_read) {
            setNotifications((prevNotifs) =>
              prevNotifs.filter((n) => n.id !== payload.new.id)
            );
          }
        }
      )
      .subscribe((status, err) => {
        if (err) console.error("Realtime subscription failed:", err);
      });

    return () => {
      isMounted = false;
      supabase
        .removeChannel(changes)
        .catch((err) => console.error("Error removing realtime channel", err));
    };
  }, []);

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">
            Loading Admin Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen p-4 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Oops! Something went wrong.
        </h2>
        <p className="text-red-500 mb-4">{fetchError}</p>
        <Button onClick={fetchData} className="mb-2">
          Try Again
        </Button>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Admin Dashboard
          </h1>
          <p className="text-gray-500">
            Welcome back, {profile?.full_name || "Admin"}!
          </p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add New Client</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add a New Client</DialogTitle>
                <DialogDescription>
                  Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <AddClientForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      {/* Summary Stats */}
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
            <CardTitle className="text-sm font-medium">
              Active Policies
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.activePolicyCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Renewals Due This Month
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.renewalsDueMonthCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renewals Section */}
      <div className="grid gap-6">
        <Card className="border-orange-400 border-l-4 shadow-sm col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-orange-600 text-lg font-semibold">
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 animate-pulse" />
                Urgent Renewal Alerts (Unread)
              </div>
              {notifications.length > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className="text-sm border-b pb-3 last:border-b-0 p-1 rounded flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <p className="text-gray-700 font-medium mb-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        Alert received:{" "}
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 ml-4"
                    >
                      <Check className="w-4 h-4 mr-2" /> Mark as Read
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic py-4">
                {`No new renewal alerts. Sab changa si!`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client List Table */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">
          Clients
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="px-6 py-3">Name</TableHead>
                  <TableHead className="px-6 py-3">Phone</TableHead>
                  <TableHead className="hidden sm:table-cell px-6 py-3">
                    Email
                  </TableHead>
                  <TableHead className="text-right px-6 py-3">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium px-6 py-4">
                        {client.name}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {client.phone || "N/A"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell px-6 py-4">
                        {client.email || "N/A"}
                      </TableCell>
                      <TableCell className="text-right px-6 py-4">
                        <a href={`/dashboard/clients/${client.id}`}>
                          <Button variant="outline" size="sm">
                            View / Edit
                          </Button>
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-gray-500"
                    >
                      {`No clients found. Click &quot;Add New Client&quot; to get started.`}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
