"use client";

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';

import MainLayout from '@/components/main-layout';
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
import type { Client } from '@/types/crm';
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

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
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.getValue("phone") || '-',
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => row.getValue("address") || '-',
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
                  onClick={() => {
                    // Show a confirmation dialog before deleting
                    const confirmed = confirm(`Are you sure you want to delete client "${client.name}"? This action cannot be undone.`);
                    if (confirmed) {
                      handleDeleteClient(client.id);
                    }
                  }}
                >
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (error) {
    return <MainLayout><div>Error loading clients: {error.message}</div></MainLayout>;
  }

  // Show a loading state if waiting for team ID
  const isPageLoading = isLoading || !teamId;

  return (
    <MainLayout>
      <CrudPageLayout<Client> title="Clients" formComponent={ClientForm}>
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
    </MainLayout>
  );
}

// Hacky way to expose edit handler - consider better state management
if (typeof window !== 'undefined') {
  (window as any).handleOpenEditDialog = (data: any) => {
    console.log("Trigger edit for:", data);
  };
}