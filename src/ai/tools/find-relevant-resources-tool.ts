/**
 * @fileOverview A Genkit tool to find relevant learning resources for AI/ML topics.
 *
 * - findRelevantResourcesTool - The Genkit tool definition.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FindRelevantResourcesInputSchema = z.object({
  topic: z.string().describe('The AI/ML topic for which to find resources.'),
});

const ResourceSchema = z.object({
  title: z.string().describe('The title of the resource.'),
  url: z.string().url().describe('The URL of the resource.'),
});

const FindRelevantResourcesOutputSchema = z.array(ResourceSchema).describe('A list of relevant learning resources.');

export const findRelevantResourcesTool = ai.defineTool(
  {
    name: 'findRelevantResourcesTool',
    description: 'Finds relevant articles, tutorials, or documentation for a given AI/ML topic. Use this to provide "Learn More" suggestions.',
    inputSchema: FindRelevantResourcesInputSchema,
    outputSchema: FindRelevantResourcesOutputSchema,
  },
  async (input) => {
    // Mock implementation: In a real scenario, this would search a database or the web.
    // For now, return predefined resources based on keywords in the topic.
    const topicLower = input.topic.toLowerCase();
    const resources: z.infer<typeof ResourceSchema>[] = [];

    if (topicLower.includes('neural network')) {
      resources.push(
        { title: 'Neural Networks and Deep Learning - Michael Nielsen', url: 'http://neuralnetworksanddeeplearning.com/' },
        { title: 'DeepLearning.AI - Andrew Ng', url: 'https://www.deeplearning.ai/' }
      );
    }
    if (topicLower.includes('ethics') || topicLower.includes('ai ethics')) {
      resources.push(
        { title: 'AI Ethics - Markkula Center for Applied Ethics', url: 'https://www.scu.edu/ethics/ai-ethics/' },
        { title: 'Ethics of Artificial Intelligence - Stanford Encyclopedia of Philosophy', url: 'https://plato.stanford.edu/entries/ethics-ai/' }
      );
    }
    if (topicLower.includes('generative ai')) {
      resources.push(
        { title: 'What is Generative AI? - NVIDIA', url: 'https://www.nvidia.com/en-us/glossary/generative-ai/' },
        { title: 'Generative AI by Google Cloud', url: 'https://cloud.google.com/discover/generative-ai' }
      );
    }
    if (topicLower.includes('explainable ai') || topicLower.includes('xai')) {
      resources.push(
        { title: 'Explainable AI (XAI) - IBM', url: 'https://www.ibm.com/topics/explainable-ai' },
        { title: 'Introduction to Explainable AI - Google Cloud', url: 'https://cloud.google.com/ai-platform/docs/explainable-ai/overview' }
      );
    }

    if (resources.length === 0 && topicLower.trim() !== "") { // Ensure topic is not empty
        // Generic fallback if no specific topic matched but a topic was provided
        resources.push(
            { title: `Search results for "${input.topic}" on Google Scholar`, url: `https://scholar.google.com/scholar?q=${encodeURIComponent(input.topic)}` },
            { title: `Learn about "${input.topic}" on Wikipedia`, url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(input.topic)}` }
        );
    }


    return resources.slice(0, 2); // Limit to 2 resources to keep it concise
  }
);
