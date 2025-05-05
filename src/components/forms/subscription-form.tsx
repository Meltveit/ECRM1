// src/components/forms/subscription-form.tsx
"use client";

import React, { useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useFirestoreAddMutation, useFirestoreUpdateMutation } from '@/hooks/useFirestoreMutation';
import { TEAMS_COLLECTION, SUBSCRIPTIONS_SUBCOLLECTION } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Zod schema for validation
const subscriptionSchema = z.object({
  clientId: z.string().optional(),
  planName: z.string().min(1, { message: "Plan name is required." }),
  status: z.enum(['active', 'inactive', 'trial', 'cancelled', 'past_due']),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date().nullable().optional(),
  price: z.number().optional(),
  stripeSubscriptionId: z.string().optional(),
  stripePriceId: z.string().optional(),
  currentPeriodEnd: z.date().optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormProps {
  data?: Subscription | null;
  clients: Client[];
  onSave: () => void;
  onCancel: () => void;
}

export function SubscriptionForm({ data, clients, onSave, onCancel }: SubscriptionFormProps) {
  const { toast } = useToast();
  const { teamId } = useAuth();
  const isEditMode = !!data;

  const subscriptionsQueryKey = teamId ? ['teams', teamId, SUBSCRIPTIONS_SUBCOLLECTION] : null;
  const collectionPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${SUBSCRIPTIONS_SUBCOLLECTION}` : '';

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      clientId: data?.clientId || '',
      planName: data?.planName || '',
      status: data?.status || 'active',
      startDate: data?.startDate?.toDate() || new Date(),
      endDate: data?.endDate?.toDate() || null,
      price: data?.price || undefined,
      stripeSubscriptionId: data?.stripeSubscriptionId || '',
      stripePriceId: data?.stripePriceId || '',
      currentPeriodEnd: data?.currentPeriodEnd?.toDate() || undefined,
    },
  });

   // Reset form when data changes
   useEffect(() => {
    form.reset({
      clientId: data?.clientId || '',
      planName: data?.planName || '',
      status: data?.status || 'active',
      startDate: data?.startDate?.toDate() || new Date(),
      endDate: data?.endDate?.toDate() || null,
      price: data?.price || undefined,
      stripeSubscriptionId: data?.stripeSubscriptionId || '',
      stripePriceId: data?.stripePriceId || '',
      currentPeriodEnd: data?.currentPeriodEnd?.toDate() || undefined,
    });
  }, [data, form]);


  const addMutation = useFirestoreAddMutation<Subscription>();
  const updateMutation = useFirestoreUpdateMutation<Subscription>();

  const onSubmit = async (values: SubscriptionFormValues) => {
     if (!teamId) {
      toast({ title: "Error", description: "No team selected.", variant: "destructive" });
      return;
    }

    const mutationOptions = {
      onSuccess: () => {
        toast({ title: `Subscription ${isEditMode ? 'Updated' : 'Added'}`, description: `Subscription "${values.planName}" has been successfully ${isEditMode ? 'updated' : 'added'}.` });
        form.reset();
        onSave();
      },
      onError: (error: Error) => {
        toast({ title: `Error ${isEditMode ? 'Updating' : 'Adding'} Subscription`, description: error.message, variant: "destructive" });
      },
    };

    // Convert dates to Timestamps before saving
    const saveData = {
      ...values,
      startDate: Timestamp.fromDate(values.startDate),
      endDate: values.endDate ? Timestamp.fromDate(values.endDate) : null,
      currentPeriodEnd: values.currentPeriodEnd ? Timestamp.fromDate(values.currentPeriodEnd) : undefined,
      clientId: values.clientId || undefined, // Ensure empty string becomes undefined
    };

    if (isEditMode && data?.id) {
      updateMutation.mutate(
        {
          collectionPath,
          docId: data.id,
          data: saveData,
          invalidateQueryKeys: [subscriptionsQueryKey!],
        },
        mutationOptions
      );
    } else {
      addMutation.mutate(
        {
          collectionPath,
          data: saveData,
          invalidateQueryKeys: [subscriptionsQueryKey!],
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="subscription-form">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link to Client (Optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client (optional)..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* <SelectItem value="">None</SelectItem>  Removed this line to fix the error */}
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="planName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Pro Tier, Basic Support" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status *</FormLabel>
               <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                   <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (Optional)</FormLabel>
              <FormControl>
                 {/* Use Input type="number" and handle potential string value from field */}
                <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 99.99"
                    disabled={isLoading}
                    {...field}
                    value={field.value ?? ''} // Handle undefined value
                    onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Start Date *</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                        >
                        {field.value ? (
                            format(field.value, "PPP")
                        ) : (
                            <span>Pick start date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01") || isLoading
                        }
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
           <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>End Date (Optional)</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                        >
                        {field.value ? (
                            format(field.value, "PPP")
                        ) : (
                            <span>Pick end date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => field.onChange(date || null)} // Handle undefined date as null
                        disabled={isLoading}
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
       </div>
        
        {/* Stripe Fields (optional inputs) */}
        <FormField
          control={form.control}
          name="stripeSubscriptionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stripe Subscription ID (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="sub_..." {...field} disabled={isLoading} />
              </FormControl>
               <FormDescription>
                 If managed via Stripe, enter the subscription ID here.
               </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="stripePriceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stripe Price ID (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="price_..." {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
         <FormField
            control={form.control}
            name="currentPeriodEnd"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Current Period End (Optional)</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                        >
                        {field.value ? (
                            format(field.value, "PPP")
                        ) : (
                            <span>Set current billing period end</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => field.onChange(date || undefined)} // Handle undefined date as null
                        disabled={isLoading}
                    />
                    </PopoverContent>
                </Popover>
                 <FormDescription>
                 Optional: Useful if syncing with Stripe or another billing system.
               </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Subscription')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    