
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
import { googleCloudNlpTool } from '@/ai/tools/google-cloud-nlp-tool'; // Import the new tool

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

const NlpAnalysisSchema = z.object({
  sentiment: z.string().optional().describe('Overall sentiment of the query (Positive, Negative, Neutral, Mixed).'),
  prominentEntities: z.array(z.object({ name: z.string(), type: z.string() })).optional().describe('Prominent entities extracted from the query.'),
}).optional();

const RespondToAiQueryOutputSchema = z.object({
  response: z.string().describe('The response to the AI query.'),
  suggestedResources: z.array(SuggestedResourceSchema).optional().describe('A list of suggested resources for further learning.'),
  nlpAnalysis: NlpAnalysisSchema.describe('Optional NLP analysis results of the user query if performed.'),
  // canHaveQuiz is handled on the client-side and not part of the AI model's direct output schema
});
export type RespondToAiQueryOutput = z.infer<typeof RespondToAiQueryOutputSchema>;

export async function respondToAiQuery(input: RespondToAiQueryInput): Promise<RespondToAiQueryOutput> {
  return respondToAiQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'respondToAiQueryPrompt',
  input: {schema: RespondToAiQueryInputSchema},
  output: {schema: RespondToAiQueryOutputSchema}, // Only define what the LLM should output
  tools: [findRelevantResourcesTool, googleCloudNlpTool], // Add the new tool
  prompt: `You are Christian, a helpful AI chatbot for the Sanderson AI Learning app. Your goal is to answer questions about AI and machine learning in a clear, educational, and engaging manner.
  Your knowledge base includes:
  - Core AI/ML concepts (supervised/unsupervised learning, reinforcement learning, etc.)
  - Neural Networks (architectures, training, applications)
  - Generative AI (GANs, VAEs, Transformers, LLMs, diffusion models) and popular frameworks.
  - AI Ethics (bias, fairness, transparency, accountability, societal impact).
  - Explainable AI (XAI) techniques and importance.

  Analyze the user's query. Provide a comprehensive answer to the query.

  If the user's query is substantial and text-based (not primarily an image query), you MAY use the 'googleCloudNlpTool' to perform a deeper analysis of the query's sentiment and prominent entities.
  Only use the 'googleCloudNlpTool' if you believe its output (sentiment, entities) will add significant value to your response or understanding, for example, by tailoring the tone of your answer or highlighting key concepts in the user's question.
  If you use the 'googleCloudNlpTool', include its results in the 'nlpAnalysis' field of your output. Otherwise, omit this field.

  Then, identify the primary AI/ML topic within the user's query.
  If a clear topic is identified and the 'findRelevantResourcesTool' can provide relevant external resources for that topic, use the tool by providing the identified topic as input.
  Only use the 'findRelevantResourcesTool' if you are confident it will provide valuable, distinct "Learn More" suggestions beyond your own answer.
  Include any resources returned by the 'findRelevantResourcesTool' in the 'suggestedResources' field of your output. If the tool returns no resources, or if you decide not to use the tool for a particular query, omit the 'suggestedResources' field or return an empty array.

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
    // The 'canHaveQuiz' property is a client-side concern, not part of the LLM output.
    // It will be added in the client-side logic when processing this response.
    return output!;
  }
);

