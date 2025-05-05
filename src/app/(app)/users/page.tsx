// src/app/(app)/users/page.tsx
"use client";

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Crown, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions'; // Import Firebase functions

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
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'; // Import Card components
import { UserForm } from '@/components/forms/user-form';
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import { useFirestoreDeleteMutation } from '@/hooks/useFirestoreMutation';
import type { TeamUser } from '@/types/crm';
import { TEAMS_COLLECTION, TEAM_USERS_SUBCOLLECTION } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { functions } from '@/lib/firebase'; // Import configured functions instance

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function UsersPage() {
  const { toast } = useToast();
  const { teamId, teamUser: currentUser, team, memberCount } = useAuth(); // Get team data and member count
  const isAdmin = currentUser?.role === 'admin';
  const router = useRouter();
  const [isCheckoutLoading, setIsCheckoutLoading] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

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

  // Handle Stripe Checkout
  const handleCheckout = async () => {
    if (!teamId || !team) {
       toast({ title: "Error", description: "Team information is not available.", variant: "destructive" });
       return;
    }
    if (!isAdmin) {
       toast({ title: "Permission Denied", description: "Only admins can manage subscriptions.", variant: "destructive" });
       return;
    }

    setIsCheckoutLoading(true);
    setCheckoutError(null);

    try {
      // Ensure the user count is available, falling back to the fetched users length if needed
      const currentMemberCount = memberCount > 0 ? memberCount : users?.length || 1;

      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const result: any = await createCheckoutSession({ teamId: teamId, quantity: currentMemberCount });

      if (result.data && result.data.sessionId) {
        const stripe = await stripePromise;
        if (!stripe) {
            throw new Error("Stripe.js has not loaded yet.");
        }
        const { error } = await stripe.redirectToCheckout({ sessionId: result.data.sessionId });
        if (error) {
          console.error("Stripe redirect error:", error);
          setCheckoutError(error.message || "Failed to redirect to Stripe checkout.");
          toast({ title: "Checkout Error", description: error.message || "Failed to redirect to Stripe checkout.", variant: "destructive" });
        }
      } else {
         throw new Error("Invalid response from createCheckoutSession function.");
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
       const message = error.message || "Failed to initiate checkout. Please try again.";
       setCheckoutError(message);
       toast({ title: "Checkout Error", description: message, variant: "destructive" });
    } finally {
      setIsCheckoutLoading(false);
    }
  };

   // Handle Stripe Portal Link
    const handleManageSubscription = async () => {
        if (!teamId || !team || !team.stripeCustomerId) {
            toast({ title: "Error", description: "Subscription information not found.", variant: "destructive" });
            return;
        }
         if (!isAdmin) {
            toast({ title: "Permission Denied", description: "Only admins can manage subscriptions.", variant: "destructive" });
            return;
        }

        setIsCheckoutLoading(true); // Reuse loading state
        setCheckoutError(null);

        try {
            const createPortalLink = httpsCallable(functions, 'createPortalLink');
            const result: any = await createPortalLink({ customerId: team.stripeCustomerId });

             if (result.data && result.data.url) {
                 window.location.assign(result.data.url);
             } else {
                  throw new Error("Invalid response from createPortalLink function.");
             }

        } catch (error: any) {
             console.error("Error creating portal link:", error);
             const message = error.message || "Failed to open subscription management portal.";
             setCheckoutError(message);
             toast({ title: "Portal Error", description: message, variant: "destructive" });
        } finally {
            setIsCheckoutLoading(false);
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
          <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="capitalize">
            {role === 'admin' && <Crown className="mr-1 h-3 w-3" />}
            {role}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = user.id === currentUser?.id;

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
    return <div className="flex justify-center p-4 text-destructive">Error loading team users: {error.message}</div>;
  }

  // Show a loading state if waiting for team ID or user data
  const isPageLoading = isLoading || !teamId;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User List Card */}
        <div className="md:col-span-2">
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

        {/* Subscription Management Card */}
        <div className="md:col-span-1">
           <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Team Subscription</CardTitle>
               <CardDescription>
                   Manage your team's subscription plan.
               </CardDescription>
            </CardHeader>
             <CardContent>
                 {isPageLoading ? (
                    <Skeleton className="h-20 w-full"/>
                 ) : team ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <span className="text-muted-foreground">Current Plan:</span>
                           <Badge variant={team.planType === 'premium' ? 'default' : 'outline'} className="capitalize text-sm">
                                {team.planType === 'premium' && <CheckCircle className="mr-1 h-4 w-4"/>}
                                {team.planType || 'Free'}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-muted-foreground">Members:</span>
                           <span className="font-semibold">{memberCount}</span>
                        </div>
                         <div className="flex justify-between items-center">
                           <span className="text-muted-foreground">Price:</span>
                           <span className="font-semibold">
                               {team.planType === 'premium' ? `€${(6.99 * memberCount).toFixed(2)} / month` : 'Free'}
                           </span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-muted-foreground">Status:</span>
                           <Badge variant={team.subscriptionStatus === 'active' ? 'default' : team.subscriptionStatus === 'past_due' ? 'destructive' : 'outline'} className="capitalize text-sm">
                                {team.subscriptionStatus || 'N/A'}
                           </Badge>
                        </div>

                       {checkoutError && (
                            <p className="text-sm text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4"/> {checkoutError}</p>
                       )}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Loading team data...</p>
                )}
             </CardContent>
              <CardFooter>
                 {isAdmin && team && (
                    team.planType === 'premium' && team.subscriptionStatus === 'active' && team.stripeCustomerId ? (
                       <Button
                           onClick={handleManageSubscription}
                           disabled={isCheckoutLoading}
                           className="w-full"
                       >
                           {isCheckoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                           Manage Subscription
                       </Button>
                    ) : (
                        <Button
                            onClick={handleCheckout}
                            disabled={isCheckoutLoading || !users || users.length === 0} // Disable if no users
                            className="w-full"
                        >
                            {isCheckoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {team.planType === 'premium' ? 'Retry Payment' : 'Upgrade to Premium'}
                        </Button>
                    )
                )}
                 {!isAdmin && (
                    <p className="text-sm text-muted-foreground text-center w-full">Only admins can manage subscriptions.</p>
                 )}
              </CardFooter>
           </Card>
        </div>
      </div>
    </div>
  );
}

// Expose edit handler
if (typeof window !== 'undefined') {
  (window as any).handleOpenEditDialog = (data: any) => {
    console.log("Trigger edit for:", data);
  };
}

```