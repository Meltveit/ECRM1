// src/app/(app)/contacts/page.tsx
"use client";

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Link as LinkIcon, Trash2 } from 'lucide-react';

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
import { ContactForm } from '@/components/forms/contact-form'; // Ensure this form is implemented
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import { useFirestoreDeleteMutation } from '@/hooks/useFirestoreMutation';
import type { Contact, Client } from '@/types/crm';
import { TEAMS_COLLECTION, CONTACTS_SUBCOLLECTION, CLIENTS_SUBCOLLECTION } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

export default function ContactsPage() {
  const { toast } = useToast();
  const { teamId } = useAuth();

  // Query keys and collection paths
  const contactsQueryKey = teamId ? ['teams', teamId, CONTACTS_SUBCOLLECTION] : null;
  const contactsPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${CONTACTS_SUBCOLLECTION}` : '';

  const clientsQueryKey = teamId ? ['teams', teamId, CLIENTS_SUBCOLLECTION] : null;
  const clientsPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${CLIENTS_SUBCOLLECTION}` : '';

  // Fetch contacts and clients
  const { data: contacts, isLoading: isLoadingContacts } = useFirestoreCollection<Contact>(
    contactsPath,
    contactsQueryKey || [],
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

  const handleDeleteContact = (contactId: string) => {
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
        collectionPath: contactsPath,
        docId: contactId,
        invalidateQueryKeys: [contactsQueryKey!],
      },
      {
        onSuccess: () => {
          toast({ title: "Contact Deleted", description: "The contact has been successfully deleted." });
        },
        onError: (error) => {
          toast({ title: "Error Deleting Contact", description: error.message, variant: "destructive" });
        },
      }
    );
  };

  // Handle edit contact - this function will be called when a row is clicked
  const handleEditContact = (contact: Contact) => {
    const editHandler = (window as any).handleOpenEditDialog;
    if (editHandler) {
      editHandler(contact);
    } else {
      console.warn("Edit handler not found");
    }
  };

  // Define columns for the DataTable
  const columns: ColumnDef<Contact>[] = [
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
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.getValue("phone") || '-',
    },
    {
      accessorKey: 'role',
      header: 'Role / Title',
      cell: ({ row }) => row.getValue("role") || '-',
    },
    {
        accessorKey: 'clientName', // Display client name
        header: "Linked Client",
        cell: ({ row }) => {
          const contact = row.original;
          const client = clients?.find(c => c.id === contact.clientId);
          return client ? (
                <span className="inline-flex items-center gap-1.5 text-xs px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    <LinkIcon className="h-3 w-3"/>
                    {client.name}
                </span>
          ) : 'Not Linked';
        },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const contact = row.original;

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
                 <DropdownMenuItem onClick={() => navigator.clipboard.writeText(contact.id)}>
                  Copy Contact ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                  Edit Contact
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => e.stopPropagation()} // Prevent row click when clicking delete item
                     onSelect={(e) => e.preventDefault()} // Prevent menu closing
                     asChild
                >
                   <DeleteConfirmationDialog
                      onConfirm={() => handleDeleteContact(contact.id)}
                      triggerText="Delete Contact"
                      triggerVariant="ghost"
                      triggerSize="sm"
                      dialogTitle={`Delete ${contact.name}?`}
                      dialogDescription="Are you sure you want to delete this contact? This action cannot be undone."
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

  const isPageLoading = isLoadingContacts || isLoadingClients || !teamId;

  return (
    <div className="container mx-auto py-6">
       <CrudPageLayout<Contact>
          title="Contacts"
          formComponent={(props) => <ContactForm {...props} clients={clients || []} />}
          addButtonText="Add New Contact"
          addDialogDescription="Add a new contact and link them to a client."
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
              data={contacts || []}
              filterInputPlaceholder="Filter by name..."
              filterColumnId="name"
              onRowClick={handleEditContact}
            />
          )}
      </CrudPageLayout>
    </div>
  );
}

// Expose edit handler
if (typeof window !== 'undefined') {
  (window as any).handleOpenEditDialog = (data: any) => {
    console.log("Trigger edit for contact:", data);
  };
}
