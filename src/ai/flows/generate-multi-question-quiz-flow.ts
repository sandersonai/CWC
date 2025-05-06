'use server';
/**
 * @fileOverview Flow for generating a multi-question quiz on AI/ML topics based on difficulty.
 *
 * - generateMultiQuestionQuiz - A function that takes difficulty and number of questions, returns a set of quiz questions.
 * - GenerateMultiQuestionQuizInput - The input type for the function.
 * - GenerateMultiQuestionQuizOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { QuizQuestionSchema } from '@/ai/tools/generate-quiz-tool'; // Reusing the existing schema

const GenerateMultiQuestionQuizInputSchema = z.object({
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the quiz.'),
  numberOfQuestions: z.number().int().positive().min(1).max(10).describe('The number of questions to generate (1-10).'), // Added min/max for safety
});
export type GenerateMultiQuestionQuizInput = z.infer<typeof GenerateMultiQuestionQuizInputSchema>;

const GenerateMultiQuestionQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of quiz questions.'),
});
export type GenerateMultiQuestionQuizOutput = z.infer<typeof GenerateMultiQuestionQuizOutputSchema>;


export async function generateMultiQuestionQuiz(input: GenerateMultiQuestionQuizInput): Promise<GenerateMultiQuestionQuizOutput> {
  return generateMultiQuestionQuizFlow(input);
}

const multiQuestionQuizPrompt = ai.definePrompt({
  name: 'multiQuestionQuizPrompt',
  input: { schema: GenerateMultiQuestionQuizInputSchema },
  output: { schema: GenerateMultiQuestionQuizOutputSchema },
  prompt: `You are an expert AI/ML quiz generator.
  Generate a quiz with exactly {{numberOfQuestions}} multiple-choice questions about various AI and Machine Learning topics.
  The difficulty of the questions should be: {{difficulty}}.
  Each question must have:
  - A clear question text.
  - Exactly 4 options.
  - The 0-based index of the correct option.
  - A brief explanation for the correct answer.

  Ensure the questions cover a range of AI/ML concepts appropriate for the specified difficulty level.
  For 'Easy' difficulty, focus on basic definitions and common applications.
  For 'Medium' difficulty, cover more specific concepts, algorithms, or techniques.
  For 'Hard' difficulty, delve into nuanced details, advanced architectures, or comparative analysis.
  Provide the output in the specified JSON format for an array of questions. Ensure the array contains exactly {{numberOfQuestions}} questions.`,
});


const generateMultiQuestionQuizFlow = ai.defineFlow(
  {
    name: 'generateMultiQuestionQuizFlow',
    inputSchema: GenerateMultiQuestionQuizInputSchema,
    outputSchema: GenerateMultiQuestionQuizOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await multiQuestionQuizPrompt(input);
      // Validate the output structure and number of questions
      if (!output || !Array.isArray(output.questions) || output.questions.length !== input.numberOfQuestions) {
        console.warn(`Initial quiz generation did not meet criteria (expected ${input.numberOfQuestions}, got ${output?.questions?.length ?? 0}). Attempting regeneration.`);
        const { output: regeneratedOutput } = await multiQuestionQuizPrompt(input); // Retry once
        if (!regeneratedOutput || !Array.isArray(regeneratedOutput.questions) || regeneratedOutput.questions.length !== input.numberOfQuestions) {
          // Log the problematic output for debugging
          console.error("Regenerated output:", JSON.stringify(regeneratedOutput, null, 2));
          throw new Error(`Quiz generation failed to produce the correct number of questions after regeneration. Expected ${input.numberOfQuestions}, got ${regeneratedOutput?.questions?.length || 0}.`);
        }
        // Ensure each question in the regenerated output is valid
        regeneratedOutput.questions.forEach((q, index) => {
          const validation = QuizQuestionSchema.safeParse(q);
          if (!validation.success) {
            console.error(`Invalid question structure at index ${index} after regeneration:`, validation.error.issues);
            throw new Error(`Invalid question structure in regenerated quiz at index ${index}.`);
          }
        });
        return regeneratedOutput!;
      }
      // Ensure each question in the initial output is valid
      output.questions.forEach((q, index) => {
        const validation = QuizQuestionSchema.safeParse(q);
        if (!validation.success) {
            console.error(`Invalid question structure at index ${index} in initial output:`, validation.error.issues);
            throw new Error(`Invalid question structure in initial quiz at index ${index}.`);
        }
      });
      return output!;
    } catch (error) {
      console.error("Error in generateMultiQuestionQuizFlow:", error);
      // Provide a more user-friendly error message if possible, or rethrow specific errors.
      throw new Error(`Failed to generate multi-question quiz for ${input.difficulty} level. ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
