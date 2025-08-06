import type { Timestamp } from 'firebase/firestore';

/**
 * @fileoverview Defines the structure of a Document object in Firestore.
 */

export interface Document {
  id: string; // Firestore document ID
  url: string;
  filename: string;
  uploadedAt: Timestamp;
  userId: string;
}
