"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

// We can pass a function to be called on successful submission
type AddClientFormProps = {
  onSuccess?: () => void;
};

export function AddClientForm({ onSuccess }: AddClientFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevents the default form submission behavior

    if (!name || !phone) {
      alert("Client Name and Phone are required.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("clients")
      .insert([{ name, phone, email, dob: dob || null }]); // dob can be optional

    if (error) {
      alert("Error adding client: " + error.message);
    } else {
      alert("Client added successfully!");
      // Reset form fields
      setName("");
      setPhone("");
      setEmail("");
      setDob("");
      // If an onSuccess function was passed, call it (e.g., to close the dialog)
      if (onSuccess) {
        onSuccess();
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            disabled={loading}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="phone" className="text-right">
            Phone
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="col-span-3"
            disabled={loading}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="col-span-3"
            disabled={loading}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="dob" className="text-right">
            DOB
          </Label>
          <Input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="col-span-3"
            disabled={loading}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Client"}
        </Button>
      </div>
    </form>
  );
}
