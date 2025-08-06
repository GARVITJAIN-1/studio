import type { DocumentReference, Timestamp } from 'firebase/firestore';

/**
 * @fileoverview Defines the structure of a Question object in Firestore.
 */

export interface Question {
  id: string; // Firestore document ID
  documentId: DocumentReference;
  questionText: string;
  answer: string;
  explanation: string;
  context: string;
  askedAt: Timestamp;
  userId: string;
}
