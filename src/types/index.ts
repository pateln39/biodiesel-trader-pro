
// Re-export all types for convenience
export * from './storage';

export interface Movement {
  id: string;
  assignment_id?: string;
  assignment_quantity?: number;
  assignment_date?: string;
  terminal_comments?: string;
  sort_order?: number;
  buy_sell?: string;
  customs_status?: string;
  counterparty?: string;
  trade_reference?: string;
  barge_name?: string;
  nomination_valid?: string;
  sustainability?: string;
  product?: string;
  created_at: string;
}
