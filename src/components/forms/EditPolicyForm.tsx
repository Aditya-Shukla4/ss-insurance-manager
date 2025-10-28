"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Policy } from "@/lib/types"; // CORRECT: Import from the central types file

// Define the props this component will accept
interface EditPolicyFormProps {
  policy: Policy | null; // Allow policy to be null initially for robustness
  onSuccess: () => void; // A function to call when the policy is updated successfully
}

export function EditPolicyForm({ policy, onSuccess }: EditPolicyFormProps) {
  const [company, setCompany] = useState("");
  const [planName, setPlanName] = useState("");
  const [policyNo, setPolicyNo] = useState("");
  const [premium, setPremium] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Active");
  const [commission, setCommission] = useState("");
  const [loading, setLoading] = useState(false);

  // When the component loads, pre-fill the form with existing policy data
  useEffect(() => {
    if (policy) {
      setCompany(policy.company);
      setPlanName(policy.plan_name);
      setPolicyNo(policy.policy_no);
      setPremium(String(policy.premium));
      // Format the date correctly for the input type="date"
      setDueDate(new Date(policy.due_date).toISOString().split("T")[0]);
      setStatus(policy.status);
      setCommission(String(policy.commission_percentage));
    }
  }, [policy]);

  const handleSubmit = async () => {
    // ADDED ROBUSTNESS: Check if a policy is actually selected
    if (!policy) {
      alert("Error: No policy selected for editing.");
      return;
    }

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
    const { error } = await supabase
      .from("policies")
      .update({
        company,
        plan_name: planName,
        policy_no: policyNo,
        premium: parseFloat(premium),
        due_date: dueDate,
        status,
        commission_percentage: parseFloat(commission),
      })
      .eq("id", policy.id); // Crucial: specify which policy to update

    setLoading(false);

    if (error) {
      console.error("Error updating policy:", error);
      alert("Failed to update policy: " + error.message);
    } else {
      alert("Policy updated successfully!");
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
        {loading ? "Saving Changes..." : "Save Changes"}
      </Button>
    </div>
  );
}
