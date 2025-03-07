export interface Document {
  id: string;
  name: string;
  storage_path: string | null;
  url: string | null;
  status: 'draft' | 'sent' | 'completed';
  created_at: string;
  updated_at: string;
  created_by: string;
  metadata: any;
  recipients?: Recipient[];
}

export interface SigningElement {
  id: string;
  type: 'signature' | 'date' | 'text' | 'checkbox';
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
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'completed';
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

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
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
