export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      credit_ledger: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          id: string
          note: string | null
          transaction_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          id?: string
          note?: string | null
          transaction_id?: string | null
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          note?: string | null
          transaction_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string | null
          credit_balance: number
          credit_limit: number
          loyalty_points: number
          total_spent: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          credit_balance?: number
          credit_limit?: number
          loyalty_points?: number
          total_spent?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          credit_balance?: number
          credit_limit?: number
          loyalty_points?: number
          total_spent?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          price: number
          stock: number
          barcode: string | null
          box_barcode: string | null
          image: string | null
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          price?: number
          stock?: number
          barcode?: string | null
          box_barcode?: string | null
          image?: string | null
          category?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          stock?: number
          barcode?: string | null
          box_barcode?: string | null
          image?: string | null
          category?: string
          created_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          expiry_date: string | null
          id: string
          product_name: string
          purchase_order_id: string
          quantity: number
          sale_price: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          expiry_date?: string | null
          id?: string
          product_name: string
          purchase_order_id: string
          quantity?: number
          sale_price?: number
          total_cost?: number
          unit_cost?: number
        }
        Update: {
          expiry_date?: string | null
          id?: string
          product_name?: string
          purchase_order_id?: string
          quantity?: number
          sale_price?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          shipment_cost: number
          status: string
          supplier: string | null
          total_items: number
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          order_id: string
          shipment_cost?: number
          status?: string
          supplier?: string | null
          total_items?: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          shipment_cost?: number
          status?: string
          supplier?: string | null
          total_items?: number
        }
        Relationships: []
      }
      store_config: {
        Row: {
          id: string
          store_name: string
          vat_number: string | null
          address: string | null
          currency: string
          subscription_status: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_name: string
          vat_number?: string | null
          address?: string | null
          currency?: string
          subscription_status?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_name?: string
          vat_number?: string | null
          address?: string | null
          currency?: string
          subscription_status?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          pin: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          pin: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          pin?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_alerts: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          is_read: boolean
          staff_id: string | null
          staff_name: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          is_read?: boolean
          staff_id?: string | null
          staff_name: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          is_read?: boolean
          staff_id?: string | null
          staff_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_alerts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_items: {
        Row: {
          barcode: string | null
          cost: number
          currency: string
          discount: number
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          total: number
          transaction_id: string
          unit_price: number
        }
        Insert: {
          barcode?: string | null
          cost?: number
          currency?: string
          discount?: number
          id?: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total?: number
          transaction_id: string
          unit_price?: number
        }
        Update: {
          barcode?: string | null
          cost?: number
          currency?: string
          discount?: number
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total?: number
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          cashier: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          discount: number
          id: string
          invoice_no: string
          payment_type: string
          qr_data: string | null
          status: string
          subtotal: number
          total: number
          vat: number
        }
        Insert: {
          cashier?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          discount?: number
          id?: string
          invoice_no: string
          payment_type?: string
          qr_data?: string | null
          status?: string
          subtotal?: number
          total?: number
          vat?: number
        }
        Update: {
          cashier?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          discount?: number
          id?: string
          invoice_no?: string
          payment_type?: string
          qr_data?: string | null
          status?: string
          subtotal?: number
          total?: number
          vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
