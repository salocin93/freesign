export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          name: string
          url: string | null
          storage_path: string | null
          status: 'draft' | 'sent' | 'completed'
          created_at: string
          updated_at: string
          created_by: string
          metadata: Json
        }
        Insert: {
          id?: string
          name: string
          url?: string | null
          storage_path?: string | null
          status?: 'draft' | 'sent' | 'completed'
          created_at?: string
          updated_at?: string
          created_by: string
          metadata?: Json
        }
        Update: {
          id?: string
          name?: string
          url?: string | null
          storage_path?: string | null
          status?: 'draft' | 'sent' | 'completed'
          created_at?: string
          updated_at?: string
          created_by?: string
          metadata?: Json
        }
      }
      recipients: {
        Row: {
          id: string
          document_id: string
          email: string
          name: string | null
          status: 'pending' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          email: string
          name?: string | null
          status?: 'pending' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          email?: string
          name?: string | null
          status?: 'pending' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      signing_elements: {
        Row: {
          id: string
          document_id: string
          recipient_id: string
          type: string
          position: Json
          size: Json
          value: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          recipient_id: string
          type: string
          position: Json
          size: Json
          value?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          recipient_id?: string
          type?: string
          position?: Json
          size?: Json
          value?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 