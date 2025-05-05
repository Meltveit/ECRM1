// src/components/sales-pipeline.tsx
"use client";

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import { useFirestoreUpdateMutation } from '@/hooks/useFirestoreMutation';
import { Client } from '@/types/crm';
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

// Define the pipeline stages
const PIPELINE_STAGES = [
  { id: 'lead', name: 'Lead', color: 'bg-blue-500', textColor: 'text-white' },
  { id: 'contact', name: 'In Contact', color: 'bg-orange-500', textColor: 'text-white' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-gray-500', textColor: 'text-white' },
  { id: 'closed', name: 'Closed', color: 'bg-green-500', textColor: 'text-white' }
];

export function SalesPipeline() {
  const { teamId } = useAuth();
  const [pipelineData, setPipelineData] = useState<{[key: string]: Client[]}>({
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
      const newPipelineData: {[key: string]: Client[]} = {
        lead: [],
        contact: [],
        negotiation: [],
        closed: []
      };
      
      clients.forEach(client => {
        const stage = client.pipelineStage || 'lead';
        if (newPipelineData[stage]) {
          newPipelineData[stage].push(client);
        } else {
          newPipelineData.lead.push(client);
        }
      });
      
      setPipelineData(newPipelineData);
    }
  }, [clients]);
  
  // Handle drag and drop between stages
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    
    // If there's no destination or it's the same as source, do nothing
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Find the client that was dragged
    const client = pipelineData[source.droppableId].find(c => c.id === draggableId);
    if (!client) return;
    
    // Create a new state object
    const newPipelineData = { ...pipelineData };
    
    // Remove from source
    newPipelineData[source.droppableId] = newPipelineData[source.droppableId]
      .filter(c => c.id !== draggableId);
    
    // Add to destination
    newPipelineData[destination.droppableId] = [
      ...newPipelineData[destination.droppableId].slice(0, destination.index),
      { ...client, pipelineStage: destination.droppableId },
      ...newPipelineData[destination.droppableId].slice(destination.index)
    ];
    
    setPipelineData(newPipelineData);
    
    // Update in Firestore
    if (teamId) {
      updateMutation.mutate({
        collectionPath,
        docId: client.id,
        data: { pipelineStage: destination.droppableId },
        invalidateQueryKeys: [clientsQueryKey!]
      });
    }
  };
  
  if (isLoading) {
    return <div>Loading pipeline...</div>;
  }
  
  return (
    <div className="w-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PIPELINE_STAGES.map(stage => (
            <div key={stage.id} className="flex flex-col h-full">
              <div className={`${stage.color} ${stage.textColor} px-4 py-2 rounded-t-md font-medium flex justify-between items-center`}>
                <span>{stage.name}</span>
                <Badge variant="secondary" className="bg-white/20">
                  {pipelineData[stage.id]?.length || 0}
                </Badge>
              </div>
              
              <Droppable droppableId={stage.id}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-50 rounded-b-md flex-grow min-h-[400px] p-2"
                  >
                    {pipelineData[stage.id]?.map((client, index) => (
                      <Draggable key={client.id} draggableId={client.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-2"
                          >
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                              <CardContent className="p-3">
                                <div className="font-medium">{client.name}</div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {client.email || 'No email'}
                                </div>
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