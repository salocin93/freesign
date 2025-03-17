/**
 * Core Type Definitions
 * 
 * This module contains TypeScript type definitions used throughout the application.
 * It defines interfaces and types for various features including document signing,
 * user management, and verification processes.
 * 
 * @module Types
 */

export interface Document {
  id: string;
  name: string;
  storage_path: string | null;
  status: 'draft' | 'sent' | 'completed';
  created_at: string;
  updated_at: string;
  created_by: string;
  metadata?: any;
  url?: string;
}

export interface SigningElement {
  id: string;
  type: 'signature' | 'date' | 'text' | 'checkbox' | 'name' | 'email' | 'address' | 'title';
  position: {
    x: number;
    y: number;
    pageIndex: number;
  };
  size: {
    width: number;
    height: number;
  };
  value: string | boolean | null;
  required: boolean;
  assignedTo: string | null;
  recipient_id: string | null;
  label?: string;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  status: string;
  document_id: string;
  created_at: string;
  updated_at: string;
}

export interface Signature {
  id: string;
  userId: string;
  type: 'draw' | 'type' | 'upload';
  value: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SignatureField {
  id: string;
  documentId: string;
  recipientId: string;
  signatureId: string | null;
  pageNumber: number;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  required: boolean;
  signedAt: string | null;
}

export interface SignatureData {
  dataUrl: string;
  type: 'drawn' | 'typed' | 'uploaded';
}

/**
 * Interface representing the result of a signature verification process.
 * Contains all necessary information about a verified signature, including
 * the signer's details and verification metadata.
 * 
 * @interface SignatureVerification
 */
export interface SignatureVerification {
  /** Whether the signature is valid and verified */
  isValid: boolean;
  
  /** ISO timestamp of when the signature was created */
  timestamp: string;
  
  /** Information about the person who signed the document */
  signedBy: {
    /** Full name of the signer */
    name: string;
    /** Email address of the signer */
    email: string;
    /** Unique identifier of the signer in the system */
    userId: string;
  };
  
  /** Unique identifier of the signed document */
  documentId: string;
  
  /** Cryptographic hash used for verification */
  verificationHash: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface DocumentActivity {
  id: string;
  documentId: string;
  documentName: string;
  action: 'viewed' | 'signed' | 'sent' | 'created';
  timestamp: Date;
  actorName: string;
  actorEmail: string;
}
