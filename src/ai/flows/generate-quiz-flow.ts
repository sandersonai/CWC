
'use server';
/**
 * @fileOverview Flow for generating a quiz question for a given AI/ML topic.
 *
 * - generateQuiz - A function that takes a topic and returns a quiz question.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generateQuizTool, QuizQuestionSchema, type QuizQuestion } from '@/ai/tools/generate-quiz-tool';

// Input schema for the flow
const GenerateQuizFlowInputSchema = z.object({
  topic: z.string().describe('The AI/ML topic for which to generate a quiz question.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizFlowInputSchema>;

// Output type for the flow - reusing the tool's output type
// We use the QuizQuestionSchema (imported from the tool) internally for defining the flow's outputSchema.
// We export the GenerateQuizOutput type, which is an alias for the QuizQuestion type.
export type GenerateQuizOutput = QuizQuestion;


export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

// The prompt itself is simple as the main logic is in the tool
// However, for direct tool use, we don't even need a prompt that calls an LLM.
// We will call the tool directly in the flow.
// If we wanted the LLM to decide to use the tool, we would do something like this:
/*
const quizPrompt = ai.definePrompt({
    name: 'generateQuizPrompt',
    input: { schema: GenerateQuizFlowInputSchema },
    output: { schema: QuizQuestionSchema }, // LLM output would need to match this.
    tools: [generateQuizTool],
    prompt: `Generate a quiz question about the topic: {{{topic}}}. Use the generateQuizTool.
             Your final output MUST be the direct JSON output of the generateQuizTool.`,
});
*/

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizFlowInputSchema,
    outputSchema: QuizQuestionSchema, // Use the imported schema directly
  },
  async (input) => {
    // For this use case, we always want to generate a quiz if this flow is called.
    // So, we call the tool directly. The tool itself handles the generation logic.
    try {
      const quizData = await generateQuizTool(input); // The tool itself is async and returns data matching QuizQuestionSchema
      return quizData;
    } catch (error) {
      console.error("Error calling generateQuizTool directly in flow:", error);
      // Fallback or rethrow
      throw new Error(`Failed to generate quiz question for topic "${input.topic}". ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

