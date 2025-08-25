/*
MIT License
Copyright (c) 2025 Nicolas Freiherr von Rosen
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
*/

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { AppError } from '@/utils/errorHandling'
import { trackError } from '@/utils/errorTracking'
import { DatabaseError, ConfigurationError } from '@/utils/errorTypes'
import { getEnvVar } from '@/utils/env'

// Get these values from our centralized environment configuration
const supabaseUrl = getEnvVar.supabase.url
const supabaseAnonKey = getEnvVar.supabase.anonKey

// Check if we're in development environment
const isDevelopment = getEnvVar.development.isDev

/**
 * Create a mock PDF blob for development
 */
async function createMockPDFBlob(path: string): Promise<string> {
  // Create a simple PDF with basic content
  const pdfContent = createSimplePDF(path);
  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

/**
 * Create a simple PDF document in binary format
 */
function createSimplePDF(filename: string): Uint8Array {
  // Basic PDF structure with minimal content
  const content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 73
>>
stream
BT
/F1 24 Tf
100 700 Td
(Sample PDF Document) Tj
0 -30 Td
(Filename: ${filename.split('/').pop() || 'unknown'}) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Times-Roman
>>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
0000000348 00000 n 
0000000565 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF`;

  return new TextEncoder().encode(content);
}

// Create Supabase client
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Removed development authentication setup for security
// Remove automatic authentication initialization - this was a security vulnerability

// Storage bucket helpers
export const STORAGE_BUCKET = 'documents'

async function checkAuth() {
  // In development mode, bypass authentication checks
  if (isDevelopment) {
    console.log('Bypassing auth check in development mode');
    return {
      user: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'dev@example.com'
      }
    };
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.user) throw new Error('Not authenticated');
  return session;
}

async function verifyBucketAccess() {
  // In development mode, bypass bucket access checks
  if (isDevelopment) {
    console.log('Bypassing bucket access check in development mode');
    return true;
  }

  try {
    // Try to list files in the bucket root to verify access
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('');

    if (error) {
      let appError: AppError;
      
      if (error.message.includes('does not exist')) {
        appError = new ConfigurationError(
          `Storage bucket '${STORAGE_BUCKET}' not found. Please create it in the Supabase dashboard.`,
          'STORAGE_BUCKET'
        );
      } else if (error.message.includes('permission denied')) {
        appError = new DatabaseError(
          `Permission denied to access storage bucket '${STORAGE_BUCKET}'. Please check your RLS policies.`,
          'VERIFY_ACCESS'
        );
      } else {
        appError = new DatabaseError(
          error.message,
          'VERIFY_ACCESS'
        );
      }

      // Track the error
      await trackError(appError, 'verifyBucketAccess', {
        bucket: STORAGE_BUCKET,
        error: error.message,
      });

      throw appError;
    }

    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const appError = new DatabaseError(
      error instanceof Error ? error.message : 'Failed to verify bucket access',
      'VERIFY_ACCESS'
    );

    // Track the error
    await trackError(appError, 'verifyBucketAccess', {
      bucket: STORAGE_BUCKET,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw appError;
  }
}

export async function uploadDocument(file: File, path: string) {
  try {
    // Ensure user is authenticated and has bucket access
    const session = await checkAuth();
    await verifyBucketAccess();

    // In development mode, return mock data
    if (isDevelopment) {
      console.log('Mock uploading document:', file.name, 'to path:', path);
      return {
        path: path,
        id: `mock-${Date.now()}`,
        fullPath: `${STORAGE_BUCKET}/${path}`
      };
    }

    // Upload the file directly with upsert
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    throw error;
  }
}

export async function getDocumentUrl(path: string) {
  if (!path) return null;
  
  try {
    // Ensure user is authenticated and has bucket access
    const session = await checkAuth();
    await verifyBucketAccess();

    // In development mode, create a mock PDF blob
    if (isDevelopment) {
      console.log('Mock getting document URL for path:', path);
      return await createMockPDFBlob(path);
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 86400); // 24 hour expiry

    if (error) {
      console.error('Error getting document URL:', error);
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getDocumentUrl:', error);
    throw error;
  }
}

export async function deleteDocument(path: string) {
  try {
    // Ensure user is authenticated and has bucket access
    const session = await checkAuth();
    await verifyBucketAccess();

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    throw error;
  }
}

// Document management functions
export async function createDocument(name: string, storagePath: string | null = null) {
  try {
    const session = await checkAuth();
    
    // In development mode, return mock document
    if (isDevelopment) {
      console.log('Mock creating document:', name, 'with storage path:', storagePath);
      return {
        id: `mock-doc-${Date.now()}`,
        name,
        storage_path: storagePath,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: session.user.id,
        metadata: null
      };
    }
    
    const { data, error } = await supabase
      .from('documents')
      .insert({
        name,
        storage_path: storagePath,
        status: 'draft',
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}

export async function updateDocument(id: string, updates: {
  name?: string;
  status?: 'draft' | 'sent' | 'completed';
  storage_path?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await checkAuth();
    
    // In development mode, return mock updated document
    if (isDevelopment) {
      console.log('Mock updating document:', id, 'with updates:', updates);
      return {
        id,
        ...updates,
        updated_at: new Date().toISOString()
      };
    }
    
    const { data, error } = await supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

export async function getDocument(id: string) {
  try {
    const session = await checkAuth();
    
    // In development mode, return mock document
    if (isDevelopment) {
      console.log('Mock getting document with ID:', id);
      return {
        id: id,
        name: 'Sample Document.pdf',
        storage_path: `${session.user.id}/${id}/sample-document.pdf`,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: session.user.id,
        metadata: {},
        recipients: [
          {
            id: 'mock-recipient-1',
            name: 'John Doe',
            email: 'john@example.com',
            status: 'pending',
            document_id: id
          }
        ],
        signing_elements: []
      };
    }
    
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        recipients (*),
        signing_elements (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
}

export async function listDocuments(status?: 'draft' | 'sent' | 'completed') {
  try {
    const session = await checkAuth();
    
    // In development mode, return mock documents
    if (isDevelopment) {
      console.log('Mock listing documents with status:', status);
      const mockDocuments = [
        {
          id: 'mock-doc-1',
          name: 'Sample Contract.pdf',
          storage_path: 'sample-contract.pdf',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: session.user.id,
          recipients: []
        },
        {
          id: 'mock-doc-2', 
          name: 'Test Agreement.pdf',
          storage_path: 'test-agreement.pdf',
          status: 'sent',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          created_by: session.user.id,
          recipients: [{
            id: 'mock-recipient-1',
            name: 'John Doe',
            email: 'john@example.com',
            status: 'pending'
          }]
        }
      ];
      
      return status ? mockDocuments.filter(doc => doc.status === status) : mockDocuments;
    }
    
    let query = supabase
      .from('documents')
      .select(`
        *,
        recipients (*)
      `)
      .eq('created_by', session.user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error listing documents:', error);
    throw error;
  }
}

export async function getRecentActivity() {
  try {
    const session = await checkAuth();
    
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        recipients (*)
      `)
      .eq('created_by', session.user.id)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting recent activity:', error);
    throw error;
  }
}

