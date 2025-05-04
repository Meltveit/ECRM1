"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming you have Select
import { Contact, Client } from '@/types/crm'; // Import Client type if needed for selection

interface ContactFormProps {
  data?: Contact | null;
  clients: Client[]; // Need list of clients to link contact
  onSave: () => void;
  onCancel: () => void;
}

export function ContactForm({ data, clients, onSave, onCancel }: ContactFormProps) {
  // Basic placeholder form structure
  // Replace with react-hook-form and Zod validation later
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add logic to save contact data (add/update)
    console.log("Saving contact...");
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="contact-form">
       <div>
           <Label htmlFor="client">Link to Client *</Label>
            <Select defaultValue={data?.clientId}>
                <SelectTrigger id="client">
                    <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                    {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
       </div>
      <div>
        <Label htmlFor="name">Contact Name *</Label>
        <Input id="name" placeholder="Jane Smith" defaultValue={data?.name} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="jane.smith@client.com" defaultValue={data?.email} />
      </div>
       <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" placeholder="+1 555-987-6543" defaultValue={data?.phone} />
      </div>
      <div>
        <Label htmlFor="role">Role / Title</Label>
        <Input id="role" placeholder="e.g., Project Manager, Billing" defaultValue={data?.role} />
      </div>
       <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
          </Button>
          <Button type="submit">
              {data ? 'Save Changes' : 'Add Contact'}
          </Button>
       </div>
    </form>
  );
}
