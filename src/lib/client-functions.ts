// This file is for client-side code to interact with Firebase Functions.
import { getFunctions, httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

// Define the expected input and output types for the processQuery function
interface ProcessQueryInput {
  documentUrl: string;
  queries: string[];
}

interface ProcessQueryOutput {
  answer: string;
  explanation: string;
  source: string;
  questionText: string;
}

// Get a reference to the processQuery function
const processQueryCallable = httpsCallable<ProcessQueryInput, ProcessQueryOutput[]>(functions, 'processQuery');

// Create a wrapper function for easier use in the application
export const processQuery = async (data: ProcessQueryInput) => {
  try {
    const result = await processQueryCallable(data);
    return { data: result.data };
  } catch (error: any) {
    console.error("Error calling processQuery function:", error);
    return { error: error.message || "An unknown error occurred." };
  }
};
