// src/app/(app)/activities/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Sparkles, Loader2, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

// Removed MainLayout import
import { CrudPageLayout } from '@/components/crud-page-layout';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityForm } from '@/components/forms/activity-form';
import { useToast } from "@/hooks/use-toast";
import { suggestClientActivities } from '@/ai/flows/suggest-client-activities';
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import { useFirestoreDeleteMutation } from '@/hooks/useFirestoreMutation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Client } from '@/types/crm';
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION, ACTIVITIES_SUBCOLLECTION } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

export default function ActivitiesPage() {
  const { toast } = useToast();
  const { teamId } = useAuth();

  // States for AI suggestions
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [pastInteractions, setPastInteractions] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Query keys and collection paths
  const clientsQueryKey = teamId ? ['teams', teamId, CLIENTS_SUBCOLLECTION] : null;
  const clientsPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${CLIENTS_SUBCOLLECTION}` : '';

  const activitiesQueryKey = teamId ? ['teams', teamId, ACTIVITIES_SUBCOLLECTION] : null;
  const activitiesPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${ACTIVITIES_SUBCOLLECTION}` : '';

  // Fetch clients and activities
  const { data: clients, isLoading: isLoadingClients } = useFirestoreCollection<Client>(
    clientsPath,
    clientsQueryKey || [],
    [],
    { enabled: !!teamId }
  );

  const { data: activities, isLoading: isLoadingActivities } = useFirestoreCollection<Activity>(
    activitiesPath,
    activitiesQueryKey || [],
    [],
    { enabled: !!teamId }
  );

  const deleteMutation = useFirestoreDeleteMutation();

  // Update selectedClient when selectedClientId changes
  useEffect(() => {
    if (clients && selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
    setSuggestions([]); // Clear suggestions when client changes
  }, [selectedClientId, clients]);

  // Handle getting AI suggestions
  const handleGetSuggestions = async () => {
    if (!selectedClientId || !pastInteractions) {
      toast({
        title: "Missing Information",
        description: "Please select a client and provide past interaction details.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedClient) {
      toast({
        title: "Client Data Missing",
        description: "Could not retrieve client details for suggestions.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingSuggestions(true);
    setSuggestions([]); // Clear previous suggestions

    try {
      // Prepare input for AI
      const input = {
        clientName: selectedClient.name,
        clientDescription: selectedClient.description || `A client named ${selectedClient.name}`,
        pastInteractions: pastInteractions,
      };

      const result = await suggestClientActivities(input);

      if (result && result.suggestedActivities && result.suggestedActivities.length > 0) {
        setSuggestions(result.suggestedActivities);
        toast({
          title: "Suggestions Generated",
          description: `Found ${result.suggestedActivities.length} suggestions.`
        });
      } else {
        toast({
          title: "No Suggestions",
          description: "The AI couldn't generate suggestions based on the input.",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error("Error getting AI suggestions:", error);
      toast({
        title: "AI Error",
        description: `Failed to get suggestions: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Define columns for activities table
  const columns: ColumnDef<Activity>[] = [
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue('type')}
        </Badge>
      ),
    },
    {
      accessorKey: 'clientName',
      header: "Client",
      cell: ({ row }) => {
        const activity = row.original;
        const client = clients?.find(c => c.id === activity.clientId);
        return <div>{client?.name || 'Unknown Client'}</div>;
      },
    },
    {
      accessorKey: 'date',
      header: "Date",
      cell: ({ row }) => {
        const activity = row.original;
        return activity.date ? (
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            {format(activity.date.toDate(), 'PP')}
          </div>
        ) : 'N/A';
      },
    },
    {
      accessorKey: 'dueDate',
      header: "Due Date",
      cell: ({ row }) => {
        const activity = row.original;
        return activity.dueDate ? (
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            {format(activity.dueDate.toDate(), 'PP')}
          </div>
        ) : '—';
      },
    },
    {
      accessorKey: 'userName',
      header: "Created By",
      cell: ({ row }) => {
        const activity = row.original;
        return (
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            {activity.userName || 'Unknown'}
          </div>
        );
      },
    },
    {
      accessorKey: 'notes',
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.getValue('notes') as string;
        return notes ? notes.substring(0, 50) + (notes.length > 50 ? '...' : '') : '—';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const activity = row.original;
        const handleDelete = () => {
          if (!teamId) return;

          const confirmed = confirm('Are you sure you want to delete this activity?');
          if (!confirmed) return;

          deleteMutation.mutate({
            collectionPath: activitiesPath,
            docId: activity.id,
            invalidateQueryKeys: [activitiesQueryKey!],
          }, {
            onSuccess: () => {
              toast({ title: "Activity Deleted", description: "The activity has been deleted successfully" });
            },
            onError: (error) => {
              toast({
                title: "Error Deleting Activity",
                description: error.message,
                variant: "destructive"
              });
            },
          });
        };

        return (
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  // Edit activity handler
  const handleEditActivity = (activity: Activity) => {
    const editHandler = (window as any).handleOpenEditDialog;
    if (editHandler) {
      editHandler(activity);
    }
  };

  return (
    // MainLayout removed as it's handled by the layout
    <div className="container mx-auto py-6 grid gap-8 md:grid-cols-3">
      {/* Activities List Section */}
      <div className="md:col-span-2">
        <CrudPageLayout<Activity>
          title="Activities"
          formComponent={(props) => <ActivityForm {...props} clients={clients || []} />}
          addButtonText="Log New Activity"
        >
          {isLoadingActivities || !teamId ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full rounded-md border" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : activities && activities.length > 0 ? (
            <DataTable
              columns={columns}
              data={activities}
              filterInputPlaceholder="Filter activities..."
              filterColumnId="notes"
              onRowClick={handleEditActivity}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No activities logged yet. Use the "Log New Activity" button to get started.</p>
              </CardContent>
            </Card>
          )}
        </CrudPageLayout>
      </div>

      {/* AI Suggestions Section */}
      <div className="md:col-span-1">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Activity Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client-select">Select Client</Label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                disabled={isLoadingSuggestions || isLoadingClients}
              >
                <SelectTrigger id="client-select">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Removed the SelectItem with value="" */}
                  {clients?.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="past-interactions">Past Interaction Summary</Label>
              <Textarea
                id="past-interactions"
                placeholder="Summarize recent calls, emails, meetings, key discussion points, client sentiment, etc."
                value={pastInteractions}
                onChange={(e) => setPastInteractions(e.target.value)}
                rows={5}
                className="mt-1"
                disabled={isLoadingSuggestions || !selectedClientId}
              />
            </div>

            <Button
              onClick={handleGetSuggestions}
              disabled={isLoadingSuggestions || !selectedClientId || !pastInteractions}
              className="w-full"
            >
              {isLoadingSuggestions ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Get Suggestions
            </Button>

            {/* Display Suggestions */}
            {isLoadingSuggestions && (
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}

            {!isLoadingSuggestions && suggestions.length > 0 && (
              <div className="mt-4 space-y-2 rounded-md border p-4 bg-secondary/50">
                <h4 className="font-semibold text-sm mb-2">Suggested Activities:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {!isLoadingSuggestions && suggestions.length === 0 &&
              pastInteractions && selectedClientId && !isLoadingSuggestions && ( // Added check for isLoadingSuggestions to avoid flash
              <p className="text-sm text-muted-foreground mt-4 text-center">
                No suggestions generated yet. Click "Get Suggestions" to generate some.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
