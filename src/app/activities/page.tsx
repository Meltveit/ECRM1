"use client";

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/main-layout';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { suggestClientActivities } from '@/ai/flows/suggest-client-activities'; // Import the AI flow
import type { SuggestClientActivitiesInput, SuggestClientActivitiesOutput } from '@/ai/flows/suggest-client-activities';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data - replace with actual client fetching later
const mockClients = [
  { id: 'client1', name: 'Acme Corp', description: 'Technology company focused on cloud solutions.' },
  { id: 'client2', name: 'Beta Industries', description: 'Manufacturing firm specializing in widgets.' },
  { id: 'client3', name: 'Gamma Services', description: 'Consulting agency for small businesses.' },
];


export default function ActivitiesPage() {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [pastInteractions, setPastInteractions] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>('');
  const [clientDescription, setClientDescription] = useState<string>('');


  // Effect to update client details when selectedClientId changes
   useEffect(() => {
    const client = mockClients.find(c => c.id === selectedClientId);
    if (client) {
        setClientName(client.name);
        setClientDescription(client.description);
    } else {
        setClientName('');
        setClientDescription('');
    }
    setSuggestions([]); // Clear suggestions when client changes
   }, [selectedClientId]);


  const handleGetSuggestions = async () => {
    if (!selectedClientId || !pastInteractions) {
      toast({ title: "Missing Information", description: "Please select a client and provide past interaction details.", variant: "destructive" });
      return;
    }
     if (!clientName || !clientDescription) {
       toast({ title: "Client Data Missing", description: "Could not retrieve client details for suggestions.", variant: "destructive" });
       return;
     }


    setIsLoadingSuggestions(true);
    setSuggestions([]); // Clear previous suggestions

    const input: SuggestClientActivitiesInput = {
      clientName: clientName,
      clientDescription: clientDescription,
      pastInteractions: pastInteractions,
    };

    try {
      const result: SuggestClientActivitiesOutput = await suggestClientActivities(input);
      if (result && result.suggestedActivities) {
        setSuggestions(result.suggestedActivities);
         toast({ title: "Suggestions Generated", description: `Found ${result.suggestedActivities.length} suggestions.` });
      } else {
         toast({ title: "No Suggestions", description: "The AI couldn't generate suggestions based on the input.", variant: "default" });
      }
    } catch (error: any) {
      console.error("Error getting AI suggestions:", error);
      toast({ title: "AI Error", description: `Failed to get suggestions: ${error.message}`, variant: "destructive" });
      setSuggestions([]); // Ensure suggestions are cleared on error
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 grid gap-8 md:grid-cols-3">

        {/* Activities Log Section (Placeholder) */}
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-6">Activities</h1>
           <Card>
             <CardHeader>
                 <CardTitle>Log & View Activities</CardTitle>
             </CardHeader>
             <CardContent>
                 <p className="text-muted-foreground">Activity logging and viewing functionality will be implemented here.</p>
                 {/* Placeholder for DataTable and Add/Edit Activity functionality */}
             </CardContent>
         </Card>
        </div>

         {/* AI Suggestions Section */}
        <div className="md:col-span-1">
           <Card className="sticky top-20"> {/* Make suggestion card sticky */}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Activity Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client-select">Select Client</Label>
                 {/* Replace with ShadCN Select when client data is available */}
                 <select
                     id="client-select"
                     value={selectedClientId}
                     onChange={(e) => setSelectedClientId(e.target.value)}
                     className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 mt-1"
                     disabled={isLoadingSuggestions}
                 >
                     <option value="" disabled>Select a client...</option>
                     {mockClients.map(client => (
                         <option key={client.id} value={client.id}>{client.name}</option>
                     ))}
                 </select>
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
               {!isLoadingSuggestions && suggestions.length === 0 && pastInteractions && selectedClientId && !isLoadingSuggestions && (
                    <p className="text-sm text-muted-foreground mt-4 text-center">No suggestions generated based on the input.</p>
               )}

            </CardContent>
          </Card>
        </div>

      </div>
    </MainLayout>
  );
}
