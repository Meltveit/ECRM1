// src/app/(app)/users/page.tsx
"use client";

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';

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
import { UserForm } from '@/components/forms/user-form';
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import { useFirestoreDeleteMutation } from '@/hooks/useFirestoreMutation';
import type { TeamUser } from '@/types/crm';
import { TEAMS_COLLECTION, TEAM_USERS_SUBCOLLECTION } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export default function UsersPage() {
  const { toast } = useToast();
  const { teamId, teamUser } = useAuth();
  const isAdmin = teamUser?.role === 'admin';
  
  // Define the query key and collection path with the actual team ID
  const usersQueryKey = teamId ? ['teams', teamId, TEAM_USERS_SUBCOLLECTION] : null;
  const collectionPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${TEAM_USERS_SUBCOLLECTION}` : '';
  
  const { data: users, isLoading, error } = useFirestoreCollection<TeamUser>(
    collectionPath,
    usersQueryKey || [],
    [],
    { enabled: !!teamId }
  );

  const deleteMutation = useFirestoreDeleteMutation();

  const handleDeleteUser = (userId: string) => {
    if (!teamId || !isAdmin) {
      toast({ 
        title: "Error", 
        description: "You don't have permission to delete team members.", 
        variant: "destructive" 
      });
      return;
    }
    
    deleteMutation.mutate(
      {
        collectionPath: collectionPath,
        docId: userId,
        invalidateQueryKeys: [usersQueryKey!],
      },
      {
        onSuccess: () => {
          toast({ title: "User Removed", description: "The user has been removed from the team." });
        },
        onError: (error) => {
          toast({ title: "Error Removing User", description: error.message, variant: "destructive" });
        },
      }
    );
  };

  // Handle edit user
  const handleEditUser = (user: TeamUser) => {
    const editHandler = (window as any).handleOpenEditDialog;
    if (editHandler) {
      editHandler(user);
    } else {
      console.warn("Edit handler not found");
    }
  };

  // Define columns for the DataTable
  const columns: ColumnDef<TeamUser>[] = [
    {
      accessorKey: 'firstName',
      header: "First Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("firstName")}</div>,
    },
    {
      accessorKey: 'lastName',
      header: "Last Name",
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'role',
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
            {role === 'admin' ? 'Admin' : 'Member'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = user.id === teamUser?.id;

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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                  Copy User ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem 
                    onClick={() => handleEditUser(user)}
                    disabled={!isAdmin}
                  >
                    Edit User
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {isAdmin && !isCurrentUser && (
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      const confirmed = confirm(`Are you sure you want to remove ${user.firstName} ${user.lastName} from the team? This action cannot be undone.`);
                      if (confirmed) {
                        handleDeleteUser(user.id);
                      }
                    }}
                    disabled={!isAdmin || isCurrentUser}
                  >
                    Remove from Team
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (error) {
    return <div className="flex justify-center">Error loading team users: {error.message}</div>;
  }

  // Show a loading state if waiting for team ID
  const isPageLoading = isLoading || !teamId;

  return (
    // MainLayout removed as it's handled by the layout
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <CrudPageLayout<TeamUser> 
        title="Team Users" 
        formComponent={UserForm}
        addButtonText="Add Team Member"
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
            data={users || []}
            filterInputPlaceholder="Filter by email..."
            filterColumnId="email"
            onRowClick={isAdmin ? handleEditUser : undefined}
          />
        )}
      </CrudPageLayout>
    </div>
  );
}

// Expose edit handler
if (typeof window !== 'undefined') {
  (window as any).handleOpenEditDialog = (data: any) => {
    console.log("Trigger edit for:", data);
  };
}
