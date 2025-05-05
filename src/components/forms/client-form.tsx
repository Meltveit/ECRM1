// src/components/forms/client-form.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { useFirestoreAddMutation, useFirestoreUpdateMutation } from '@/hooks/useFirestoreMutation';
import type { Client, PipelineStage } from '@/types/crm'; // Import PipelineStage type
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

// Define available pipeline stages for the form select
const pipelineStages: PipelineStage[] = ['lead', 'contact', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];

// Define Zod schema for validation, including new fields
const clientFormSchema = z.object({
  name: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  value: z.preprocess( // Preprocess to convert empty string to undefined, then validate number
      (val) => (val === "" || val === null ? undefined : Number(val)),
      z.number().positive({ message: "Value must be a positive number." }).optional()
  ),
  pipelineStage: z.enum(pipelineStages),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  data?: Client | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ClientForm({ data, onSave, onCancel }: ClientFormProps) {
  const { toast } = useToast();
  const { teamId } = useAuth();
  const isEditMode = !!data;

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
      value: undefined, // Initialize value as undefined
      pipelineStage: 'lead', // Default to 'lead' for new clients
      ...data, // Populate form with existing data if editing
      value: data?.value ?? undefined, // Ensure value is number or undefined
    },
  });

  useEffect(() => {
    form.reset({
      name: '',
      email: '',
      phone: '',
      address: '',
      description: '',
      value: undefined,
      pipelineStage: 'lead',
      ...data,
      value: data?.value ?? undefined,
    });
  }, [data, form]);

  const addMutation = useFirestoreAddMutation<Client>();
  const updateMutation = useFirestoreUpdateMutation<Client>();

  const onSubmit = async (values: ClientFormValues) => {
    if (!teamId) {
      toast({ title: "Error", description: "No team selected.", variant: "destructive" });
      return;
    }

    const mutationOptions = {
      onSuccess: () => {
        toast({ title: `Client ${isEditMode ? 'Updated' : 'Added'}`, description: `Client "${values.name}" has been successfully ${isEditMode ? 'updated' : 'added'}.` });
        form.reset();
        onSave();
      },
      onError: (error: Error) => {
        toast({ title: `Error ${isEditMode ? 'Updating' : 'Adding'} Client`, description: error.message, variant: "destructive" });
        console.error("Form submission error:", error);
      },
    };

    // Prepare data, ensuring value is stored as a number or null/undefined
    const dataToSave = {
      ...values,
      value: values.value !== undefined ? Number(values.value) : null, // Store as number or null
    };

    if (isEditMode && data?.id) {
      updateMutation.mutate(
        {
          collectionPath: collectionPath,
          docId: data.id,
          data: dataToSave,
          invalidateQueryKeys: [clientsQueryKey!],
        },
        mutationOptions
      );
    } else {
        // If adding, ensure pipelineStage is set (default is 'lead')
      addMutation.mutate(
        {
          collectionPath: collectionPath,
          data: dataToSave,
          invalidateQueryKeys: [clientsQueryKey!],
        },
        mutationOptions
      );
    }
  };

  const isLoading = addMutation.isPending || updateMutation.isPending || !teamId;

  if (!teamId) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Loading team information...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="client-form">
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

        {/* Pipeline Stage Select */}
        <FormField
            control={form.control}
            name="pipelineStage"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Pipeline Stage *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select pipeline stage..." />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {pipelineStages.map(stage => (
                        <SelectItem key={stage} value={stage} className="capitalize">
                            {/* Improve display text */}
                            {stage.replace('-', ' ')}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
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

        {/* Deal Value Input */}
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deal Value (€)</FormLabel>
              <FormControl>
                 {/* Use field.value directly, which should be number or undefined */}
                <Input type="number" placeholder="e.g., 5000" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} min="0" step="0.01" disabled={isLoading} />
              </FormControl>
              <FormDescription>
                Optional: Estimated or final value of the deal.
              </FormDescription>
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
                <Textarea placeholder="Optional: Notes about the client, industry, needs, etc. Used for AI suggestions." {...field} rows={3} disabled={isLoading}/>
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
