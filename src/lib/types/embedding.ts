import type { DocumentReference } from 'firebase/firestore';

/**
 * @fileoverview Defines the structure of an Embedding object in Firestore.
 */

export interface Embedding {
  id: string; // Firestore document ID
  documentId: DocumentReference;
  chunk: string;
  embedding: number[]; // Array of floats
  page: number;
}
