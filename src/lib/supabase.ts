/*
MIT License
Copyright (c) 2025 Nicolas Freiherr von Rosen
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
*/

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Add Vite env type definition
interface ImportMetaEnv {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Get these values from your Supabase project settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Check if we're in development environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Mock session for development
const mockSession = {
  user: {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'dev@example.com',
    role: 'authenticated',
  }
};

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

// Development authentication setup
let authInitialized = false;
export const initializeAuth = async () => {
  if (!isDevelopment || authInitialized) return;
  
  try {
    // Sign in with the development user credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'dev@example.com',
      password: 'development-password'
    });

    if (error) {
      console.error('Error signing in with development user:', error);
      console.log('Please ensure the development user exists in Supabase with correct credentials');
      return;
    }

    if (data.user?.id !== '00000000-0000-0000-0000-000000000000') {
      console.warn('Development user ID does not match expected ID');
    }

    authInitialized = true;
    console.log('Development authentication initialized');
  } catch (error) {
    console.error('Error initializing development auth:', error);
  }
};

// Initialize auth in development mode
if (isDevelopment) {
  initializeAuth();
}

// Storage bucket helpers
export const STORAGE_BUCKET = 'documents'

async function checkAuth() {
  if (isDevelopment) {
    console.log('Using mock session in development mode');
    // Initialize auth if not already done
    await initializeAuth();
    
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session?.user) {
      throw new Error('Development mode: Not authenticated. Please check mock auth setup.');
    }
    return session;
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.user) throw new Error('Not authenticated');
  return session;
}

async function verifyBucketAccess() {
  try {
    // Try to list files in the bucket root to verify access
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('');

    if (error) {
      if (error.message.includes('does not exist')) {
        throw new Error(`Storage bucket '${STORAGE_BUCKET}' not found. Please create it in the Supabase dashboard.`);
      } else if (error.message.includes('permission denied')) {
        throw new Error(`Permission denied to access storage bucket '${STORAGE_BUCKET}'. Please check your RLS policies.`);
      }
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error verifying bucket access:', error);
    throw error;
  }
}

export async function uploadDocument(file: File, path: string) {
  try {
    // Ensure user is authenticated and has bucket access
    const session = await checkAuth();
    await verifyBucketAccess();

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
  metadata?: any;
}) {
  try {
    await checkAuth();
    
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
    await checkAuth();
    
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

export async function clearSupabaseCache() {
  // Clear all local storage data from Supabase
  localStorage.removeItem('supabase.auth.token');
  // Force refresh the client
  await supabase.auth.refreshSession();
} 