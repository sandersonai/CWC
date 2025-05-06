
'use server';
/**
 * @fileOverview Generates an image based on a text prompt using Genkit.
 *
 * - generateImageFromPrompt - A function that takes a text prompt and returns a generated image as a data URI.
 * - GenerateImageInput - The input type for the generateImageFromPrompt function.
 * - GenerateImageOutput - The return type for the generateImageFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define schema internally, but do not export it directly
const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
// Export only the type
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

// Define schema internally, but do not export it directly
const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().describe(
    "The generated image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
// Export only the type
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;


export async function generateImageFromPrompt(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}


const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema, // Use internal schema
    outputSchema: GenerateImageOutputSchema, // Use internal schema
  },
  async (input) => {
    try {
       console.log(`Generating image for prompt: "${input.prompt}"`);
       const { media } = await ai.generate({
         // IMPORTANT: ONLY the googleai/gemini-2.0-flash-exp model is able to generate images.
         model: 'googleai/gemini-2.0-flash-exp',
         prompt: input.prompt,
         config: {
           // MUST provide both TEXT and IMAGE, IMAGE only won't work reliably
           responseModalities: ['TEXT', 'IMAGE'],
         },
       });

        if (!media?.url) {
            throw new Error('Image generation failed: No media URL returned.');
        }

        console.log(`Image generated successfully.`);
        return { imageDataUri: media.url };

    } catch (error) {
        console.error("Error in generateImageFlow:", error);
        // Consider more specific error handling or re-throwing
        throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
