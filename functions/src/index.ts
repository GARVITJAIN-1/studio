/**
 * This is a multi-purpose Cloud Function that uses Genkit to process queries against a document.
 * It is designed to be called directly from a client application (e.g., a Next.js frontend).
 *
 * How it works:
 * 1. The function is triggered by an HTTPS call (`onCall`).
 * 2. It expects `documentUrl` and an array of `queries` in the request data.
 * 3. It uses a Genkit flow to generate a response for each query based on the document's content.
 * 4. The underlying Genkit flow utilizes an LLM to find answers, explanations, and sources.
 * 5. It returns an array of structured objects, each containing the original question and its corresponding answer, explanation, and source.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Import the Genkit flow that contains the core logic
import { processQuery as processQueryFlow } from "./flows/process-query";
import { ProcessQueryOutput } from "./schemas/process-query-schema";

// Define the output schema for a single query response, including the original question
interface ProcessedQueryOutput extends ProcessQueryOutput {
  questionText: string;
}

// Export the HTTPS Callable Function
export const processQuery = onCall(async (request): Promise<ProcessedQueryOutput[]> => {
  logger.info("processQuery function invoked", { data: request.data });

  const { documentUrl, queries } = request.data;

  // Validate input
  if (!documentUrl || typeof documentUrl !== 'string') {
    throw new HttpsError('invalid-argument', 'The function must be called with a "documentUrl" argument.');
  }
  if (!queries || !Array.isArray(queries) || queries.length === 0) {
    throw new HttpsError('invalid-argument', 'The function must be called with a "queries" array argument.');
  }

  try {
    // Process each query in parallel by calling the Genkit flow
    const results = await Promise.all(
      queries.map(async (query: string) => {
        const result = await processQueryFlow({ documentUrl, query });
        return {
          ...result,
          questionText: query, // Ensure the original question is in the response
        };
      })
    );

    logger.info("Successfully processed queries", { count: results.length });
    return results;

  } catch (error) {
    logger.error("Error processing queries:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    // Re-throw other errors as internal errors with a more descriptive message
    throw new HttpsError('internal', 'An unexpected error occurred while processing your request with the AI.', { error });
  }
});
