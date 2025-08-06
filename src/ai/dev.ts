import { config } from 'dotenv';
config();

import '@/ai/flows/can-answer-question.ts';
import '@/ai/flows/generate-llm-response.ts';
import '@/ai/flows/process-query.ts';
