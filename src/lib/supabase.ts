import { createClient } from '@supabase/supabase-js'

// Get these values from your Supabase project settings -> API
const supabaseUrl = 'https://tvlorxpfcbvmfvdbkvbf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bG9yeHBmY2J2bWZ2ZGJrdmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMDIzODUsImV4cCI6MjA1Njg3ODM4NX0.-Vf_67bdfrM2y9Ax3JrepgAJ-m7KF4ERmUPpmoe82L4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 