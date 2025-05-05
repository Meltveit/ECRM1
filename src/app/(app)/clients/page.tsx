// src/app/(app)/clients/page.tsx
"use client";

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, DollarSign, User, CheckCircle, XCircle, FileText, Handshake, Hourglass, ChevronsRight } from 'lucide-react'; // Added icons

// Removed MainLayout import
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
import { ClientForm } from '@/components/forms/client-form';
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import { useFirestoreDeleteMutation } from '@/hooks/useFirestoreMutation';
import type { Client, PipelineStage } from '@/types/crm'; // Import PipelineStage
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

// Helper to format currency
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Map stages to icons and text
const stageDisplay: Record<PipelineStage, { icon: React.ElementType, text: string, colorClass: string }> = {
    'lead': { icon: ChevronsRight, text: 'Lead', colorClass: 'text-gray-500' },
    'contact': { icon: Handshake, text: 'Contact Made', colorClass: 'text-blue-500' },
    'proposal': { icon: FileText, text: 'Proposal Sent', colorClass: 'text-purple-500' },
    'negotiation': { icon: Hourglass, text: 'Negotiation', colorClass: 'text-orange-500' },
    'closed-won': { icon: CheckCircle, text: 'Won', colorClass: 'text-green-600' },
    'closed-lost': { icon: XCircle, text: 'Lost', colorClass: 'text-red-600' },
};


export default function ClientsPage() {
  const { toast } = useToast();
  const { teamId } = useAuth();

  // Define the query key and collection path with the actual team ID
  const clientsQueryKey = teamId ? ['teams', teamId, CLIENTS_SUBCOLLECTION] : null;
  const collectionPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${CLIENTS_SUBCOLLECTION}` : '';

  const { data: clients, isLoading, error } = useFirestoreCollection<Client>(
    collectionPath,
    clientsQueryKey || [],
    [],
    { enabled: !!teamId }
  );

  const deleteMutation = useFirestoreDeleteMutation();

  const handleDeleteClient = (clientId: string) => {
    if (!teamId) {
      toast({
        title: "Error",
        description: "No team selected. Please try again or contact support.",
        variant: "destructive"
      });
      return;
    }

    deleteMutation.mutate(
      {
        collectionPath: collectionPath,
        docId: clientId,
        invalidateQueryKeys: [clientsQueryKey!],
      },
      {
        onSuccess: () => {
          toast({ title: "Client Deleted", description: "The client has been successfully deleted." });
        },
        onError: (error) => {
          toast({ title: "Error Deleting Client", description: error.message, variant: "destructive" });
        },
      }
    );
  };

  // Handle edit client - this function will be called when a row is clicked
  const handleEditClient = (client: Client) => {
    // Access the CrudPageLayout's handleOpenDialog function
    const editHandler = (window as any).handleOpenEditDialog;
    if (editHandler) {
      editHandler(client);
    } else {
      console.warn("Edit handler not found");
    }
  };

  // Define columns for the DataTable
  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: 'email',
      header: "Email",
       cell: ({ row }) => row.getValue("email") || '-',
    },
    {
        accessorKey: 'pipelineStage',
        header: "Pipeline Stage",
        cell: ({ row }) => {
           const stage = row.getValue("pipelineStage") as PipelineStage || 'lead';
           const displayInfo = stageDisplay[stage];
           return displayInfo ? (
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${displayInfo.colorClass}`}>
                    <displayInfo.icon className="h-3.5 w-3.5"/>
                    {displayInfo.text}
                </span>
           ) : 'Lead';
        },
    },
    {
        accessorKey: 'value',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="justify-end w-full" // Align header text right
            >
                Value
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="text-right font-medium flex items-center justify-end gap-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground"/>
                {formatCurrency(row.getValue("value"))}
            </div>
        ),
    },
    {
        accessorKey: 'assignedUserName',
        header: "Assigned To",
        cell: ({ row }) => (
            <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted-foreground"/>
                {row.getValue("assignedUserName") || '-'}
            </div>
        ),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const client = row.original;

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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(client.id)}>
                  Copy Client ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEditClient(client)}>
                  Edit Client
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => e.stopPropagation()} // Prevent row click
                    onSelect={(e) => e.preventDefault()} // Prevent menu close
                    asChild
                 >
                     <DeleteConfirmationDialog
                        onConfirm={() => handleDeleteClient(client.id)}
                        triggerText="Delete Client"
                        triggerVariant="ghost"
                        triggerSize="sm"
                        triggerClassName="w-full justify-start relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:text-destructive focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 h-auto" // mimic item style
                        dialogTitle={`Delete ${client.name}?`}
                        dialogDescription="Are you sure? This action cannot be undone."
                        isLoading={deleteMutation.isPending}
                      >
                         {/* Override default button */}
                         <span className="w-full">Delete Client</span>
                     </DeleteConfirmationDialog>
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (error) {
    return <div>Error loading clients: {error.message}</div>;
  }

  // Show a loading state if waiting for team ID
  const isPageLoading = isLoading || !teamId;

  return (
    // Use container and py-6 for consistent padding
    <div className="container mx-auto py-6">
        <CrudPageLayout<Client>
            title="Clients"
            formComponent={(props) => <ClientForm {...props} />} // Pass props to ClientForm
            addDialogDescription="Add a new potential client or lead."
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
            data={clients || []}
            filterInputPlaceholder="Filter by name..."
            filterColumnId="name"
            onRowClick={handleEditClient} // Pass the edit function using onRowClick prop
            />
        )}
        </CrudPageLayout>
    </div>
  );
}

// Hacky way to expose edit handler - consider better state management
if (typeof window !== 'undefined') {
  (window as any).handleOpenEditDialog = (data: any) => {
    console.log("Trigger edit for:", data);
  };
}
