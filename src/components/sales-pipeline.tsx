// src/components/sales-pipeline.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DragStart } from 'react-beautiful-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import { useFirestoreUpdateMutation } from '@/hooks/useFirestoreMutation';
import { Client, PipelineStage } from '@/types/crm'; // Import PipelineStage type
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient

// Define the expanded pipeline stages with colors
const PIPELINE_STAGES: { id: PipelineStage; name: string; color: string; textColor: string }[] = [
  { id: 'lead', name: 'Lead', color: 'bg-gray-500', textColor: 'text-white' },
  { id: 'contact', name: 'Contact Made', color: 'bg-blue-500', textColor: 'text-white' },
  { id: 'proposal', name: 'Proposal Sent', color: 'bg-purple-500', textColor: 'text-white' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-500', textColor: 'text-white' },
  { id: 'closed-won', name: 'Closed Won', color: 'bg-green-600', textColor: 'text-white' },
  { id: 'closed-lost', name: 'Closed Lost', color: 'bg-red-600', textColor: 'text-white' }
];

export function SalesPipeline() {
  const { teamId, user, teamUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Add QueryClient
  
  const [pipelineData, setPipelineData] = useState<{ [key in PipelineStage]: Client[] }>({
    lead: [], contact: [], proposal: [], negotiation: [], 'closed-won': [], 'closed-lost': []
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [clientToUpdate, setClientToUpdate] = useState<Client | null>(null);
  const [dealValue, setDealValue] = useState<number | string>('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const clientsQueryKey = teamId ? ['teams', teamId, CLIENTS_SUBCOLLECTION] : null;
  const collectionPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${CLIENTS_SUBCOLLECTION}` : '';

  const { data: clients, isLoading } = useFirestoreCollection<Client>(
    collectionPath,
    clientsQueryKey || [],
    [],
    { enabled: !!teamId }
  );

  const updateMutation = useFirestoreUpdateMutation<Client>();

  useEffect(() => {
    if (isLoading || isDragging || !clients) return;

    const newPipelineData = PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage.id] = [];
      return acc;
    }, {} as { [key in PipelineStage]: Client[] });

    clients.forEach(client => {
      const stage = client.pipelineStage && newPipelineData.hasOwnProperty(client.pipelineStage)
                    ? client.pipelineStage
                    : 'lead';
      newPipelineData[stage].push(client);
    });

    Object.keys(newPipelineData).forEach((stageId) => {
       if (newPipelineData[stageId as PipelineStage]) { // Check if stage exists
          newPipelineData[stageId as PipelineStage].sort((a, b) => a.name.localeCompare(b.name));
       }
    });

    setPipelineData(newPipelineData);
  }, [clients, isLoading, isDragging]);

  const handleDragStart = (start: DragStart) => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const sourceStageId = source.droppableId as PipelineStage;
    const destinationStageId = destination.droppableId as PipelineStage;
    const sourceStage = pipelineData[sourceStageId];
    const client = sourceStage?.find(c => c.id === draggableId);

    if (!client) return;

    // --- Optimistic Update ---
    const newPipelineData = { ...pipelineData };
    // Remove from source
    newPipelineData[sourceStageId] = sourceStage.filter(c => c.id !== draggableId);
    // Prepare client for destination
    const movedClient = { ...client, pipelineStage: destinationStageId };
    // Add to destination
    const destinationItems = Array.from(pipelineData[destinationStageId] || []);
    destinationItems.splice(destination.index, 0, movedClient);
    newPipelineData[destinationStageId] = destinationItems;
    setPipelineData(newPipelineData); // Update UI immediately
    // --- End Optimistic Update ---


    // Prepare data for Firestore update
    const updateData: Partial<Client> = { pipelineStage: destinationStageId };

    if ((destinationStageId === 'closed-won' || destinationStageId === 'closed-lost') && !client.closedAt) {
        // Open dialog for 'closed-won', directly update for 'closed-lost'
        if (destinationStageId === 'closed-won') {
            setClientToUpdate({ ...client, pipelineStage: destinationStageId }); // Store client temporarily
            setDealValue(client.value || ''); // Pre-fill value if exists
            setIsConfirmDialogOpen(true);
            // Firestore update will happen after dialog confirmation
            return; // Don't proceed with immediate Firestore update yet
        } else {
             // Directly update for 'closed-lost'
             // FIX: Cast serverTimestamp() to unknown and then to Timestamp
             updateData.closedAt = serverTimestamp() as unknown as Timestamp;
             updateData.assignedUserId = user?.uid || undefined;
             // FIX: Use empty string instead of null for assignedUserName
             updateData.assignedUserName = `${teamUser?.firstName || ''} ${teamUser?.lastName || ''}`.trim() || user?.email || '';
        }
    } else if (destinationStageId === 'proposal' && !client.proposalSentAt) {
        // FIX: Cast serverTimestamp() to unknown and then to Timestamp
        updateData.proposalSentAt = serverTimestamp() as unknown as Timestamp;
    }

    // Update Firestore (if not 'closed-won' requiring confirmation)
    if (teamId && clientsQueryKey && destinationStageId !== 'closed-won') {
      updateMutation.mutate({
        collectionPath,
        docId: client.id,
        data: updateData,
        invalidateQueryKeys: [clientsQueryKey]
      }, {
        onError: (error) => {
          console.error("Failed to update client stage:", error);
          toast({ title: "Update Failed", description: "Could not update client stage.", variant: "destructive" });
          setPipelineData(pipelineData); // Revert optimistic update on error
        }
      });
    }
  };

  // Handle confirmation of deal value for 'closed-won'
  const handleConfirmCloseWon = () => {
    if (!clientToUpdate || !teamId || !clientsQueryKey) return;

    const numericValue = parseFloat(String(dealValue));
    if (isNaN(numericValue) || numericValue < 0) {
        toast({ title: "Invalid Value", description: "Please enter a valid positive deal value.", variant: "destructive" });
        return;
    }

    const updateData: Partial<Client> = {
        pipelineStage: 'closed-won',
        value: numericValue,
        // FIX: Cast serverTimestamp() to unknown and then to Timestamp
        closedAt: serverTimestamp() as unknown as Timestamp,
        assignedUserId: user?.uid || undefined,
        // FIX: Use empty string instead of null for assignedUserName
        assignedUserName: `${teamUser?.firstName || ''} ${teamUser?.lastName || ''}`.trim() || user?.email || '',
    };

    updateMutation.mutate({
        collectionPath,
        docId: clientToUpdate.id,
        data: updateData,
        invalidateQueryKeys: [clientsQueryKey]
    }, {
        onSuccess: () => {
            toast({ title: "Deal Won!", description: `Client ${clientToUpdate.name} marked as closed-won.` });
            setIsConfirmDialogOpen(false);
            setClientToUpdate(null);
            setDealValue('');
            // Optimistic update already happened, just close dialog
        },
        onError: (error) => {
            console.error("Failed to update client stage to closed-won:", error);
            toast({ title: "Update Failed", description: "Could not mark client as closed-won.", variant: "destructive" });
            // Revert optimistic update on error - this is tricky, might need full data refetch
            if (clientsQueryKey) {
              queryClient.invalidateQueries({ queryKey: clientsQueryKey }); // Force refetch
            }
            setIsConfirmDialogOpen(false);
            setClientToUpdate(null);
            setDealValue('');
        }
    });
  };

  if (isLoading || !teamId || !isClient) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"> {/* Adjusted columns */}
          {PIPELINE_STAGES.map(stage => (
            <div key={stage.id} className="flex flex-col h-full">
              <div className={`${stage.color} ${stage.textColor} px-4 py-2 rounded-t-md font-medium flex justify-between items-center`}>
                <span>{stage.name}</span>
                <Skeleton className="h-5 w-8 rounded-full bg-white/30" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-b-md flex-grow min-h-[400px] p-2 space-y-2">
                <Skeleton className="h-20 w-full rounded-md bg-card" />
                <Skeleton className="h-20 w-full rounded-md bg-card" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start"> {/* Adjusted columns */}
          {PIPELINE_STAGES.map(stage => (
            <div key={stage.id} className="flex flex-col h-full">
              <div className={`${stage.color} ${stage.textColor} px-4 py-2 rounded-t-md font-medium flex justify-between items-center sticky top-14 z-10`}> {/* Adjusted top for header */}
                <span>{stage.name}</span>
                <Badge variant="secondary" className="bg-white/20">
                  {pipelineData[stage.id]?.length || 0}
                </Badge>
              </div>
              <Droppable
                droppableId={stage.id}
                isDropDisabled={false}
                isCombineEnabled={false}
                ignoreContainerClipping={false}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-gray-100 dark:bg-gray-800 rounded-b-md flex-grow min-h-[400px] p-2 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                  >
                    {(pipelineData[stage.id] || []).map((client, index) => (
                      <Draggable key={client.id} draggableId={client.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-2 ${snapshot.isDragging ? 'opacity-80 shadow-lg' : ''}`}
                            style={provided.draggableProps.style}
                          >
                            <Card className="shadow-sm hover:shadow-md transition-shadow bg-card">
                              <CardContent className="p-3 space-y-1">
                                <div className="font-medium text-card-foreground">{client.name}</div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {client.email || 'No email'}
                                </div>
                                {client.value && stage.id !== 'closed-lost' && ( // Show value unless lost
                                    <div className="text-xs text-green-600 font-semibold">
                                        Value: €{client.value.toLocaleString()}
                                    </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

        {/* Confirmation Dialog for Closed Won */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Confirm Deal Won</DialogTitle>
                <DialogDescription>
                    Please enter the final deal value for client: <strong>{clientToUpdate?.name}</strong>.
                </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="deal-value">Deal Value (€)</Label>
                    <Input
                        id="deal-value"
                        type="number"
                        value={dealValue}
                        onChange={(e) => setDealValue(e.target.value)}
                        placeholder="Enter deal value"
                        min="0"
                        step="0.01"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => {
                        setIsConfirmDialogOpen(false);
                        setClientToUpdate(null);
                         // Revert optimistic update if canceled
                         if (clientsQueryKey) {
                           queryClient.invalidateQueries({ queryKey: clientsQueryKey });
                         }
                        }}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmCloseWon}>Confirm Won</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}