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
      counterparties: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      credit_status: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      formula_operators: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          symbol: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          symbol: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      forward_prices: {
        Row: {
          created_at: string
          forward_date: string
          id: string
          instrument_id: string
          price: number
          upload_date: string
        }
        Insert: {
          created_at?: string
          forward_date: string
          id?: string
          instrument_id: string
          price: number
          upload_date?: string
        }
        Update: {
          created_at?: string
          forward_date?: string
          id?: string
          instrument_id?: string
          price?: number
          upload_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "forward_prices_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "pricing_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      inco_terms: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      payment_terms: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          created_at: string
          id: string
          instrument_id: string
          price: number
          price_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrument_id: string
          price: number
          price_date: string
        }
        Update: {
          created_at?: string
          id?: string
          instrument_id?: string
          price?: number
          price_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "pricing_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      price_uploads: {
        Row: {
          error_message: string | null
          file_name: string
          id: string
          row_count: number
          status: string
          upload_date: string
          upload_type: string
          uploaded_by: string
        }
        Insert: {
          error_message?: string | null
          file_name: string
          id?: string
          row_count?: number
          status?: string
          upload_date?: string
          upload_type: string
          uploaded_by: string
        }
        Update: {
          error_message?: string | null
          file_name?: string
          id?: string
          row_count?: number
          status?: string
          upload_date?: string
          upload_type?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      pricing_components: {
        Row: {
          created_at: string
          id: string
          instrument_id: string
          is_positive: boolean | null
          percentage: number
          trade_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrument_id: string
          is_positive?: boolean | null
          percentage: number
          trade_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instrument_id?: string
          is_positive?: boolean | null
          percentage?: number
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_components_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "pricing_instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_components_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_instruments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          unit: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          unit?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          unit?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sustainability: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          base_display_id: string | null
          counterparty: string | null
          created_at: string
          credit_status_id: string | null
          currency_id: string | null
          display_id: string
          end_date: string | null
          formula: string | null
          formula_text: string | null
          id: string
          inco_term_id: string | null
          is_term_deal: boolean | null
          parent_trade_id: string | null
          payment_term_id: string | null
          premium_discount: number | null
          premium_discount_currency_id: string | null
          pricing_adjustment: number | null
          pricing_end_date: string | null
          pricing_instrument_id: string | null
          pricing_period_end: string | null
          pricing_period_start: string | null
          pricing_start_date: string | null
          product_id: string | null
          quantity: number | null
          start_date: string | null
          sustainability_id: string | null
          trade_direction: string
          trade_type: string
          units: string | null
        }
        Insert: {
          base_display_id?: string | null
          counterparty?: string | null
          created_at?: string
          credit_status_id?: string | null
          currency_id?: string | null
          display_id: string
          end_date?: string | null
          formula?: string | null
          formula_text?: string | null
          id?: string
          inco_term_id?: string | null
          is_term_deal?: boolean | null
          parent_trade_id?: string | null
          payment_term_id?: string | null
          premium_discount?: number | null
          premium_discount_currency_id?: string | null
          pricing_adjustment?: number | null
          pricing_end_date?: string | null
          pricing_instrument_id?: string | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          pricing_start_date?: string | null
          product_id?: string | null
          quantity?: number | null
          start_date?: string | null
          sustainability_id?: string | null
          trade_direction?: string
          trade_type: string
          units?: string | null
        }
        Update: {
          base_display_id?: string | null
          counterparty?: string | null
          created_at?: string
          credit_status_id?: string | null
          currency_id?: string | null
          display_id?: string
          end_date?: string | null
          formula?: string | null
          formula_text?: string | null
          id?: string
          inco_term_id?: string | null
          is_term_deal?: boolean | null
          parent_trade_id?: string | null
          payment_term_id?: string | null
          premium_discount?: number | null
          premium_discount_currency_id?: string | null
          pricing_adjustment?: number | null
          pricing_end_date?: string | null
          pricing_instrument_id?: string | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          pricing_start_date?: string | null
          product_id?: string | null
          quantity?: number | null
          start_date?: string | null
          sustainability_id?: string | null
          trade_direction?: string
          trade_type?: string
          units?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_credit_status_id_fkey"
            columns: ["credit_status_id"]
            isOneToOne: false
            referencedRelation: "credit_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_inco_term_id_fkey"
            columns: ["inco_term_id"]
            isOneToOne: false
            referencedRelation: "inco_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_parent_trade_id_fkey"
            columns: ["parent_trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_payment_term_id_fkey"
            columns: ["payment_term_id"]
            isOneToOne: false
            referencedRelation: "payment_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_premium_discount_currency_id_fkey"
            columns: ["premium_discount_currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_sustainability_id_fkey"
            columns: ["sustainability_id"]
            isOneToOne: false
            referencedRelation: "sustainability"
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
