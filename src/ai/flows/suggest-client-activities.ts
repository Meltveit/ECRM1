// src/ai/flows/suggest-client-activities.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting client activities using AI.
 *
 * The flow takes client information as input and returns a list of suggested activities to improve engagement.
 *
 * @exports suggestClientActivities - A function to trigger the client activity suggestion flow.
 * @exports SuggestClientActivitiesInput - The input type for the suggestClientActivities function.
 * @exports SuggestClientActivitiesOutput - The output type for the suggestClientActivities function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestClientActivitiesInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  clientDescription: z.string().describe('A description of the client and their needs.'),
  pastInteractions: z.string().describe('A summary of past interactions with the client.'),
});

export type SuggestClientActivitiesInput = z.infer<typeof SuggestClientActivitiesInputSchema>;

const SuggestClientActivitiesOutputSchema = z.object({
  suggestedActivities: z.array(
    z.string().describe('A suggested activity to improve client engagement.')
  ).describe('A list of suggested activities for the client.'),
});

export type SuggestClientActivitiesOutput = z.infer<typeof SuggestClientActivitiesOutputSchema>;

export async function suggestClientActivities(input: SuggestClientActivitiesInput): Promise<SuggestClientActivitiesOutput> {
  return suggestClientActivitiesFlow(input);
}

const suggestClientActivitiesPrompt = ai.definePrompt({
  name: 'suggestClientActivitiesPrompt',
  input: {
    schema: z.object({
      clientName: z.string().describe('The name of the client.'),
      clientDescription: z.string().describe('A description of the client and their needs.'),
      pastInteractions: z.string().describe('A summary of past interactions with the client.'),
    }),
  },
  output: {
    schema: z.object({
      suggestedActivities: z.array(
        z.string().describe('A suggested activity to improve client engagement.')
      ).describe('A list of suggested activities for the client.'),
    }),
  },
  prompt: `You are an AI assistant helping to suggest activities for clients to improve engagement.

  Based on the following client information and past interactions, suggest a list of activities that would be beneficial for the client.

  Client Name: {{{clientName}}}
  Client Description: {{{clientDescription}}}
  Past Interactions: {{{pastInteractions}}}

  Suggested Activities:
  `,
});

const suggestClientActivitiesFlow = ai.defineFlow<
  typeof SuggestClientActivitiesInputSchema,
  typeof SuggestClientActivitiesOutputSchema
>({
  name: 'suggestClientActivitiesFlow',
  inputSchema: SuggestClientActivitiesInputSchema,
  outputSchema: SuggestClientActivitiesOutputSchema,
}, async input => {
  const {output} = await suggestClientActivitiesPrompt(input);
  return output!;
});
