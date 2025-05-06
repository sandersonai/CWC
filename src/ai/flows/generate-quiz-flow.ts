'use server';
/**
 * @fileOverview Flow for generating a quiz question.
 *
 * - generateQuiz - A function that takes a topic and returns a quiz question.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function (QuizQuestionSchema).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generateQuizTool } from '@/ai/tools/generate-quiz-tool'; // Assuming the tool schema is exported from tool file

// Input schema for the flow
const GenerateQuizFlowInputSchema = z.object({
  topic: z.string().describe('The AI/ML topic for which to generate a quiz question.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizFlowInputSchema>;


// Output schema for the flow - reusing the tool's output schema
// We need to define it again here or import it if the tool exports its output schema directly.
// For simplicity, let's redefine or assume generateQuizTool.outputSchema is accessible.

const QuizOptionSchema = z.object({ // Re-define or import if shared
  text: z.string(),
});

const GenerateQuizFlowOutputSchema = z.object({
  questionText: z.string(),
  options: z.array(QuizOptionSchema).length(4),
  correctOptionIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizFlowOutputSchema>;


export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

// The prompt itself is simple as the main logic is in the tool
const quizPrompt = ai.definePrompt({
    name: 'generateQuizPrompt',
    input: { schema: GenerateQuizFlowInputSchema },
    output: { schema: GenerateQuizFlowOutputSchema },
    tools: [generateQuizTool],
    prompt: `Generate a quiz question about the topic: {{{topic}}}. Use the generateQuizTool.`,
});


const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizFlowInputSchema,
    outputSchema: GenerateQuizFlowOutputSchema,
  },
  async (input) => {
    // Directly call the tool within the flow.
    // Or, if using an LLM to decide to use the tool (more complex):
    // const llmResponse = await quizPrompt(input);
    // return llmResponse.output()!;

    // For now, let's assume we always want to generate a quiz if this flow is called.
    // So, we call the tool directly.
    try {
      const quizData = await generateQuizTool(input); // The tool itself is async
      return quizData;
    } catch (error) {
      console.error("Error calling generateQuizTool:", error);
      // Fallback or rethrow
      throw new Error("Failed to generate quiz question.");
    }
  }
);