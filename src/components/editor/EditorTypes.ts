/**
 * Editor Types
 * 
 * Type definitions for the document editor components and related functionality.
 * This file contains interfaces for signing elements, signature data, and editor props.
 * 
 * Types:
 * 
 * SigningElement
 * - Represents a signing element on a document (signature field, date field, etc.)
 * - Contains position, size, value, and assignment information
 * - Supports various element types (signature, date, text, checkbox, etc.)
 * 
 * SignatureData
 * - Represents the data structure for a signature
 * - Includes the signature image data, type, and metadata
 * - Supports different signature creation methods (drawn, typed, uploaded)
 * 
 * EditorProps
 * - Configuration props for the document editor
 * - Contains essential document identification
 * 
 * Dependencies:
 * - @/utils/types: For Document and Recipient types
 * 
 * Usage:
 * ```typescript
 * import { SigningElement, SignatureData, EditorProps } from './EditorTypes';
 * 
 * // Example usage of SigningElement
 * const signatureField: SigningElement = {
 *   id: 'sig1',
 *   type: 'signature',
 *   position: { x: 100, y: 200, pageIndex: 0 },
 *   size: { width: 200, height: 100 },
 *   value: null,
 *   required: true,
 *   assignedTo: 'recipient1'
 * };
 * 
 * // Example usage of SignatureData
 * const signature: SignatureData = {
 *   dataUrl: 'data:image/png;base64,...',
 *   type: 'drawn',
 *   timestamp: new Date().toISOString(),
 *   metadata: {
 *     userAgent: navigator.userAgent,
 *     ipAddress: '192.168.1.1'
 *   }
 * };
 * 
 * // Example usage of EditorProps
 * const editorProps: EditorProps = {
 *   documentId: 'doc123'
 * };
 * ```
 */

import { Document, Recipient } from '@/utils/types';

/**
 * Interface representing a signing element on a document
 */
export interface SigningElement {
  /** Unique identifier for the element */
  id: string;
  /** Type of the signing element */
  type: 'signature' | 'date' | 'text' | 'checkbox' | 'name' | 'email' | 'address' | 'title';
  /** Position of the element on the document */
  position: {
    /** X coordinate in pixels */
    x: number;
    /** Y coordinate in pixels */
    y: number;
    /** Index of the page where the element is placed */
    pageIndex: number;
  };
  /** Size of the element */
  size: {
    /** Width in pixels */
    width: number;
    /** Height in pixels */
    height: number;
  };
  /** Current value of the element */
  value: string | boolean | null;
  /** Whether the element is required */
  required: boolean;
  /** ID of the recipient assigned to this element */
  assignedTo: string | null;
  /** Optional label for the element */
  label?: string;
}

/**
 * Interface representing signature data
 */
export interface SignatureData {
  /** Base64 encoded image data of the signature */
  dataUrl: string;
  /** Method used to create the signature */
  type: 'drawn' | 'typed' | 'uploaded';
  /** Timestamp of when the signature was created */
  timestamp?: string;
  /** Hash for signature verification */
  signatureHash?: string;
  /** Additional metadata about the signature */
  metadata?: {
    /** User agent string of the browser */
    userAgent?: string;
    /** IP address of the user */
    ipAddress?: string;
    /** Unique device identifier */
    deviceId?: string;
  };
}

/**
 * Interface for editor component props
 */
export interface EditorProps {
  /** ID of the document being edited */
  documentId: string;
}
