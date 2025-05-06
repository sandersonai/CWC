'use server';
/**
 * @fileOverview Responds to AI and machine learning queries from the user.
 *
 * - respondToAiQuery - A function that handles the AI query and returns a response.
 * - RespondToAiQueryInput - The input type for the respondToAiQuery function.
 * - RespondToAiQueryOutput - The return type for the respondToAiQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { findRelevantResourcesTool } from '@/ai/tools/find-relevant-resources-tool';

const RespondToAiQueryInputSchema = z.object({
  query: z.string().describe('The AI or machine learning query from the user.'),
  imageUri: z
    .string()
    .optional()
    .describe(
      "An optional image uploaded by the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RespondToAiQueryInput = z.infer<typeof RespondToAiQueryInputSchema>;

const SuggestedResourceSchema = z.object({
  title: z.string().describe('The title of the suggested resource.'),
  url: z.string().url().describe('The URL of the suggested resource.'),
});

const RespondToAiQueryOutputSchema = z.object({
  response: z.string().describe('The response to the AI query.'),
  suggestedResources: z.array(SuggestedResourceSchema).optional().describe('A list of suggested resources for further learning.'),
});
export type RespondToAiQueryOutput = z.infer<typeof RespondToAiQueryOutputSchema>;

export async function respondToAiQuery(input: RespondToAiQueryInput): Promise<RespondToAiQueryOutput> {
  return respondToAiQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'respondToAiQueryPrompt',
  input: {schema: RespondToAiQueryInputSchema},
  output: {schema: RespondToAiQueryOutputSchema},
  tools: [findRelevantResourcesTool],
  prompt: `You are Christian, a helpful AI chatbot for the Sanderson AI Learning app. Your goal is to answer questions about AI and machine learning in a clear, educational, and engaging manner.
  Your knowledge base includes:
  - Core AI/ML concepts (supervised/unsupervised learning, reinforcement learning, etc.)
  - Neural Networks (architectures, training, applications)
  - Generative AI (GANs, VAEs, Transformers, LLMs, diffusion models) and popular frameworks.
  - AI Ethics (bias, fairness, transparency, accountability, societal impact).
  - Explainable AI (XAI) techniques and importance.

  Analyze the user's query. Provide a comprehensive answer to the query.
  Then, identify the primary AI/ML topic within the user's query.
  If a clear topic is identified and the 'findRelevantResourcesTool' can provide relevant external resources for that topic, use the tool by providing the identified topic as input.
  Only use the tool if you are confident it will provide valuable, distinct "Learn More" suggestions beyond your own answer.
  Include any resources returned by the tool in the 'suggestedResources' field of your output. If the tool returns no resources, or if you decide not to use the tool for a particular query, omit the 'suggestedResources' field or return an empty array.

  Use the following information to formulate your response:
  Query: {{{query}}}

  {{#if imageUri}}
  Image: {{media url=imageUri}}
  {{/if}}
`,
});

const respondToAiQueryFlow = ai.defineFlow(
  {
    name: 'respondToAiQueryFlow',
    inputSchema: RespondToAiQueryInputSchema,
    outputSchema: RespondToAiQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
