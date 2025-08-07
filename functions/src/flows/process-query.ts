'use server';
/**
 * @fileOverview A flow to process a user's query against a document.
 *
 * - processQuery - A function that takes a document URL and a query and returns a structured response.
 */
import {ai} from '../genkit-config';
import {
  ProcessQueryInput,
  ProcessQueryInputSchema,
  ProcessQueryOutput,
  ProcessQueryOutputSchema,
} from '../schemas/process-query-schema';
import {HttpsError} from 'firebase-functions/v2/https';

export async function processQuery(
  input: ProcessQueryInput
): Promise<ProcessQueryOutput> {
  return processQueryFlow(input);
}

const processQueryFlow = ai.defineFlow(
  {
    name: 'processQueryFlow',
    inputSchema: ProcessQueryInputSchema,
    outputSchema: ProcessQueryOutputSchema,
  },
  async input => {
    const llmResponse = await ai.generate({
      prompt: `You are an insurance policy assistant. Use the document at ${input.documentUrl} as context to answer the following question: "${input.query}". If the answer is found, explain the condition and quote the clause. If not, respond with "Information not available."`,
      model: 'googleai/gemini-2.0-flash',
      output: {
        schema: ProcessQueryOutputSchema,
      },
    });

    const output = llmResponse.output;

    if (!output) {
      throw new HttpsError(
        'internal',
        'The AI failed to generate a response. Please try again.'
      );
    }

    return output;
  }
);
