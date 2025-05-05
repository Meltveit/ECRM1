// src/app/(app)/subscriptions/page.tsx
"use client";

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Link as LinkIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

import { CrudPageLayout } from '@/components/crud-page-layout';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SubscriptionForm } from '@/components/forms/subscription-form';
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import { useFirestoreDeleteMutation } from '@/hooks/useFirestoreMutation';
import type { Subscription, Client } from '@/types/crm';
import { TEAMS_COLLECTION, SUBSCRIPTIONS_SUBCOLLECTION, CLIENTS_SUBCOLLECTION } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { formatTimestamp } from '@/lib/utils';


export default function SubscriptionsPage() {
  const { toast } = useToast();
  const { teamId } = useAuth();

  // Query keys and collection paths
  const subscriptionsQueryKey = teamId ? ['teams', teamId, SUBSCRIPTIONS_SUBCOLLECTION] : null;
  const subscriptionsPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${SUBSCRIPTIONS_SUBCOLLECTION}` : '';

  const clientsQueryKey = teamId ? ['teams', teamId, CLIENTS_SUBCOLLECTION] : null;
  const clientsPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${CLIENTS_SUBCOLLECTION}` : '';

  // Fetch subscriptions and clients
  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useFirestoreCollection<Subscription>(
    subscriptionsPath,
    subscriptionsQueryKey || [],
    [],
    { enabled: !!teamId }
  );

  const { data: clients, isLoading: isLoadingClients } = useFirestoreCollection<Client>(
    clientsPath,
    clientsQueryKey || [],
    [],
    { enabled: !!teamId }
  );

  const deleteMutation = useFirestoreDeleteMutation();

  const handleDeleteSubscription = (subscriptionId: string) => {
    if (!teamId) {
      toast({
        title: "Error",
        description: "No team selected.",
        variant: "destructive"
      });
      return;
    }

    deleteMutation.mutate(
      {
        collectionPath: subscriptionsPath,
        docId: subscriptionId,
        invalidateQueryKeys: [subscriptionsQueryKey!],
      },
      {
        onSuccess: () => {
          toast({ title: "Subscription Deleted", description: "The subscription has been successfully deleted." });
        },
        onError: (error) => {
          toast({ title: "Error Deleting Subscription", description: error.message, variant: "destructive" });
        },
      }
    );
  };

  // Handle edit subscription
  const handleEditSubscription = (subscription: Subscription) => {
    const editHandler = (window as any).handleOpenEditDialog;
    if (editHandler) {
      editHandler(subscription);
    } else {
      console.warn("Edit handler not found");
    }
  };

  // Map status to badge variant
  const getStatusVariant = (status: Subscription['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'active': return 'default';
        case 'trial': return 'secondary';
        case 'cancelled': return 'outline';
        case 'past_due': return 'destructive';
        case 'inactive': return 'outline';
        default: return 'outline';
    }
  }

  // Define columns for the DataTable
  const columns: ColumnDef<Subscription>[] = [
    {
      accessorKey: 'planName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Plan Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("planName")}</div>,
    },
    {
        accessorKey: 'status',
        header: "Status",
        cell: ({ row }) => {
           const status = row.getValue("status") as Subscription['status'];
           return status ? <Badge variant={getStatusVariant(status)} className="capitalize">{status.replace('_', ' ')}</Badge> : '-';
        },
    },
    {
        accessorKey: 'clientName', // Display client name
        header: "Linked Client",
        cell: ({ row }) => {
          const subscription = row.original;
          const client = clients?.find(c => c.id === subscription.clientId);
          return client ? (
                <span className="inline-flex items-center gap-1.5 text-xs px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    <LinkIcon className="h-3 w-3"/>
                    {client.name}
                </span>
          ) : 'None';
        },
    },
     {
      accessorKey: 'price',
      header: "Price",
      cell: ({ row }) => {
        const price = row.getValue("price") as number | undefined;
        // Format as currency (assuming EUR for example)
        return price !== undefined ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price) : '-';
      },
    },
    {
      accessorKey: 'startDate',
      header: "Start Date",
       cell: ({ row }) => formatTimestamp(row.getValue("startDate"), 'PP'),
    },
    {
      accessorKey: 'endDate',
      header: "End Date",
       cell: ({ row }) => row.getValue("endDate") ? formatTimestamp(row.getValue("endDate"), 'PP') : 'Ongoing',
    },
     {
      accessorKey: 'currentPeriodEnd',
      header: "Current Period End",
       cell: ({ row }) => row.getValue("currentPeriodEnd") ? formatTimestamp(row.getValue("currentPeriodEnd"), 'PP') : '-',
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const subscription = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                 <DropdownMenuItem onClick={() => navigator.clipboard.writeText(subscription.id)}>
                  Copy Subscription ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEditSubscription(subscription)}>
                  Edit Subscription
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => e.stopPropagation()} // Prevent row click
                     onSelect={(e) => e.preventDefault()} // Prevent menu closing
                     asChild
                >
                   <DeleteConfirmationDialog
                      onConfirm={() => handleDeleteSubscription(subscription.id)}
                      triggerText="Delete Subscription"
                      triggerVariant="ghost"
                      triggerSize="sm"
                      dialogTitle={`Delete ${subscription.planName} Subscription?`}
                      dialogDescription="Are you sure you want to delete this subscription? This action cannot be undone."
                      isLoading={deleteMutation.isPending}
                    />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const isPageLoading = isLoadingSubscriptions || isLoadingClients || !teamId;

  return (
    <div className="container mx-auto py-6">
       <CrudPageLayout<Subscription>
          title="Subscriptions"
          formComponent={(props) => <SubscriptionForm {...props} clients={clients || []} />}
          addButtonText="Add New Subscription"
          addDialogDescription="Add a new subscription plan."
        >
          {isPageLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full rounded-md border" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={subscriptions || []}
              filterInputPlaceholder="Filter by plan name..."
              filterColumnId="planName"
              onRowClick={handleEditSubscription}
            />
          )}
      </CrudPageLayout>
    </div>
  );
}

// Expose edit handler
if (typeof window !== 'undefined') {
  (window as any).handleOpenEditDialog = (data: any) => {
    console.log("Trigger edit for subscription:", data);
  };
}
