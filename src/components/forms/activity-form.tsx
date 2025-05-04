"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn, formatTimestamp } from "@/lib/utils";
import { format } from "date-fns";
import { Activity, Client } from '@/types/crm';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

interface ActivityFormProps {
  data?: Activity | null;
  clients: Client[]; // Need list of clients to link activity
  onSave: () => void;
  onCancel: () => void;
}

export function ActivityForm({ data, clients, onSave, onCancel }: ActivityFormProps) {
  const [date, setDate] = React.useState<Date | undefined>(data?.date ? data.date.toDate() : new Date());

  // Basic placeholder form structure
  // Replace with react-hook-form and Zod validation later
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add logic to save activity data (add/update)
    // Ensure date is converted back to Firestore Timestamp before saving
    const saveData = {
       // ... gather other form fields
       date: date ? Timestamp.fromDate(date) : Timestamp.now(),
       notes: (document.getElementById('notes') as HTMLTextAreaElement)?.value,
       type: (document.getElementById('type') as HTMLSelectElement)?.value, // Example, get value properly
       clientId: (document.getElementById('client') as HTMLSelectElement)?.value, // Example
    }
    console.log("Saving activity:", saveData);
    onSave();
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="activity-form">
       <div>
           <Label htmlFor="client">Link to Client *</Label>
            <Select defaultValue={data?.clientId}>
                <SelectTrigger id="client">
                    <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                     <SelectItem value="" disabled>Select a client...</SelectItem>
                     {clients.map(client => (
                         <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                     ))}
                </SelectContent>
            </Select>
       </div>
        <div>
           <Label htmlFor="type">Activity Type *</Label>
            <Select defaultValue={data?.type || 'Note'}>
                <SelectTrigger id="type">
                    <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Task">Task</SelectItem>
                    <SelectItem value="Note">Note</SelectItem>
                    {/* Add other types as needed */}
                </SelectContent>
            </Select>
       </div>
        <div>
           <Label htmlFor="date">Date *</Label>
           <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
       </div>
      <div>
        <Label htmlFor="notes">Notes / Summary *</Label>
        <Textarea id="notes" placeholder="Log details about the activity..." rows={6} defaultValue={data?.notes} required />
      </div>

       <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
          </Button>
          <Button type="submit">
              {data ? 'Save Changes' : 'Log Activity'}
          </Button>
       </div>
    </form>
  );
}
