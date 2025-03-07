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

// Initialize storage bucket if it doesn't exist
async function ensureStorageBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf']
      });
      
      if (error) {
        console.error('Error creating storage bucket:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error checking/creating storage bucket:', error);
    throw error;
  }
}

export async function uploadDocument(file: File, path: string) {
  try {
    // Ensure bucket exists before upload
    await ensureStorageBucket();
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
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
  
  const { data } = await supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)
  
  return data.publicUrl
}

export async function deleteDocument(path: string) {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path])

  if (error) throw error
} 