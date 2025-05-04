"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming you have Select
import { TeamUser } from '@/types/crm';

interface UserFormProps {
  data?: TeamUser | null;
  onSave: () => void;
  onCancel: () => void;
}

export function UserForm({ data, onSave, onCancel }: UserFormProps) {
  // Basic placeholder form structure
  // Replace with react-hook-form and Zod validation later
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add logic to save user data (add/update)
    console.log("Saving user...");
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="user-form">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input id="name" placeholder="John Doe" defaultValue={data?.name} required />
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" placeholder="john.doe@example.com" defaultValue={data?.email} required />
      </div>
       <div>
           <Label htmlFor="role">Role *</Label>
            <Select defaultValue={data?.role || 'member'}>
                <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                </SelectContent>
            </Select>
       </div>
       <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
          </Button>
          <Button type="submit">
              {data ? 'Save Changes' : 'Add User'}
          </Button>
       </div>
    </form>
  );
}
