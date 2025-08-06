'use server';

import { generateLLMResponse, type GenerateLLMResponseOutput } from '@/ai/flows/generate-llm-response';
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
