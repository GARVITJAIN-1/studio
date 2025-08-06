/**
 * @fileOverview Schemas and types for the processQuery flow.
 * 
 * - ProcessQueryInputSchema - The Zod schema for the input of the processQuery function.
 * - ProcessQueryInput - The TypeScript type for the input of the processQuery function.
 * - ProcessQueryOutputSchema - The Zod schema for the output of the processQuery function.
 * - ProcessQueryOutput - The TypeScript type for the output of the processQuery function.
 */

import { z } from 'zod';

export const ProcessQueryInputSchema = z.object({
  documentUrl: z.string().url().describe('The URL of the document to query.'),
  query: z.string().describe('The question to ask about the document.'),
});
export type ProcessQueryInput = z.infer<typeof ProcessQueryInputSchema>;

export const ProcessQueryOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
  explanation: z.string().describe('An explanation of how the answer was derived from the document.'),
  context: z.string().describe('The relevant snippet from the document that was used to answer the question.'),
});
export type ProcessQueryOutput = z.infer<typeof ProcessQueryOutputSchema>;
