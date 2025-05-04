"use client";

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';

import MainLayout from '@/components/main-layout';
import { CrudPageLayout } from '@/components/crud-page-layout';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClientForm } from '@/components/forms/client-form'; // Create this form component
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import { useFirestoreDeleteMutation } from '@/hooks/useFirestoreMutation';
import type { Client } from '@/types/crm';
import { MOCK_TEAM_ID } from '@/types/crm'; // Import mock team ID
import { CLIENTS_SUBCOLLECTION } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";


// Define the query key for clients
const clientsQueryKey = ['teams', MOCK_TEAM_ID, CLIENTS_SUBCOLLECTION];
const collectionPath = `${TEAMS_COLLECTION}/${MOCK_TEAM_ID}/${CLIENTS_SUBCOLLECTION}`;

export default function ClientsPage() {
  const { toast } = useToast();
  const { data: clients, isLoading, error } = useFirestoreCollection<Client>(
    collectionPath,
    clientsQueryKey
  );

  const deleteMutation = useFirestoreDeleteMutation();

  const handleDeleteClient = (clientId: string) => {
    deleteMutation.mutate(
      {
        collectionPath: collectionPath,
        docId: clientId,
        invalidateQueryKeys: [clientsQueryKey],
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

  // Define columns for the DataTable
  const columns: ColumnDef<Client>[] = [
    // { // Optional: Select Checkbox
    //   id: "select",
    //   header: ({ table }) => (
    //     <Checkbox
    //       checked={table.getIsAllPageRowsSelected()}
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => row.toggleSelected(!!value)}
    //       aria-label="Select row"
    //     />
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
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
      cell: ({ row, table }) => {
        const client = row.original;
         // Access the onEdit function passed down from CrudPageLayout
        const onEdit = (table.options.meta as any)?.onEdit;


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
                  <DropdownMenuItem onClick={() => onEdit?.(client)}> {/* Call onEdit */}
                    Edit Client
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Integrate Delete Confirmation */}
                  <DeleteConfirmationDialog
                     onConfirm={() => handleDeleteClient(client.id)}
                     triggerVariant="ghost"
                     triggerSize="sm"
                     triggerText="Delete Client"
                     isLoading={deleteMutation.isPending}
                     dialogDescription={`This will permanently delete the client "${client.name}".`}
                  >
                     <Button variant="ghost" className="w-full justify-start p-2 h-8 text-destructive hover:text-destructive">
                        Delete Client
                     </Button>
                  </DeleteConfirmationDialog>
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


  return (
    <MainLayout>
      <CrudPageLayout<Client> title="Clients" formComponent={ClientForm}>
        {isLoading ? (
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
            // Pass the onEdit function down to the DataTable meta options
             meta={{
                onEdit: (data: Client) => {
                   // Find the CrudPageLayout's handleOpenDialog function (this is a bit hacky)
                   // A better approach might use context or Zustand for state management
                   const editHandler = (window as any).handleOpenEditDialog; // Assuming CrudPageLayout exposes it globally
                   if (editHandler) editHandler(data);
                   else console.warn("Edit handler not found");
                 },
             }}
             // Provide a simple onRowClick for demonstration
             // onRowClick={(client) => console.log("Clicked client:", client.name)}
          />
        )}
      </CrudPageLayout>
    </MainLayout>
  );
}

// Hacky way to expose edit handler - consider better state management
// This would ideally be done in CrudPageLayout itself using useEffect
if (typeof window !== 'undefined') {
  (window as any).handleOpenEditDialog = (data: any) => {
     // This function needs to be implemented or connected to CrudPageLayout's state setter
     console.log("Trigger edit for:", data);
     // Example: find the button/trigger for the dialog and click it, passing data
     // Or use a state management library (Context, Zustand)
  };
}

