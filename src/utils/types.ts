
export interface Document {
  id: string;
  name: string;
  file: File | null;
  url: string;
  dateCreated: Date;
  status: 'draft' | 'sent' | 'completed';
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
  value: string | boolean;
  label?: string;
  required: boolean;
  assignedTo?: string;
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
