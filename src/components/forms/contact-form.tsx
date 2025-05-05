// src/components/forms/contact-form.tsx
"use client";

import React, { useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestoreAddMutation, useFirestoreUpdateMutation } from '@/hooks/useFirestoreMutation';
import type { Contact, Client } from '@/types/crm';
import { TEAMS_COLLECTION, CONTACTS_SUBCOLLECTION } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

// Define Zod schema for validation
const contactFormSchema = z.object({
  clientId: z.string().min(1, { message: "Please link this contact to a client." }),
  name: z.string().min(2, { message: "Contact name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  data?: Contact | null;
  clients: Client[]; // List of clients to link to
  onSave: () => void;
  onCancel: () => void;
}

export function ContactForm({ data, clients, onSave, onCancel }: ContactFormProps) {
  const { toast } = useToast();
  const { teamId } = useAuth();
  const isEditMode = !!data;

  // Query key for invalidation
  const contactsQueryKey = teamId ? ['teams', teamId, CONTACTS_SUBCOLLECTION] : null;
  const collectionPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${CONTACTS_SUBCOLLECTION}` : '';

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      clientId: '',
      name: '',
      email: '',
      phone: '',
      role: '',
      ...data,
    },
  });

  // Reset form when data changes
  useEffect(() => {
    form.reset({
      clientId: '',
      name: '',
      email: '',
      phone: '',
      role: '',
      ...data,
    });
  }, [data, form]);

  const addMutation = useFirestoreAddMutation<Contact>();
  const updateMutation = useFirestoreUpdateMutation<Contact>();

  const onSubmit = async (values: ContactFormValues) => {
    if (!teamId) {
      toast({ title: "Error", description: "No team selected.", variant: "destructive" });
      return;
    }

    const mutationOptions = {
      onSuccess: () => {
        toast({ title: `Contact ${isEditMode ? 'Updated' : 'Added'}`, description: `Contact "${values.name}" has been successfully ${isEditMode ? 'updated' : 'added'}.` });
        form.reset();
        onSave();
      },
      onError: (error: Error) => {
        toast({ title: `Error ${isEditMode ? 'Updating' : 'Adding'} Contact`, description: error.message, variant: "destructive" });
      },
    };

    if (isEditMode && data?.id) {
      updateMutation.mutate(
        {
          collectionPath,
          docId: data.id,
          data: values,
          invalidateQueryKeys: [contactsQueryKey!],
        },
        mutationOptions
      );
    } else {
      addMutation.mutate(
        {
          collectionPath,
          data: values,
          invalidateQueryKeys: [contactsQueryKey!],
        },
        mutationOptions
      );
    }
  };

  const isLoading = addMutation.isPending || updateMutation.isPending || !teamId;

  if (!teamId) {
    return <div className="p-4 text-center"><p className="text-muted-foreground">Loading team information...</p></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="contact-form">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link to Client *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client to link..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.length === 0 && <SelectItem value="no-clients" disabled>No clients found</SelectItem>}
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Name *</FormLabel>
              <FormControl>
                <Input placeholder="Jane Smith" {...field} disabled={isLoading} />
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
                <Input type="email" placeholder="jane.smith@client.com" {...field} disabled={isLoading} />
              </FormControl>
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
                <Input placeholder="+1 555-987-6543" {...field} disabled={isLoading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role / Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Project Manager, Billing Contact" {...field} disabled={isLoading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Contact')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
