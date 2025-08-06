'use server';

/**
 * @fileOverview A flow to process a user's query against a document.
 * 
 * - processQuery - A function that takes a document URL and a query and returns a structured response.
 */

import { ai } from '@/ai/genkit';
import { auth } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
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
    prompt: `You are an expert at analyzing documents and answering questions about them.
    
    Document URL: {{{documentUrl}}}
    Question: {{{query}}}
    
    Please analyze the document at the given URL and provide a clear answer to the question.
    In your response, include the answer, an explanation of your reasoning, and the specific context from the document that supports your answer.`
});

export async function processQuery(input: ProcessQueryInput): Promise<ProcessQueryOutput> {
  const llmResponse = await ai.generate({
    prompt: `Analyze the document at ${input.documentUrl} and answer the following question: "${input.query}". Provide the answer, an explanation, and the context from the document.`,
    model: 'googleai/gemini-2.0-flash',
    output: {
        schema: ProcessQueryOutputSchema,
    }
  });

  const output = llmResponse.output!;

  const user = auth.currentUser;
  if (user && firestore) {
    await addDoc(collection(firestore, 'questions'), {
      userId: user.uid,
      documentUrl: input.documentUrl,
      questionText: input.query,
      answer: output.answer,
      explanation: output.explanation,
      context: output.context,
      askedAt: serverTimestamp(),
    });
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
