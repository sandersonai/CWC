'use server';
/**
 * @fileOverview A Genkit tool to generate a quiz question for an AI/ML topic.
 *
 * - generateQuizTool - The Genkit tool definition.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The AI/ML topic for which to generate a quiz question.'),
});

const QuizOptionSchema = z.object({
  text: z.string().describe('The text of the quiz option.'),
});

const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the quiz question.'),
  options: z.array(QuizOptionSchema).length(4).describe('An array of 4 possible answers.'),
  correctOptionIndex: z.number().int().min(0).max(3).describe('The 0-based index of the correct option in the options array.'),
  explanation: z.string().optional().describe('A brief explanation for the correct answer.'),
});

const GenerateQuizOutputSchema = QuizQuestionSchema;

export const generateQuizTool = ai.defineTool(
  {
    name: 'generateQuizTool',
    description: 'Generates a multiple-choice quiz question for a given AI/ML topic.',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    // Mock implementation: In a real scenario, this would use an LLM to generate questions.
    // For now, return a predefined quiz question based on keywords.
    const topicLower = input.topic.toLowerCase();

    if (topicLower.includes('neural network')) {
      return {
        questionText: 'What is the basic building block of a neural network?',
        options: [
          { text: 'Algorithm' },
          { text: 'Neuron (or Node)' },
          { text: 'Dataset' },
          { text: 'Function' },
        ],
        correctOptionIndex: 1,
        explanation: 'Neurons (or nodes) are the fundamental units that process and transmit information in a neural network, inspired by biological neurons.'
      };
    } else if (topicLower.includes('ethics') || topicLower.includes('ai ethics')) {
      return {
        questionText: 'Which of these is a common ethical concern in AI development?',
        options: [
          { text: 'Algorithm speed' },
          { text: 'Bias in datasets and models' },
          { text: 'Hardware compatibility' },
          { text: 'Programming language choice' },
        ],
        correctOptionIndex: 1,
        explanation: 'Bias in datasets can lead to AI systems making unfair or discriminatory decisions, which is a major ethical concern.'
      };
    } else if (topicLower.includes('generative ai')) {
        return {
            questionText: 'What is a common application of Generative AI?',
            options: [
                { text: 'Data sorting' },
                { text: 'Image classification' },
                { text: 'Creating new images or text' },
                { text: 'Predicting stock prices' },
            ],
            correctOptionIndex: 2,
            explanation: 'Generative AI models are designed to create new content, such as images, text, music, or video, based on the data they were trained on.'
        };
    } else if (topicLower.includes('explainable ai') || topicLower.includes('xai')) {
        return {
            questionText: 'What is the primary goal of Explainable AI (XAI)?',
            options: [
                { text: 'To make AI models faster' },
                { text: 'To make AI models more complex' },
                { text: 'To make AI models understandable to humans' },
                { text: 'To reduce the cost of AI development' },
            ],
            correctOptionIndex: 2,
            explanation: 'XAI aims to provide insights into how AI models make their decisions, making them more transparent and trustworthy.'
        };
    }

    // Default fallback quiz question
    return {
      questionText: 'What does "AI" stand for?',
      options: [
        { text: 'Automated Intelligence' },
        { text: 'Artificial Intelligence' },
        { text: 'Algorithmic Intelligence' },
        { text: 'Advanced Interface' },
      ],
      correctOptionIndex: 1,
      explanation: '"AI" stands for Artificial Intelligence, which refers to the simulation of human intelligence in machines.'
    };
  }
);