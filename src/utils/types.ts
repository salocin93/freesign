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
  type: 'signature' | 'date' | 'name' | 'email' | 'address' | 'title' | 'text' | 'checkbox';
  position: {
    x: number;
    y: number;
    pageIndex: number;
  };
  size: {
    width: number;
    height: number;
  };
  value: string | boolean;
  label?: string;
  required: boolean;
  assignedTo?: string; // recipient id
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'completed';
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
