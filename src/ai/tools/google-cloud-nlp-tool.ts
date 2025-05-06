
'use server';
/**
 * @fileOverview A Genkit tool to analyze text for sentiment and entities, simulating Google Cloud NLP.
 *
 * - googleCloudNlpTool - The Genkit tool definition.
 * - GoogleCloudNlpInput - The input type for the tool.
 * - GoogleCloudNlpOutput - The output type for the tool.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GoogleCloudNlpInputSchema = z.object({
  text: z.string().describe('The text to be analyzed.'),
});
export type GoogleCloudNlpInput = z.infer<typeof GoogleCloudNlpInputSchema>;

const GoogleCloudNlpOutputSchema = z.object({
  sentiment: z.enum(['Positive', 'Negative', 'Neutral', 'Mixed']).describe('The overall sentiment of the text.'),
  prominentEntities: z.array(z.object({ name: z.string(), type: z.string() })).describe('A list of prominent entities found in the text, with their types (e.g., PERSON, LOCATION, ORGANIZATION, EVENT, WORK_OF_ART, CONSUMER_GOOD, OTHER).'),
});
export type GoogleCloudNlpOutput = z.infer<typeof GoogleCloudNlpOutputSchema>;

// Internal prompt for the tool
const nlpPrompt = ai.definePrompt({
  name: 'googleCloudNlpToolPrompt',
  input: { schema: GoogleCloudNlpInputSchema },
  output: { schema: GoogleCloudNlpOutputSchema },
  prompt: `You are an AI assistant simulating the functionality of Google Cloud Natural Language API.
  Analyze the following text for its overall sentiment (Positive, Negative, Neutral, or Mixed) and extract up to 5 prominent entities with their types (PERSON, LOCATION, ORGANIZATION, EVENT, WORK_OF_ART, CONSUMER_GOOD, OTHER, UNKNOWN).

  Text to analyze:
  {{{text}}}

  Provide the output in the specified JSON format. If sentiment is unclear, default to Neutral. If no specific entities are found, return an empty array for prominentEntities.`,
});

export const googleCloudNlpTool = ai.defineTool(
  {
    name: 'googleCloudNlpTool',
    description: 'Analyzes text using simulated Google Cloud Natural Language capabilities to determine sentiment and extract key entities. Powered by advanced Google AI models like Gemini.',
    inputSchema: GoogleCloudNlpInputSchema,
    outputSchema: GoogleCloudNlpOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await nlpPrompt(input);
      if (!output) {
        throw new Error('NLP analysis failed to produce an output.');
      }
      // Ensure the output structure matches, especially for prominentEntities
      return {
        sentiment: output.sentiment || 'Neutral', // Default sentiment if missing
        prominentEntities: output.prominentEntities || [], // Default to empty array
      };
    } catch (error) {
      console.error('Error in googleCloudNlpTool:', error);
      // Provide a fallback error response that matches the schema
      return {
        sentiment: 'Neutral',
        prominentEntities: [{ name: "Error during analysis", type: "UNKNOWN" }],
      };
    }
  }
);

// Export an async wrapper for completeness, though tools are typically used directly by flows/prompts
export async function analyzeTextWithGoogleCloudNlp(input: GoogleCloudNlpInput): Promise<GoogleCloudNlpOutput> {
  return googleCloudNlpTool(input);
}
