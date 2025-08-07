'use server';
// This file is no longer used for the primary form action, 
// as the client now calls the Firebase Function directly.
// It is kept for reference or potential future use with other server actions.

import { generateLLMResponse, type GenerateLLMResponseOutput } from '@/ai/flows/generate-llm-response';
import { processQuery } from '@/ai/flows/process-query';
import { ProcessQueryOutput, ProcessQueryInputSchema } from '@/ai/schemas/process-query-schema';
import { z } from 'zod';

const formSchema = z.object({
  query: z.string(),
});

type HandleQueryResult = {
  response?: GenerateLLMResponseOutput;
  error?: string;
}

export async function handleQuery(values: z.infer<typeof formSchema>): Promise<HandleQueryResult> {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid input.' };
  }
  
  try {
    const response = await generateLLMResponse({ query: validatedFields.data.query });
    return { response };
  } catch (e) {
    console.error(e);
    // This is a user-facing error message.
    // In a real application, you would want to log the full error `e` for debugging.
    return { error: 'An unexpected error occurred while processing your request. Please try again later.' };
  }
}

const processQueryFormSchema = ProcessQueryInputSchema;

type ProcessQueryResult = {
  response?: ProcessQueryOutput;
  error?: string;
}

export async function processQueryAction(values: z.infer<typeof processQueryFormSchema>): Promise<ProcessQueryResult> {
  const validatedFields = processQueryFormSchema.safeParse(values);

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const errorMessage = Object.values(errors).flat().join(' ');
    return { error: errorMessage || 'Invalid input.' };
  }

  try {
    const response = await processQuery({ 
      documentUrl: validatedFields.data.documentUrl,
      query: validatedFields.data.query 
    });
    return { response };
  } catch (e) {
    console.error(e);
    return { error: 'An unexpected error occurred while processing your request. Please try again later.' };
  }
}
