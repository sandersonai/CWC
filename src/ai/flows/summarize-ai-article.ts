'use server';

/**
 * @fileOverview Summarizes an AI-related article from a given URL.
 *
 * - summarizeAiArticle - A function that summarizes an AI article from a URL.
 * - SummarizeAiArticleInput - The input type for the summarizeAiArticle function.
 * - SummarizeAiArticleOutput - The return type for the summarizeAiArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAiArticleInputSchema = z.object({
  articleUrl: z.string().url().describe('The URL of the AI-related article to summarize.'),
});
export type SummarizeAiArticleInput = z.infer<typeof SummarizeAiArticleInputSchema>;

const SummarizeAiArticleOutputSchema = z.object({
  summary: z.string().describe('A summary of the key points of the AI-related article.'),
});
export type SummarizeAiArticleOutput = z.infer<typeof SummarizeAiArticleOutputSchema>;

export async function summarizeAiArticle(input: SummarizeAiArticleInput): Promise<SummarizeAiArticleOutput> {
  return summarizeAiArticleFlow(input);
}

const summarizeArticlePrompt = ai.definePrompt({
  name: 'summarizeArticlePrompt',
  input: {schema: SummarizeAiArticleInputSchema},
  output: {schema: SummarizeAiArticleOutputSchema},
  prompt: `Summarize the key points of the following AI-related article from this URL: {{{articleUrl}}}.\n\nProvide a concise and informative summary. Focus on the core concepts and findings presented in the article.`,
});

const summarizeAiArticleFlow = ai.defineFlow(
  {
    name: 'summarizeAiArticleFlow',
    inputSchema: SummarizeAiArticleInputSchema,
    outputSchema: SummarizeAiArticleOutputSchema,
  },
  async input => {
    const {output} = await summarizeArticlePrompt(input);
    return output!;
  }
);
