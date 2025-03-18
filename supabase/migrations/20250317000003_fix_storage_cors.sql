-- Update storage bucket CORS configuration
UPDATE storage.buckets
SET public = true,
    allowed_mime_types = array['application/pdf'],
    file_size_limit = 52428800, -- 50MB
    allowed_operations = array['select', 'insert', 'update', 'delete']
WHERE id = 'documents';

-- Create a function to handle CORS headers
CREATE OR REPLACE FUNCTION storage.handle_cors()
RETURNS trigger AS $$
BEGIN
  -- Set CORS headers for the response
  PERFORM set_config('response.headers', jsonb_build_object(
    'Access-Control-Allow-Origin', '*',
    'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type'
  )::text, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to apply CORS headers
DROP TRIGGER IF EXISTS storage_cors_trigger ON storage.objects;
CREATE TRIGGER storage_cors_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION storage.handle_cors(); 