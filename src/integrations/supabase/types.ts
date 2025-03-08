export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          name: string
          status: string | null
          storage_path: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name: string
          status?: string | null
          storage_path?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          status?: string | null
          storage_path?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      recipients: {
        Row: {
          created_at: string | null
          document_id: string | null
          email: string
          id: string
          name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          email: string
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          email?: string
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipients_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_audit_logs: {
        Row: {
          created_at: string | null
          document_id: string | null
          event_data: Json | null
          event_type: string
          geolocation: Json | null
          id: string
          ip_address: string | null
          signature_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          event_data?: Json | null
          event_type: string
          geolocation?: Json | null
          id?: string
          ip_address?: string | null
          signature_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          event_data?: Json | null
          event_type?: string
          geolocation?: Json | null
          id?: string
          ip_address?: string | null
          signature_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_audit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_audit_logs_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          created_at: string | null
          geolocation: Json | null
          id: string
          ip_address: string | null
          metadata: Json | null
          name: string | null
          type: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          value: string
          verification_hash: string | null
        }
        Insert: {
          created_at?: string | null
          geolocation?: Json | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          name?: string | null
          type: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          value: string
          verification_hash?: string | null
        }
        Update: {
          created_at?: string | null
          geolocation?: Json | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          name?: string | null
          type?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          value?: string
          verification_hash?: string | null
        }
        Relationships: []
      }
      signing_elements: {
        Row: {
          created_at: string | null
          document_id: string | null
          id: string
          position: Json
          recipient_id: string | null
          size: Json
          type: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          position: Json
          recipient_id?: string | null
          size: Json
          type: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          position?: Json
          recipient_id?: string | null
          size?: Json
          type?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signing_elements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signing_elements_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "recipients"
            referencedColumns: ["id"]
          },
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
