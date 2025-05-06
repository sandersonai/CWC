// src/ai/flows/analyze-image-and-respond.ts
'use server';

/**
 * @fileOverview Flow for analyzing an image and responding to user questions about it.
 *
 * - analyzeImageAndRespond - A function that takes an image and a question, analyzes the image, and provides an AI-related response.
 * - AnalyzeImageAndRespondInput - The input type for the analyzeImageAndRespond function.
 * - AnalyzeImageAndRespondOutput - The return type for the analyzeImageAndRespond function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageAndRespondInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question about the image.'),
});
export type AnalyzeImageAndRespondInput = z.infer<typeof AnalyzeImageAndRespondInputSchema>;

const AnalyzeImageAndRespondOutputSchema = z.object({
  answer: z.string().describe('The AI-related answer to the question about the image.'),
});
export type AnalyzeImageAndRespondOutput = z.infer<typeof AnalyzeImageAndRespondOutputSchema>;

export async function analyzeImageAndRespond(input: AnalyzeImageAndRespondInput): Promise<AnalyzeImageAndRespondOutput> {
  return analyzeImageAndRespondFlow(input);
}

const analyzeImageAndRespondPrompt = ai.definePrompt({
  name: 'analyzeImageAndRespondPrompt',
  input: {schema: AnalyzeImageAndRespondInputSchema},
  output: {schema: AnalyzeImageAndRespondOutputSchema},
  prompt: `You are Christian, an AI chatbot specializing in AI and machine learning education.

  A user has uploaded an image and asked a question about it. Analyze the image and answer the question with relevant AI insights, explanations, and suggestions based on the image content and the user's question.

  Image: {{media url=imageDataUri}}
  Question: {{{question}}}`,
});

const analyzeImageAndRespondFlow = ai.defineFlow(
  {
    name: 'analyzeImageAndRespondFlow',
    inputSchema: AnalyzeImageAndRespondInputSchema,
    outputSchema: AnalyzeImageAndRespondOutputSchema,
  },
  async input => {
    const {output} = await analyzeImageAndRespondPrompt(input);
    return output!;
  }
);
