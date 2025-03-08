
import { Document, Recipient } from '@/utils/types';

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
  label?: string;
}

export interface SignatureData {
  dataUrl: string;
  type: 'drawn' | 'typed' | 'uploaded';
  timestamp?: string;
  signatureHash?: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
  };
}

export interface EditorProps {
  documentId: string;
}
