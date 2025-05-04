"use client";

import React, { useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFirestoreAddMutation, useFirestoreUpdateMutation } from '@/hooks/useFirestoreMutation';
import type { Client } from '@/types/crm';
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth hook

// Define Zod schema for validation
const clientFormSchema = z.object({
  name: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')), // Allow empty string
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  data?: Client | null; // Data for editing, null/undefined for adding
  onSave: () => void;
  onCancel: () => void;
}

export function ClientForm({ data, onSave, onCancel }: ClientFormProps) {
  const { toast } = useToast();
  const { teamId } = useAuth(); // Get the actual team ID from auth context
  const isEditMode = !!data;

  // Define the query key for clients - using the actual team ID
  const clientsQueryKey = teamId ? ['teams', teamId, CLIENTS_SUBCOLLECTION] : null;
  const collectionPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${CLIENTS_SUBCOLLECTION}` : '';

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      description: '',
      ...data, // Populate form with existing data if editing
    },
  });

  // Reset form when `data` changes (e.g., when opening the dialog for add/edit)
  useEffect(() => {
    form.reset({
      name: '',
      email: '',
      phone: '',
      address: '',
      description: '',
      ...data, // Use new data or defaults
    });
  }, [data, form]);

  const addMutation = useFirestoreAddMutation<Client>();
  const updateMutation = useFirestoreUpdateMutation<Client>();

  const onSubmit = async (values: ClientFormValues) => {
    // Ensure we have a team ID before proceeding
    if (!teamId) {
      toast({ 
        title: "Error", 
        description: "No team selected. Please try again or contact support.", 
        variant: "destructive" 
      });
      return;
    }

    const mutationOptions = {
      onSuccess: () => {
        toast({ title: `Client ${isEditMode ? 'Updated' : 'Added'}`, description: `Client "${values.name}" has been successfully ${isEditMode ? 'updated' : 'added'}.` });
        form.reset(); // Reset form after successful submission
        onSave(); // Call the onSave callback (e.g., close dialog)
      },
      onError: (error: Error) => {
        toast({ title: `Error ${isEditMode ? 'Updating' : 'Adding'} Client`, description: error.message, variant: "destructive" });
        console.error("Form submission error:", error);
      },
    };

    if (isEditMode && data?.id) {
      updateMutation.mutate(
        {
          collectionPath: collectionPath,
          docId: data.id,
          data: values,
          invalidateQueryKeys: [clientsQueryKey!],
        },
        mutationOptions
      );
    } else {
      addMutation.mutate(
        {
          collectionPath: collectionPath,
          data: values,
          invalidateQueryKeys: [clientsQueryKey!],
        },
        mutationOptions
      );
    }
  };

  const isLoading = addMutation.isPending || updateMutation.isPending || !teamId;

  // Show a message if no team ID is available
  if (!teamId) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Loading team information...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="client-form">
        {/* Form fields remain the same... */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name *</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corporation" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contact@acme.com" {...field} disabled={isLoading} />
              </FormControl>
               <FormDescription>
                 Optional contact email for the client.
               </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., +1 555-123-4567" {...field} disabled={isLoading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="123 Main St, Anytown, USA 12345" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description / Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional: Notes about the client, industry, needs, etc. Used for AI suggestions." {...field} rows={4} disabled={isLoading}/>
              </FormControl>
              <FormDescription>
                Provide some context about the client for better AI activity suggestions.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Footer with Submit/Cancel */}
         <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Client')}
            </Button>
         </div>
      </form>
    </Form>
  );
}