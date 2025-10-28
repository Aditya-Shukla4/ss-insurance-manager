// This file is the single source of truth for all our data structures.

// Represents a single row in our public.clients table
export type Client = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  dob: string | null;
  user_id: string | null; // Link to auth.users
};

// Represents a single row in our public.policies table
export type Policy = {
  id: string;
  company: string;
  plan_name: string;
  policy_no: string;
  premium: number;
  due_date: string;
  status: string;
  commission_percentage: number;
  client_id: string; // Link to clients table
};

// Represents a user's role and name from the public.profiles table
export type UserProfile = {
  role: "admin" | "client" | null;
  full_name: string | null;
};
