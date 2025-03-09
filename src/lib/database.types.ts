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
          file_path: string
          user_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          file_path: string
          user_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          file_path?: string
          user_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      recipients: {
        Row: {
          id: string
          document_id: string
          name: string
          email: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          name: string
          email: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          name?: string
          email?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipients_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
        ]
      }
      signatures: {
        Row: {
          id: string
          document_id: string
          signature: string
          signed_at: string
          agreed_to_terms: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          signature: string
          signed_at: string
          agreed_to_terms: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          signature?: string
          signed_at?: string
          agreed_to_terms?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 