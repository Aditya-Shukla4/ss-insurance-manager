/// <reference types="https://deno.land/x/deno/cli/types/deploy.d.ts" />

// Import CORS headers from the _shared folder
import { corsHeaders } from "../_shared/cors.ts";
// Supabase client library - remote import is fine for Deno runtime
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

console.log("Renewal Checker Function Initializing...");

// Define the structure of the policy data we expect
// Ensure column names match your Supabase table exactly
interface DbPolicy {
  id: string;
  plan_name: string;
  due_date: string; // Assuming 'date' type in Supabase maps to string here
  // Define the structure for the related client data
  clients: {
    name: string;
    // email?: string; // Add if you select it later
  } | null; // Use null if the relation might not exist or wasn't fetched
}

// Define structure for the processed renewal data
interface UpcomingRenewal {
  id: string;
  plan_name: string;
  due_date: string;
  client_name: string | null; // Store just the name
}

// Type assertion for Supabase client, although createClient usually infers it
let supabaseClient: SupabaseClient;

// Use Deno.serve for handling requests
Deno.serve(async (req: Request) => {
  // Added explicit type 'Request' for req
  // Handle CORS preflight requests (OPTIONS method)
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log(`Function invoked via ${req.method} request...`);

    // Create Supabase client using environment variables
    // Ensure these variables are set in your Supabase project settings -> Functions -> renewal-checker -> Environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY"); // Use ANON key for read access

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables."
      );
    }

    // Initialize Supabase client
    supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      // Pass auth headers specific to Edge Functions context
      { global: { headers: { Authorization: `Bearer ${supabaseAnonKey}` } } }
    );
    console.log("Supabase client created successfully.");

    // Calculate dates reliably
    const today = new Date();
    // Ensure proper UTC handling if your DB dates are timezone-aware, otherwise local time is often fine
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const next7Date = new Date(today); // Clone today's date
    next7Date.setDate(today.getDate() + 7);
    const next7Str = next7Date.toISOString().split("T")[0]; // YYYY-MM-DD for next 7 days

    console.log(
      `Checking for active policies due between ${todayStr} and ${next7Str}`
    );

    // Fetch policies due in the next 7 days, including related client name
    const { data: policiesData, error: fetchError } = await supabaseClient
      .from("policies")
      .select(
        `
        id,
        plan_name,
        due_date,
        clients ( name )
      `
      )
      .eq("status", "Active") // Filter by active status
      .gte("due_date", todayStr) // Due date is today or in the future
      .lte("due_date", next7Str) // Due date is within the next 7 days
      .order("due_date", { ascending: true }); // Order by the soonest

    // Handle potential fetch errors
    if (fetchError) {
      console.error("Database error fetching policies:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`); // Throw specific error
    }

    const policies: DbPolicy[] = policiesData || []; // Ensure policies is always an array
    console.log(`Found ${policies.length} active policies due soon.`);

    // Process the results
    const upcomingRenewals: UpcomingRenewal[] = [];
    if (policies.length > 0) {
      console.log("--- Policies Due Soon ---");
      policies.forEach((policy) => {
        // Safely access client name
        const clientName = policy.clients?.name ?? "Unknown Client";
        console.log(
          `- Policy ID: ${policy.id}, Plan: ${policy.plan_name}, Client: ${clientName}, Due: ${policy.due_date}`
        );
        upcomingRenewals.push({
          id: policy.id,
          plan_name: policy.plan_name,
          due_date: policy.due_date,
          client_name: clientName,
        });
      });
      console.log("-------------------------");
    } else {
      console.log("No policies require renewal reminders in the next 7 days.");
    }

    // Return a success response with the processed data
    return new Response(
      JSON.stringify({
        message: `Checked for renewals. Found ${upcomingRenewals.length} policies due in the next 7 days.`,
        renewalsFound: upcomingRenewals, // Return the processed list
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Add type for error object
    const err = error as Error; // Type assertion
    console.error("Function execution error:", err);
    // Return a detailed error response
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500, // Internal Server Error
      }
    );
  }
});

/*
Deployment and Scheduling Comments remain the same. Ensure you replace placeholders.
To Deploy (Run in project root):
1. supabase functions deploy renewal-checker --no-verify-jwt

To Schedule (SQL Editor):
SELECT cron.schedule(...);
*/

console.log(`Function renewal-checker setup complete. Ready to serve.`);
