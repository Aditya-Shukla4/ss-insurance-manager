/// <reference types="https://deno.land/x/deno/cli/types/deploy.d.ts" />

// Import CORS headers from the _shared folder
import { corsHeaders } from "../_shared/cors.ts";
// Supabase client library - remote import is fine for Deno runtime
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

console.log("Renewal Checker Function Initializing (v2 - Now with DB Insert!)");

// Define the structure of the policy data we expect
interface DbPolicy {
  id: string; // Policy ID
  plan_name: string;
  due_date: string;
  // Define the structure for the related client data
  clients: {
    id: string; // Client ID
    name: string;
  } | null;
}

// Define the structure for the new notification row
interface NewNotification {
  type: "renewal_due";
  message: string;
  policy_id: string;
  client_id: string | null;
  due_date: string;
  is_read: false;
}

// Use Deno.serve for handling requests
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests (OPTIONS method)
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  let supabaseClient: SupabaseClient; // Declare client inside the handler

  try {
    console.log(`Function invoked via ${req.method} request...`);

    // --- IMPORTANT ---
    // We MUST use the SERVICE_ROLE_KEY to bypass RLS and insert into notifications
    // ANON_KEY does not have write access to the notifications table (based on our RLS policy)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // Use Service Role Key

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    }

    // Initialize Supabase client WITH SERVICE ROLE
    supabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      // Auth header is automatically handled when using Service Role Key
      { global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } } }
    );
    console.log("Supabase client created with Service Role.");

    // --- 1. Calculate Dates ---
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const next7Date = new Date(today);
    next7Date.setDate(today.getDate() + 7);
    const next7Str = next7Date.toISOString().split("T")[0];

    console.log(
      `Checking for active policies due between ${todayStr} and ${next7Str}`
    );

    // --- 2. Fetch Policies Due Soon ---
    const { data: policiesData, error: fetchError } = await supabaseClient
      .from("policies")
      .select(
        `
        id,
        plan_name,
        due_date,
        clients ( id, name )
      `
      )
      .eq("status", "Active")
      .gte("due_date", todayStr)
      .lte("due_date", next7Str)
      .order("due_date", { ascending: true });

    if (fetchError) {
      console.error("Database error fetching policies:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    const policies: DbPolicy[] = policiesData || [];
    console.log(`Found ${policies.length} active policies due soon.`);

    if (policies.length === 0) {
      console.log(
        "No policies require renewal reminders in the next 7 days. Exiting."
      );
      return new Response(
        JSON.stringify({ message: "No policies found due soon." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // --- 3. Prepare Notifications ---
    console.log("Preparing notifications to insert...");
    const notificationsToInsert: NewNotification[] = [];

    for (const policy of policies) {
      const clientName = policy.clients?.name ?? "Unknown Client";
      const clientId = policy.clients?.id ?? null;
      // Make sure due_date is treated correctly (assuming it's a simple YYYY-MM-DD string)
      const formattedDueDate = new Date(
        policy.due_date + "T00:00:00Z"
      ).toLocaleDateString("en-IN", { timeZone: "UTC" }); // Format as DD/MM/YYYY
      const message = `Renewal Due: Policy "${policy.plan_name}" for client "${clientName}" is due on ${formattedDueDate}.`;

      // Check if this notification ALREADY exists (to avoid duplicates)
      const { data: existingNotif, error: checkError } = await supabaseClient
        .from("notifications")
        .select("id")
        .eq("policy_id", policy.id)
        .eq("type", "renewal_due")
        .eq("due_date", policy.due_date) // Check for this specific due date
        .limit(1);

      if (checkError) {
        console.error(
          `Error checking existing notification for policy ${policy.id}:`,
          checkError.message
        );
        continue; // Skip this one on error
      }

      if (existingNotif && existingNotif.length > 0) {
        console.log(
          `Notification for policy ${policy.id} (due ${policy.due_date}) already exists. Skipping.`
        );
      } else {
        // Add to batch
        notificationsToInsert.push({
          type: "renewal_due",
          message: message,
          policy_id: policy.id,
          client_id: clientId,
          due_date: policy.due_date,
          is_read: false,
        });
      }
    }

    // --- 4. Insert Notifications into DB ---
    if (notificationsToInsert.length > 0) {
      console.log(
        `Inserting ${notificationsToInsert.length} new notifications...`
      );
      const { error: insertError } = await supabaseClient
        .from("notifications")
        .insert(notificationsToInsert);

      if (insertError) {
        console.error("Database error inserting notifications:", insertError);
        throw new Error(`Database insert error: ${insertError.message}`);
      }
      console.log("Successfully inserted new notifications!");
    } else {
      console.log("All due policies already have notifications.");
    }

    // --- 5. Return Success ---
    return new Response(
      JSON.stringify({
        message: `Check complete. Found ${policies.length} policies. Inserted ${notificationsToInsert.length} new notifications.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const err = error as Error;
    console.error("Function execution error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

console.log(`Function renewal-checker (v2) setup complete. Ready to serve.`);
