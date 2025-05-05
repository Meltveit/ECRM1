// src/components/sales-pipeline.tsx
"use client";

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import { useFirestoreUpdateMutation } from '@/hooks/useFirestoreMutation';
import { Client } from '@/types/crm';
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Define the pipeline stages
const PIPELINE_STAGES = [
  { id: 'lead', name: 'Lead', color: 'bg-blue-500', textColor: 'text-white' },
  { id: 'contact', name: 'In Contact', color: 'bg-orange-500', textColor: 'text-white' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-gray-500', textColor: 'text-white' },
  { id: 'closed', name: 'Closed', color: 'bg-green-500', textColor: 'text-white' }
];

export function SalesPipeline() {
  const { teamId } = useAuth();
  const [pipelineData, setPipelineData] = useState<{ [key: string]: Client[] }>({
    lead: [],
    contact: [],
    negotiation: [],
    closed: []
  });

  // Fetch clients
  const clientsQueryKey = teamId ? ['teams', teamId, CLIENTS_SUBCOLLECTION] : null;
  const collectionPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${CLIENTS_SUBCOLLECTION}` : '';

  const { data: clients, isLoading } = useFirestoreCollection<Client>(
    collectionPath,
    clientsQueryKey || [],
    [],
    { enabled: !!teamId }
  );

  const updateMutation = useFirestoreUpdateMutation<Client>();

  // Process clients into pipeline stages
  React.useEffect(() => {
    if (clients) {
      const newPipelineData: { [key: string]: Client[] } = PIPELINE_STAGES.reduce((acc, stage) => {
        acc[stage.id] = [];
        return acc;
      }, {} as { [key: string]: Client[] });


      clients.forEach(client => {
        const stage = client.pipelineStage && newPipelineData.hasOwnProperty(client.pipelineStage)
                      ? client.pipelineStage
                      : 'lead'; // Default to lead if stage is missing or invalid
         // Sort clients within each stage if needed, e.g., by name
         // newPipelineData[stage].sort((a, b) => a.name.localeCompare(b.name));
         newPipelineData[stage].push(client);
      });


      // Sort each stage by name (or other criteria if needed)
      Object.keys(newPipelineData).forEach(stageId => {
        newPipelineData[stageId].sort((a, b) => a.name.localeCompare(b.name));
      });


      setPipelineData(newPipelineData);
    }
  }, [clients]);

  // Handle drag and drop between stages
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or it's the same as source, do nothing
    if (!destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)) {
      return;
    }

    // Find the client that was dragged
    const sourceStage = pipelineData[source.droppableId];
    const destinationStage = pipelineData[destination.droppableId];
    const client = sourceStage?.find(c => c.id === draggableId);

    if (!client || !sourceStage || !destinationStage) {
        console.error("Client or stage data not found");
        return;
    }


    // Create a new state object based on the current state
    const newPipelineData = { ...pipelineData };


    // Remove from source stage
    newPipelineData[source.droppableId] = sourceStage.filter(c => c.id !== draggableId);


    // Prepare the client object for the new stage
    const updatedClient = { ...client, pipelineStage: destination.droppableId };


    // Add to destination stage at the correct index
    const destinationItems = Array.from(destinationStage);
    destinationItems.splice(destination.index, 0, updatedClient);
    newPipelineData[destination.droppableId] = destinationItems;


    // Update local state optimistically
    setPipelineData(newPipelineData);


    // Update in Firestore
    if (teamId && clientsQueryKey) {
      updateMutation.mutate({
        collectionPath,
        docId: client.id,
        data: { pipelineStage: destination.droppableId },
        invalidateQueryKeys: [clientsQueryKey] // Invalidate the main clients query
      }, {
        onError: (error) => {
          console.error("Failed to update client stage:", error);
          // Revert state if update fails
          setPipelineData(pipelineData); // Revert to the previous state
          // Optionally: Show an error toast to the user
        }
      });
    }
  };

  // Loading Skeleton
  if (isLoading || !teamId) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PIPELINE_STAGES.map(stage => (
            <div key={stage.id} className="flex flex-col h-full">
              <div className={`${stage.color} ${stage.textColor} px-4 py-2 rounded-t-md font-medium flex justify-between items-center`}>
                <span>{stage.name}</span>
                <Skeleton className="h-5 w-8 rounded-full bg-white/30" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-b-md flex-grow min-h-[400px] p-2 space-y-2">
                <Skeleton className="h-16 w-full rounded-md bg-card" />
                <Skeleton className="h-16 w-full rounded-md bg-card" />
                <Skeleton className="h-16 w-full rounded-md bg-card" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start"> {/* Use items-start */}
          {PIPELINE_STAGES.map(stage => (
            <div key={stage.id} className="flex flex-col h-full"> {/* Ensure columns take full height */}
              {/* Stage Header */}
              <div className={`${stage.color} ${stage.textColor} px-4 py-2 rounded-t-md font-medium flex justify-between items-center sticky top-0 z-10`}>
                <span>{stage.name}</span>
                <Badge variant="secondary" className="bg-white/20">
                  {pipelineData[stage.id]?.length || 0}
                </Badge>
              </div>

              {/* Droppable Area */}
              <Droppable
                  droppableId={stage.id}
                  isDropDisabled={false}
                  isCombineEnabled={false}
                  ignoreContainerClipping={false} // Added missing prop
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-gray-100 dark:bg-gray-800 rounded-b-md flex-grow min-h-[400px] p-2 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                  >
                    {pipelineData[stage.id]?.map((client, index) => (
                      <Draggable key={client.id} draggableId={client.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-2 ${snapshot.isDragging ? 'opacity-80 shadow-lg' : ''}`}
                            style={{
                                ...provided.draggableProps.style // Important for positioning during drag
                            }}
                          >
                            <Card className="shadow-sm hover:shadow-md transition-shadow bg-card">
                              <CardContent className="p-3">
                                <div className="font-medium text-card-foreground">{client.name}</div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {client.email || 'No email'}
                                </div>
                                {/* You can add more client details here if needed */}
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
    </div>
  );
}