// Types for signature and audit data
interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface SignatureData {
  document_id: string;
  recipient_id: string;
  value: string;
  type: string;
  created_at: string;
  agreed_to_terms: boolean;
  verification_hash: string;
  ip_address?: string;
  user_agent?: string;
  geolocation?: GeolocationData;
}

// Signature management functions
export async function createSignature(data: SignatureData) {
  try {
    await checkAuth();
    
    // In development mode, return mock signature
    if (isDevelopment) {
      console.log('Mock creating signature for document:', data.document_id);
      return {
        id: `mock-signature-${Date.now()}`,
        ...data,
        created_at: new Date().toISOString()
      };
    }
    
    const { data: signature, error } = await supabase
      .from('signatures')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return signature;
  } catch (error) {
    console.error('Error creating signature:', error);
    throw error;
  }
}

interface AuditLogData {
  signature_id: string;
  document_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  geolocation?: GeolocationData;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await checkAuth();
    
    // In development mode, return mock audit log
    if (isDevelopment) {
      console.log('Mock creating audit log for signature:', data.signature_id);
      return {
        id: `mock-audit-${Date.now()}`,
        ...data,
        created_at: new Date().toISOString()
      };
    }
    
    const { error } = await supabase
      .from('signature_audit_logs')
      .insert(data);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
}

// Recipient management functions
export async function updateRecipientStatus(recipientId: string, status: string) {
  try {
    await checkAuth();
    
    // In development mode, return mock success
    if (isDevelopment) {
      console.log('Mock updating recipient status:', recipientId, 'to', status);
      return { success: true };
    }
    
    const { error } = await supabase
      .from('recipients')
      .update({ status })
      .eq('id', recipientId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating recipient status:', error);
    throw error;
  }
}

export async function getDocumentRecipients(documentId: string) {
  try {
    await checkAuth();
    
    // In development mode, return mock recipients
    if (isDevelopment) {
      console.log('Mock getting recipients for document:', documentId);
      return [
        { id: 'mock-recipient-1', status: 'completed', name: 'John Doe', email: 'john@example.com' },
        { id: 'mock-recipient-2', status: 'pending', name: 'Jane Smith', email: 'jane@example.com' }
      ];
    }
    
    const { data, error } = await supabase
      .from('recipients')
      .select('status')
      .eq('document_id', documentId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting document recipients:', error);
    throw error;
  }
}

// Signing Elements management functions
export async function createSigningElement(data: {
  id: string;
  document_id: string;
  recipient_id: string;
  type: string;
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
}) {
  try {
    await checkAuth();
    
    // In development mode, return mock success
    if (isDevelopment) {
      console.log('Mock creating signing element:', data.type, 'for document:', data.document_id);
      return { success: true };
    }
    
    const { error } = await supabase
      .from('signing_elements')
      .insert([data]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error creating signing element:', error);
    throw error;
  }
}

export async function deleteSigningElement(id: string, documentId: string) {
  try {
    await checkAuth();
    
    // In development mode, return mock success
    if (isDevelopment) {
      console.log('Mock deleting signing element:', id, 'from document:', documentId);
      return { success: true };
    }
    
    const { error } = await supabase
      .from('signing_elements')
      .delete()
      .eq('id', id)
      .eq('document_id', documentId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting signing element:', error);
    throw error;
  }
}

export async function clearSupabaseCache() {
  // Clear all local storage data from Supabase
  localStorage.removeItem('supabase.auth.token');
  // Force refresh the client
  await supabase.auth.refreshSession();
} 