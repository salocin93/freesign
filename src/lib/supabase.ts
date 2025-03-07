import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Get these values from your Supabase project settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Storage bucket helpers
export const STORAGE_BUCKET = 'documents'

async function checkAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session?.user) throw new Error('Not authenticated');
  return session;
}

async function verifyBucket() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;

    const bucket = buckets?.find(b => b.name === STORAGE_BUCKET);
    if (!bucket) {
      throw new Error(`Storage bucket '${STORAGE_BUCKET}' not found. Please create it in the Supabase dashboard.`);
    }
  } catch (error) {
    console.error('Error verifying bucket:', error);
    throw error;
  }
}

export async function uploadDocument(file: File, path: string) {
  try {
    // Ensure user is authenticated and bucket exists
    const session = await checkAuth();
    await verifyBucket();

    // First check if file already exists
    const { data: existingFile } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(path.split('/').slice(0, -1).join('/'));

    const fileName = path.split('/').pop();
    const fileExists = existingFile?.some(f => f.name === fileName);

    // If file exists, try to delete it first
    if (fileExists) {
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path]);
      
      if (deleteError) {
        console.error('Error deleting existing file:', deleteError);
      }
    }

    // Upload the file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // Change to true to handle existing files
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
    // Ensure user is authenticated and bucket exists
    const session = await checkAuth();
    await verifyBucket();

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 3600); // 1 hour expiry

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
    // Ensure user is authenticated and bucket exists
    const session = await checkAuth();
    await verifyBucket();

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