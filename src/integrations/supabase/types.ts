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
      customs_status: {
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
      inspectors: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
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
        Relationships: []
      }
      movement_terminal_assignments: {
        Row: {
          assignment_date: string
          comments: string | null
          created_at: string
          id: string
          movement_id: string
          quantity_mt: number
          sort_order: number | null
          terminal_id: string
          updated_at: string
        }
        Insert: {
          assignment_date: string
          comments?: string | null
          created_at?: string
          id?: string
          movement_id: string
          quantity_mt: number
          sort_order?: number | null
          terminal_id: string
          updated_at?: string
        }
        Update: {
          assignment_date?: string
          comments?: string | null
          created_at?: string
          id?: string
          movement_id?: string
          quantity_mt?: number
          sort_order?: number | null
          terminal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movement_terminal_assignments_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movement_terminal_assignments_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          actual_quantity: number | null
          barge_name: string | null
          barge_orders_checked: boolean | null
          bl_date: string | null
          bl_quantity: number
          buy_sell: string | null
          cash_flow: string | null
          coa_received_checked: boolean | null
          coa_sent_checked: boolean | null
          cod_date: string | null
          comments: string | null
          contract_status: string | null
          counterparty: string | null
          created_at: string
          credit_status: string | null
          customs_status: string | null
          disport: string | null
          disport_inspector: string | null
          ead_checked: boolean | null
          id: string
          inco_term: string | null
          inventory_movement_date: string | null
          load_plan_checked: boolean | null
          loading_period_end: string | null
          loading_period_start: string | null
          loadport: string | null
          loadport_inspector: string | null
          nomination_checked: boolean | null
          nomination_eta: string | null
          nomination_valid: string | null
          parent_trade_id: string | null
          pricing_formula: Json | null
          pricing_type: string | null
          product: string | null
          reference_number: string | null
          scheduled_quantity: number | null
          sort_order: number | null
          status: string | null
          sustainability: string | null
          terminal_id: string | null
          trade_leg_id: string | null
          trade_reference: string | null
          updated_at: string
        }
        Insert: {
          actual_quantity?: number | null
          barge_name?: string | null
          barge_orders_checked?: boolean | null
          bl_date?: string | null
          bl_quantity: number
          buy_sell?: string | null
          cash_flow?: string | null
          coa_received_checked?: boolean | null
          coa_sent_checked?: boolean | null
          cod_date?: string | null
          comments?: string | null
          contract_status?: string | null
          counterparty?: string | null
          created_at?: string
          credit_status?: string | null
          customs_status?: string | null
          disport?: string | null
          disport_inspector?: string | null
          ead_checked?: boolean | null
          id?: string
          inco_term?: string | null
          inventory_movement_date?: string | null
          load_plan_checked?: boolean | null
          loading_period_end?: string | null
          loading_period_start?: string | null
          loadport?: string | null
          loadport_inspector?: string | null
          nomination_checked?: boolean | null
          nomination_eta?: string | null
          nomination_valid?: string | null
          parent_trade_id?: string | null
          pricing_formula?: Json | null
          pricing_type?: string | null
          product?: string | null
          reference_number?: string | null
          scheduled_quantity?: number | null
          sort_order?: number | null
          status?: string | null
          sustainability?: string | null
          terminal_id?: string | null
          trade_leg_id?: string | null
          trade_reference?: string | null
          updated_at?: string
        }
        Update: {
          actual_quantity?: number | null
          barge_name?: string | null
          barge_orders_checked?: boolean | null
          bl_date?: string | null
          bl_quantity?: number
          buy_sell?: string | null
          cash_flow?: string | null
          coa_received_checked?: boolean | null
          coa_sent_checked?: boolean | null
          cod_date?: string | null
          comments?: string | null
          contract_status?: string | null
          counterparty?: string | null
          created_at?: string
          credit_status?: string | null
          customs_status?: string | null
          disport?: string | null
          disport_inspector?: string | null
          ead_checked?: boolean | null
          id?: string
          inco_term?: string | null
          inventory_movement_date?: string | null
          load_plan_checked?: boolean | null
          loading_period_end?: string | null
          loading_period_start?: string | null
          loadport?: string | null
          loadport_inspector?: string | null
          nomination_checked?: boolean | null
          nomination_eta?: string | null
          nomination_valid?: string | null
          parent_trade_id?: string | null
          pricing_formula?: Json | null
          pricing_type?: string | null
          product?: string | null
          reference_number?: string | null
          scheduled_quantity?: number | null
          sort_order?: number | null
          status?: string | null
          sustainability?: string | null
          terminal_id?: string | null
          trade_leg_id?: string | null
          trade_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movements_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_trade_leg_id_fkey"
            columns: ["trade_leg_id"]
            isOneToOne: false
            referencedRelation: "trade_legs"
            referencedColumns: ["id"]
          },
        ]
      }
      open_trades: {
        Row: {
          balance: number | null
          buy_sell: string
          comments: string | null
          contract_status: string | null
          counterparty: string
          created_at: string
          credit_status: string | null
          customs_status: string | null
          disport: string | null
          efp_agreed_status: boolean | null
          efp_designated_month: string | null
          efp_fixed_value: number | null
          efp_premium: number | null
          id: string
          inco_term: string | null
          loading_period_end: string | null
          loading_period_start: string | null
          loadport: string | null
          nominated_value: number | null
          open_quantity: number | null
          parent_trade_id: string | null
          payment_term: string | null
          pricing_formula: Json | null
          pricing_period_end: string | null
          pricing_period_start: string | null
          pricing_type: string | null
          product: string
          quantity: number
          scheduled_quantity: number | null
          sort_order: number | null
          status: string | null
          sustainability: string | null
          tolerance: number | null
          trade_leg_id: string | null
          trade_reference: string
          unit: string | null
          updated_at: string
          vessel_name: string | null
        }
        Insert: {
          balance?: number | null
          buy_sell: string
          comments?: string | null
          contract_status?: string | null
          counterparty: string
          created_at?: string
          credit_status?: string | null
          customs_status?: string | null
          disport?: string | null
          efp_agreed_status?: boolean | null
          efp_designated_month?: string | null
          efp_fixed_value?: number | null
          efp_premium?: number | null
          id?: string
          inco_term?: string | null
          loading_period_end?: string | null
          loading_period_start?: string | null
          loadport?: string | null
          nominated_value?: number | null
          open_quantity?: number | null
          parent_trade_id?: string | null
          payment_term?: string | null
          pricing_formula?: Json | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          pricing_type?: string | null
          product: string
          quantity: number
          scheduled_quantity?: number | null
          sort_order?: number | null
          status?: string | null
          sustainability?: string | null
          tolerance?: number | null
          trade_leg_id?: string | null
          trade_reference: string
          unit?: string | null
          updated_at?: string
          vessel_name?: string | null
        }
        Update: {
          balance?: number | null
          buy_sell?: string
          comments?: string | null
          contract_status?: string | null
          counterparty?: string
          created_at?: string
          credit_status?: string | null
          customs_status?: string | null
          disport?: string | null
          efp_agreed_status?: boolean | null
          efp_designated_month?: string | null
          efp_fixed_value?: number | null
          efp_premium?: number | null
          id?: string
          inco_term?: string | null
          loading_period_end?: string | null
          loading_period_start?: string | null
          loadport?: string | null
          nominated_value?: number | null
          open_quantity?: number | null
          parent_trade_id?: string | null
          payment_term?: string | null
          pricing_formula?: Json | null
          pricing_period_end?: string | null
          pricing_period_start?: string | null
          pricing_type?: string | null
          product?: string
          quantity?: number
          scheduled_quantity?: number | null
          sort_order?: number | null
          status?: string | null
          sustainability?: string | null
          tolerance?: number | null
          trade_leg_id?: string | null
          trade_reference?: string
          unit?: string | null
          updated_at?: string
          vessel_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "open_trades_parent_trade_id_fkey"
            columns: ["parent_trade_id"]
            isOneToOne: false
            referencedRelation: "parent_trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_trades_trade_leg_id_fkey"
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
      tank_movements: {
        Row: {
          assignment_id: string | null
          created_at: string
          customs_status: string | null
          id: string
          movement_date: string
          movement_id: string | null
          product_at_time: string
          quantity_m3: number
          quantity_mt: number
          tank_id: string
          updated_at: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          customs_status?: string | null
          id?: string
          movement_date?: string
          movement_id?: string | null
          product_at_time: string
          quantity_m3?: number
          quantity_mt?: number
          tank_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          customs_status?: string | null
          id?: string
          movement_date?: string
          movement_id?: string | null
          product_at_time?: string
          quantity_m3?: number
          quantity_mt?: number
          tank_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_movement_terminal_assignment"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "movement_terminal_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tank_movements_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tank_movements_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      tanks: {
        Row: {
          capacity_m3: number
          capacity_mt: number
          created_at: string
          current_product: string
          display_order: number | null
          id: string
          is_heating_enabled: boolean | null
          spec: string | null
          tank_number: string
          terminal_id: string
          updated_at: string
        }
        Insert: {
          capacity_m3: number
          capacity_mt: number
          created_at?: string
          current_product: string
          display_order?: number | null
          id?: string
          is_heating_enabled?: boolean | null
          spec?: string | null
          tank_number: string
          terminal_id: string
          updated_at?: string
        }
        Update: {
          capacity_m3?: number
          capacity_mt?: number
          created_at?: string
          current_product?: string
          display_order?: number | null
          id?: string
          is_heating_enabled?: boolean | null
          spec?: string | null
          tank_number?: string
          terminal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tanks_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      terminals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      trade_legs: {
        Row: {
          broker: string | null
          buy_sell: string
          calculated_price: number | null
          comments: string | null
          contract_status: string | null
          created_at: string
          credit_status: string | null
          customs_status: string | null
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
          comments?: string | null
          contract_status?: string | null
          created_at?: string
          credit_status?: string | null
          customs_status?: string | null
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
          comments?: string | null
          contract_status?: string | null
          created_at?: string
          credit_status?: string | null
          customs_status?: string | null
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
      calculate_open_quantity: {
        Args: { total: number; tolerance: number; scheduled: number }
        Returns: number
      }
      fix_all_duplicate_sort_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fix_duplicate_sort_orders: {
        Args: { p_terminal_id: string }
        Returns: undefined
      }
      generate_movement_reference: {
        Args: { trade_ref: string; leg_id: string }
        Returns: string
      }
      initialize_all_terminal_sort_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      initialize_sort_order: {
        Args: { p_table_name: string }
        Returns: undefined
      }
      initialize_terminal_sort_order: {
        Args: { p_terminal_id: string }
        Returns: undefined
      }
      populate_movement_loading_periods: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_sort_order: {
        Args: { p_table_name: string; p_id: string; p_new_sort_order: number }
        Returns: undefined
      }
      update_terminal_sort_order: {
        Args: { p_id: string; p_new_sort_order: number; p_terminal_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
