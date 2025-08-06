'use server';

/**
 * @fileOverview A flow to determine if the system can answer a question using an LLM.
 *
 * - canAnswerQuestion - A function that determines if the system can answer a question.
 * - CanAnswerQuestionInput - The input type for the canAnswerQuestion function.
 * - CanAnswerQuestionOutput - The return type for the canAnswerQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CanAnswerQuestionInputSchema = z.object({
  query: z.string().describe('The question to be answered.'),
});
export type CanAnswerQuestionInput = z.infer<typeof CanAnswerQuestionInputSchema>;

const CanAnswerQuestionOutputSchema = z.object({
  canAnswer: z.boolean().describe('Whether or not the system can answer the question.'),
  reason: z.string().describe('The reason why the system can or cannot answer the question.'),
});
export type CanAnswerQuestionOutput = z.infer<typeof CanAnswerQuestionOutputSchema>;

export async function canAnswerQuestion(input: CanAnswerQuestionInput): Promise<CanAnswerQuestionOutput> {
  return canAnswerQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'canAnswerQuestionPrompt',
  input: {schema: CanAnswerQuestionInputSchema},
  output: {schema: CanAnswerQuestionOutputSchema},
  prompt: `You are an AI assistant that determines whether you can answer a given question.

  Question: {{{query}}}

  First, determine if the question is relevant to topics you are trained on.
  Second, determine if you have the knowledge to answer the question accurately and truthfully.

  Based on your assessment, respond with a JSON object that looks like this:
  {
    "canAnswer": true or false,
    "reason": "explanation of why you can or cannot answer the question"
  }
  `,
});

const canAnswerQuestionFlow = ai.defineFlow(
  {
    name: 'canAnswerQuestionFlow',
    inputSchema: CanAnswerQuestionInputSchema,
    outputSchema: CanAnswerQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
