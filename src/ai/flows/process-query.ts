'use server';

/**
 * @fileOverview A flow to process a user's query against a document.
 * 
 * - processQuery - A function that takes a document URL and a query and returns a structured response.
 */

import { ai } from '@/ai/genkit';
import { 
  ProcessQueryInput,
  ProcessQueryInputSchema,
  ProcessQueryOutput,
  ProcessQueryOutputSchema
} from '@/ai/schemas/process-query-schema';

const prompt = ai.definePrompt({
    name: 'processQueryPrompt',
    input: { schema: ProcessQueryInputSchema },
    output: { schema: ProcessQueryOutputSchema },
    prompt: `You are an insurance policy assistant. Use the following context to answer the question.

Context:
{{{documentUrl}}}

Question:
{{{query}}}

Instructions:
- If answer found, explain the condition and quote the clause.
- If not, respond with “Information not available.”`
});

export async function processQuery(input: ProcessQueryInput): Promise<ProcessQueryOutput> {
  const llmResponse = await ai.generate({
    prompt: `You are an insurance policy assistant. Use the document at ${input.documentUrl} as context to answer the following question: "${input.query}". If the answer is found, explain the condition and quote the clause. If not, respond with "Information not available."`,
    model: 'googleai/gemini-2.0-flash',
    output: {
        schema: ProcessQueryOutputSchema,
    }
  });

  const output = llmResponse.output;

  if (!output) {
    throw new Error('The AI failed to generate a response. Please try again.');
  }

  return output;
}

ai.defineFlow(
  {
    name: 'processQueryFlow',
    inputSchema: ProcessQueryInputSchema,
    outputSchema: ProcessQueryOutputSchema,
  },
  async (input) => {
    return await processQuery(input);
  }
);
