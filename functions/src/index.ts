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

// Import Genkit and Zod for defining schemas and flows
import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { firebase } from "@genkit-ai/firebase";

// Initialize Genkit with Firebase and Google AI plugins
genkit({
  plugins: [
    firebase(),
    googleAI(),
  ],
  logSinks: ["firebase"],
  enableTracingAndMetrics: true,
});

// Define the output schema for a single query response
const ProcessQueryOutputSchema = z.object({
  answer: z.string().describe("The answer to the question."),
  explanation: z.string().describe("An explanation of the condition or how the answer was derived."),
  source: z.string().describe("The relevant clause or snippet from the document that was used to answer the question."),
  questionText: z.string().describe("The original question text."),
});

// Define the Genkit flow
const processQueryFlow = async (documentUrl: string, query: string) => {
  const prompt = `You are an insurance policy assistant. Use the document at ${documentUrl} as context to answer the following question: "${query}". 
  If the answer is found, explain the condition and quote the clause. 
  If not, respond with "Information not available."`;

  const llmResponse = await genkit.generate({
    model: 'googleai/gemini-2.0-flash',
    prompt: prompt,
    output: {
      schema: z.object({
        answer: z.string(),
        explanation: z.string(),
        source: z.string(),
      })
    }
  });

  const output = llmResponse.output;
  if (!output) {
    throw new HttpsError('internal', 'The AI failed to generate a response.');
  }

  return {
    ...output,
    questionText: query, // Include the original question in the response
  };
};

// Export the HTTPS Callable Function
export const processQuery = onCall(async (request) => {
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
    // Process each query in parallel
    const results = await Promise.all(
      queries.map(query => processQueryFlow(documentUrl, query))
    );

    logger.info("Successfully processed queries", { count: results.length });
    return results;

  } catch (error) {
    logger.error("Error processing queries:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    // Re-throw other errors as internal errors
    throw new HttpsError('internal', 'An unexpected error occurred while processing your request.');
  }
});
