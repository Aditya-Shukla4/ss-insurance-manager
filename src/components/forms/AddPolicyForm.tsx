"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define the props this component will accept
interface AddPolicyFormProps {
  clientId: string;
  onSuccess: () => void; // A function to call when the policy is added successfully
}

export function AddPolicyForm({ clientId, onSuccess }: AddPolicyFormProps) {
  const [company, setCompany] = useState("");
  const [planName, setPlanName] = useState("");
  const [policyNo, setPolicyNo] = useState("");
  const [premium, setPremium] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Active"); // Default status
  const [commission, setCommission] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (
      !company ||
      !planName ||
      !policyNo ||
      !premium ||
      !dueDate ||
      !commission
    ) {
      alert("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("policies").insert([
      {
        client_id: clientId, // This is crucial to link the policy to the client
        company,
        plan_name: planName,
        policy_no: policyNo,
        premium: parseFloat(premium),
        due_date: dueDate,
        status,
        commission_percentage: parseFloat(commission),
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("Error adding policy:", error);
      alert("Failed to add policy: " + error.message);
    } else {
      alert("Policy added successfully!");
      onSuccess(); // This will close the dialog
    }
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="company" className="text-right">
          Company
        </Label>
        <Input
          id="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="planName" className="text-right">
          Plan Name
        </Label>
        <Input
          id="planName"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="policyNo" className="text-right">
          Policy No.
        </Label>
        <Input
          id="policyNo"
          value={policyNo}
          onChange={(e) => setPolicyNo(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="premium" className="text-right">
          Premium (₹)
        </Label>
        <Input
          id="premium"
          type="number"
          value={premium}
          onChange={(e) => setPremium(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="dueDate" className="text-right">
          Due Date
        </Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="commission" className="text-right">
          Commission (%)
        </Label>
        <Input
          id="commission"
          type="number"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">
          Status
        </Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="col-span-3 border rounded-md p-2"
        >
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Lapsed">Lapsed</option>
        </select>
      </div>
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Saving..." : "Save Policy"}
      </Button>
    </div>
  );
}
