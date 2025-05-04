"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Subscription, Client } from '@/types/crm';
import { Timestamp } from 'firebase/firestore';

interface SubscriptionFormProps {
  data?: Subscription | null;
  clients: Client[]; // Need list of clients to optionally link subscription
  onSave: () => void;
  onCancel: () => void;
}

export function SubscriptionForm({ data, clients, onSave, onCancel }: SubscriptionFormProps) {
  const [startDate, setStartDate] = React.useState<Date | undefined>(data?.startDate ? data.startDate.toDate() : new Date());
  const [endDate, setEndDate] = React.useState<Date | undefined>(data?.endDate ? data.endDate.toDate() : undefined);

  // Basic placeholder form structure
  // Replace with react-hook-form and Zod validation later
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add logic to save subscription data (add/update)
    const saveData = {
        // gather form fields
        planName: (document.getElementById('planName') as HTMLInputElement)?.value,
        status: (document.getElementById('status') as HTMLSelectElement)?.value,
        price: parseFloat((document.getElementById('price') as HTMLInputElement)?.value) || undefined,
        clientId: (document.getElementById('client') as HTMLSelectElement)?.value || undefined,
        startDate: startDate ? Timestamp.fromDate(startDate) : Timestamp.now(),
        endDate: endDate ? Timestamp.fromDate(endDate) : undefined,
    }
    console.log("Saving subscription:", saveData);
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="subscription-form">
        <div>
           <Label htmlFor="client">Link to Client (Optional)</Label>
            <Select defaultValue={data?.clientId}>
                <SelectTrigger id="client">
                    <SelectValue placeholder="Select client (optional)..." />
                </SelectTrigger>
                <SelectContent>
                     <SelectItem value="">None</SelectItem>
                     {clients.map(client => (
                         <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                     ))}
                </SelectContent>
            </Select>
       </div>
      <div>
        <Label htmlFor="planName">Plan Name *</Label>
        <Input id="planName" placeholder="e.g., Pro Tier, Basic Support" defaultValue={data?.planName} required />
      </div>
      <div>
           <Label htmlFor="status">Status *</Label>
            <Select defaultValue={data?.status || 'active'}>
                <SelectTrigger id="status">
                    <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>
       </div>
        <div>
        <Label htmlFor="price">Price (Optional)</Label>
        <Input id="price" type="number" step="0.01" placeholder="e.g., 99.99" defaultValue={data?.price?.toString()} />
      </div>
       <div className="grid grid-cols-2 gap-4">
           <div>
               <Label htmlFor="startDate">Start Date *</Label>
               <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
           </div>
           <div>
               <Label htmlFor="endDate">End Date (Optional)</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                  </PopoverContent>
                </Popover>
           </div>
       </div>


       <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
          </Button>
          <Button type="submit">
              {data ? 'Save Changes' : 'Add Subscription'}
          </Button>
       </div>
    </form>
  );
}
