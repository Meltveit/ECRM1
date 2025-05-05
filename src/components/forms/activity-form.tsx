// src/components/forms/activity-form.tsx
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn, formatTimestamp } from "@/lib/utils";
import { format } from "date-fns";
import { Activity, Client } from '@/types/crm';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestoreAddMutation, useFirestoreUpdateMutation } from '@/hooks/useFirestoreMutation';
import { TEAMS_COLLECTION, ACTIVITIES_SUBCOLLECTION } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";

interface ActivityFormProps {
  data?: Activity | null;
  clients: Client[]; // Need list of clients to link activity
  onSave: () => void;
  onCancel: () => void;
}

export function ActivityForm({ data, clients, onSave, onCancel }: ActivityFormProps) {
  const { toast } = useToast();
  const { user, teamId, teamUser } = useAuth();
  const [date, setDate] = React.useState<Date | undefined>(data?.date ? data.date.toDate() : new Date());
  const [dueDate, setDueDate] = React.useState<Date | undefined>(data?.dueDate ? data.dueDate.toDate() : undefined);
  const [notes, setNotes] = React.useState<string>(data?.notes || '');
  const [type, setType] = React.useState<string>(data?.type || 'Note');
  const [clientId, setClientId] = React.useState<string>(data?.clientId || '');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const addMutation = useFirestoreAddMutation<Activity>();
  const updateMutation = useFirestoreUpdateMutation<Activity>();

  // Define queryKey and collectionPath
  const activitiesQueryKey = teamId ? ['teams', teamId, ACTIVITIES_SUBCOLLECTION] : null;
  const collectionPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${ACTIVITIES_SUBCOLLECTION}` : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamId || !user) {
      toast({
        title: "Error",
        description: "You must be logged in to save activities",
        variant: "destructive"
      });
      return;
    }
    
    if (!clientId) {
      toast({
        title: "Missing Client",
        description: "Please select a client for this activity",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare activity data
      const activityData = {
        clientId,
        type,
        notes,
        date: date ? Timestamp.fromDate(date) : Timestamp.now(),
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
        userId: user.uid,
        userName: `${teamUser?.firstName || ''} ${teamUser?.lastName || ''}`.trim() || user.email,
        completed: false
      };
      
      if (data?.id) {
        // Update existing activity
        await updateMutation.mutateAsync({
          collectionPath,
          docId: data.id,
          data: activityData,
          invalidateQueryKeys: [activitiesQueryKey!],
        });
        
        toast({
          title: "Activity Updated",
          description: "The activity has been updated successfully"
        });
      } else {
        // Add new activity
        await addMutation.mutateAsync({
          collectionPath,
          data: activityData,
          invalidateQueryKeys: [activitiesQueryKey!],
        });
        
        toast({
          title: "Activity Added",
          description: "The activity has been added successfully"
        });
      }
      
      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "There was an error saving the activity",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="activity-form">
       <div>
           <Label htmlFor="client">Link to Client *</Label>
            <Select value={clientId} onValueChange={setClientId} disabled={isSubmitting}>
                <SelectTrigger id="client">
                    <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                     {/* Removed the SelectItem with value="" */}
                     {clients.map(client => (
                         <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                     ))}
                </SelectContent>
            </Select>
       </div>
        <div>
           <Label htmlFor="type">Activity Type *</Label>
            <Select value={type} onValueChange={setType} disabled={isSubmitting}>
                <SelectTrigger id="type">
                    <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Task">Task</SelectItem>
                    <SelectItem value="Note">Note</SelectItem>
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
                  disabled={isSubmitting}
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
       
       {/* New due date field */}
       <div>
           <Label htmlFor="dueDate">Due Date (Optional)</Label>
           <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !dueDate && "text-muted-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Set due date (optional)</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
       </div>
       
      <div>
        <Label htmlFor="notes">Notes / Summary *</Label>
        <Textarea
          id="notes"
          placeholder="Log details about the activity..."
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

       <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? (data ? 'Saving Changes...' : 'Logging Activity...')
                : (data ? 'Save Changes' : 'Log Activity')}
          </Button>
       </div>
    </form>
  );
}
