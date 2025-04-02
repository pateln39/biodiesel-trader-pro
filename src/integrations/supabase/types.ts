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
      audit_logs: {
        Row: {
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string
          table_name: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id: string
          table_name: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      brokers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      counterparties: {
        Row: {
          bank_details: Json | null
          contact_details: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          bank_details?: Json | null
          contact_details?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          bank_details?: Json | null
          contact_details?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          vat_number?: string | null
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
      forward_prices: {
        Row: {
          created_at: string
          forward_month: string
          id: string
          instrument_id: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          forward_month: string
          id?: string
          instrument_id: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          forward_month?: string
          id?: string
          instrument_id?: string
          price?: number
          updated_at?: string
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
      historical_prices: {
        Row: {
          created_at: string
          id: string
          instrument_id: string
          price: number
          price_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrument_id: string
          price: number
          price_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instrument_id?: string
          price?: number
          price_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "historical_prices_instrument_id_fkey"
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
      invoices: {
        Row: {
          amount: number
          calculated_price: number | null
          comments: string | null
          created_at: string
          currency: string
          due_date: string
          id: string
          invoice_date: string
          invoice_reference: string
          invoice_type: string
          movement_id: string | null
          quantity: number | null
          status: string
          total_amount: number | null
          updated_at: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          amount: number
          calculated_price?: number | null
          comments?: string | null
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          invoice_date: string
          invoice_reference: string
          invoice_type: string
          movement_id?: string | null
          quantity?: number | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          calculated_price?: number | null
          comments?: string | null
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_reference?: string
          invoice_type?: string
          movement_id?: string | null
          quantity?: number | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          actualized: boolean | null
          actualized_date: string | null
          actualized_quantity: number | null
          bl_date: string | null
          bl_quantity: number | null
          cash_flow_date: string | null
          comments: string | null
          created_at: string
          disport: string | null
          id: string
          inspector: string | null
          loadport: string | null
          movement_reference: string
          nominated_date: string | null
          nomination_valid_date: string | null
          status: string
          trade_leg_id: string | null
          updated_at: string
          vessel_name: string | null
        }
        Insert: {
          actualized?: boolean | null
          actualized_date?: string | null
          actualized_quantity?: number | null
          bl_date?: string | null
          bl_quantity?: number | null
          cash_flow_date?: string | null
          comments?: string | null
          created_at?: string
          disport?: string | null
          id?: string
          inspector?: string | null
          loadport?: string | null
          movement_reference: string
          nominated_date?: string | null
          nomination_valid_date?: string | null
          status: string
          trade_leg_id?: string | null
          updated_at?: string
          vessel_name?: string | null
        }
        Update: {
          actualized?: boolean | null
          actualized_date?: string | null
          actualized_quantity?: number | null
          bl_date?: string | null
          bl_quantity?: number | null
          cash_flow_date?: string | null
          comments?: string | null
          created_at?: string
          disport?: string | null
          id?: string
          inspector?: string | null
          loadport?: string | null
          movement_reference?: string
          nominated_date?: string | null
          nomination_valid_date?: string | null
          status?: string
          trade_leg_id?: string | null
          updated_at?: string
          vessel_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movements_trade_leg_id_fkey"
            columns: ["trade_leg_id"]
            isOneToOne: false
            referencedRelation: "trade_legs"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_trade_legs: {
        Row: {
          broker: string | null
          buy_sell: string
          created_at: string
          exposures: Json | null
          formula: Json | null
          id: string
          instrument: string | null
          leg_reference: string
          mtm_formula: Json | null
          paper_trade_id: string
          period: string | null
          price: number | null
          pricing_period_end: string | null
          pricing_period_start: string | null
          product: string
          quantity: number
          trading_period: string | null
          updated_at: string
        }
        Insert: {
          broker?: string | null
          buy_sell: string
          created_at?: string
          exposures?: Json | null
          formula?: Json | null
          id?: string
          instrument?: string | null
          leg_reference: string
          mtm_formula?: Json | null
          paper_trade_id: string
          period?: string | null
          price?: number | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          product: string
          quantity: number
          trading_period?: string | null
          updated_at?: string
        }
        Update: {
          broker?: string | null
          buy_sell?: string
          created_at?: string
          exposures?: Json | null
          formula?: Json | null
          id?: string
          instrument?: string | null
          leg_reference?: string
          mtm_formula?: Json | null
          paper_trade_id?: string
          period?: string | null
          price?: number | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          product?: string
          quantity?: number
          trading_period?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_trade_legs_paper_trade_id_fkey"
            columns: ["paper_trade_id"]
            isOneToOne: false
            referencedRelation: "paper_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_trade_products: {
        Row: {
          base_product: string | null
          category: string
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          paired_product: string | null
          product_code: string
        }
        Insert: {
          base_product?: string | null
          category: string
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          paired_product?: string | null
          product_code: string
        }
        Update: {
          base_product?: string | null
          category?: string
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          paired_product?: string | null
          product_code?: string
        }
        Relationships: []
      }
      paper_trades: {
        Row: {
          broker: string | null
          counterparty: string
          created_at: string
          id: string
          trade_reference: string
          updated_at: string
        }
        Insert: {
          broker?: string | null
          counterparty: string
          created_at?: string
          id?: string
          trade_reference: string
          updated_at?: string
        }
        Update: {
          broker?: string | null
          counterparty?: string
          created_at?: string
          id?: string
          trade_reference?: string
          updated_at?: string
        }
        Relationships: []
      }
      parent_trades: {
        Row: {
          counterparty: string
          created_at: string
          id: string
          physical_type: string | null
          trade_reference: string
          trade_type: string
          updated_at: string
        }
        Insert: {
          counterparty: string
          created_at?: string
          id?: string
          physical_type?: string | null
          trade_reference: string
          trade_type: string
          updated_at?: string
        }
        Update: {
          counterparty?: string
          created_at?: string
          id?: string
          physical_type?: string | null
          trade_reference?: string
          trade_type?: string
          updated_at?: string
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
      payments: {
        Row: {
          amount: number
          comments: string | null
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          payment_date: string
          payment_method: string | null
          payment_reference: string
          updated_at: string
        }
        Insert: {
          amount: number
          comments?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          payment_date: string
          payment_method?: string | null
          payment_reference: string
          updated_at?: string
        }
        Update: {
          amount?: number
          comments?: string | null
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_reference?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_instruments: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          instrument_code: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          instrument_code: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          instrument_code?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      product_relationships: {
        Row: {
          created_at: string | null
          default_opposite: string | null
          id: string
          paired_product: string | null
          product: string
          relationship_type: string
        }
        Insert: {
          created_at?: string | null
          default_opposite?: string | null
          id?: string
          paired_product?: string | null
          product: string
          relationship_type: string
        }
        Update: {
          created_at?: string | null
          default_opposite?: string | null
          id?: string
          paired_product?: string | null
          product?: string
          relationship_type?: string
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
      trade_legs: {
        Row: {
          broker: string | null
          buy_sell: string
          calculated_price: number | null
          created_at: string
          credit_status: string | null
          efp_agreed_status: boolean | null
          efp_designated_month: string | null
          efp_fixed_value: number | null
          efp_premium: number | null
          exposures: Json | null
          id: string
          inco_term: string | null
          instrument: string | null
          last_calculation_date: string | null
          leg_reference: string
          loading_period_end: string | null
          loading_period_start: string | null
          mtm_calculated_price: number | null
          mtm_formula: Json | null
          mtm_future_month: string | null
          mtm_last_calculation_date: string | null
          parent_trade_id: string
          payment_term: string | null
          price: number | null
          pricing_formula: Json | null
          pricing_period_end: string | null
          pricing_period_start: string | null
          pricing_type: string | null
          product: string
          quantity: number
          sustainability: string | null
          tolerance: number | null
          trading_period: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          broker?: string | null
          buy_sell: string
          calculated_price?: number | null
          created_at?: string
          credit_status?: string | null
          efp_agreed_status?: boolean | null
          efp_designated_month?: string | null
          efp_fixed_value?: number | null
          efp_premium?: number | null
          exposures?: Json | null
          id?: string
          inco_term?: string | null
          instrument?: string | null
          last_calculation_date?: string | null
          leg_reference: string
          loading_period_end?: string | null
          loading_period_start?: string | null
          mtm_calculated_price?: number | null
          mtm_formula?: Json | null
          mtm_future_month?: string | null
          mtm_last_calculation_date?: string | null
          parent_trade_id: string
          payment_term?: string | null
          price?: number | null
          pricing_formula?: Json | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          pricing_type?: string | null
          product: string
          quantity: number
          sustainability?: string | null
          tolerance?: number | null
          trading_period?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          broker?: string | null
          buy_sell?: string
          calculated_price?: number | null
          created_at?: string
          credit_status?: string | null
          efp_agreed_status?: boolean | null
          efp_designated_month?: string | null
          efp_fixed_value?: number | null
          efp_premium?: number | null
          exposures?: Json | null
          id?: string
          inco_term?: string | null
          instrument?: string | null
          last_calculation_date?: string | null
          leg_reference?: string
          loading_period_end?: string | null
          loading_period_start?: string | null
          mtm_calculated_price?: number | null
          mtm_formula?: Json | null
          mtm_future_month?: string | null
          mtm_last_calculation_date?: string | null
          parent_trade_id?: string
          payment_term?: string | null
          price?: number | null
          pricing_formula?: Json | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          pricing_type?: string | null
          product?: string
          quantity?: number
          sustainability?: string | null
          tolerance?: number | null
          trading_period?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_legs_parent_trade_id_fkey"
            columns: ["parent_trade_id"]
            isOneToOne: false
            referencedRelation: "parent_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_periods: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          period_code: string
          period_type: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          period_code: string
          period_type: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          period_code?: string
          period_type?: string
          start_date?: string
        }
        Relationships: []
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
