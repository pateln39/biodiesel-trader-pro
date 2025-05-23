
-- Update the filter_open_trades function to handle multi-column sorting
CREATE OR REPLACE FUNCTION public.filter_open_trades(
  p_filters jsonb,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 15,
  p_sort_columns jsonb DEFAULT '[{"column": "sort_order", "direction": "asc"}]'::jsonb
) 
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_count INTEGER;
  v_total_pages INTEGER;
  v_filtered_trades JSON;
  v_pagination_meta JSON;
  v_where_clause TEXT := '';
  v_query TEXT;
  v_order_by TEXT := '';
  v_sort_item JSONB;
BEGIN
  -- Start building the WHERE clause based on filters
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN
    -- Trade reference filter
    IF p_filters ? 'trade_reference' AND p_filters->>'trade_reference' IS NOT NULL AND p_filters->>'trade_reference' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('trade_reference ILIKE ''%%'' || %L || ''%%''', p_filters->>'trade_reference');
    END IF;
    
    -- Buy/sell filter
    IF p_filters ? 'buy_sell' AND p_filters->>'buy_sell' IS NOT NULL AND p_filters->>'buy_sell' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('buy_sell = %L', p_filters->>'buy_sell');
    END IF;
    
    -- Product filter (handle as array for multi-select)
    IF p_filters ? 'product' THEN
      IF jsonb_typeof(p_filters->'product') = 'array' AND jsonb_array_length(p_filters->'product') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(product IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'product') || ')))';
      ELSIF p_filters->>'product' IS NOT NULL AND p_filters->>'product' != '' THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          format('product ILIKE ''%%'' || %L || ''%%''', p_filters->>'product');
      END IF;
    END IF;
    
    -- Counterparty filter (handle as array for multi-select)
    IF p_filters ? 'counterparty' THEN
      IF jsonb_typeof(p_filters->'counterparty') = 'array' AND jsonb_array_length(p_filters->'counterparty') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(counterparty IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'counterparty') || ')))';
      ELSIF p_filters->>'counterparty' IS NOT NULL AND p_filters->>'counterparty' != '' THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          format('counterparty ILIKE ''%%'' || %L || ''%%''', p_filters->>'counterparty');
      END IF;
    END IF;
    
    -- Incoterm filter (handle as array for multi-select)
    IF p_filters ? 'inco_term' THEN
      IF jsonb_typeof(p_filters->'inco_term') = 'array' AND jsonb_array_length(p_filters->'inco_term') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(inco_term IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'inco_term') || ')))';
      ELSIF p_filters->>'inco_term' IS NOT NULL AND p_filters->>'inco_term' != '' THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          format('inco_term = %L', p_filters->>'inco_term');
      END IF;
    END IF;
    
    -- Sustainability filter (handle as array for multi-select)
    IF p_filters ? 'sustainability' THEN
      IF jsonb_typeof(p_filters->'sustainability') = 'array' AND jsonb_array_length(p_filters->'sustainability') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(sustainability IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'sustainability') || ')))';
      ELSIF p_filters->>'sustainability' IS NOT NULL AND p_filters->>'sustainability' != '' THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          format('sustainability = %L', p_filters->>'sustainability');
      END IF;
    END IF;
    
    -- Credit status filter (handle as array for multi-select)
    IF p_filters ? 'credit_status' THEN
      IF jsonb_typeof(p_filters->'credit_status') = 'array' AND jsonb_array_length(p_filters->'credit_status') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(credit_status IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'credit_status') || ')))';
      ELSIF p_filters->>'credit_status' IS NOT NULL AND p_filters->>'credit_status' != '' THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          format('credit_status = %L', p_filters->>'credit_status');
      END IF;
    END IF;
    
    -- Customs status filter (handle as array for multi-select)
    IF p_filters ? 'customs_status' THEN
      IF jsonb_typeof(p_filters->'customs_status') = 'array' AND jsonb_array_length(p_filters->'customs_status') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(customs_status IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'customs_status') || ')))';
      ELSIF p_filters->>'customs_status' IS NOT NULL AND p_filters->>'customs_status' != '' THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          format('customs_status = %L', p_filters->>'customs_status');
      END IF;
    END IF;
    
    -- Contract status filter (handle as array for multi-select)
    IF p_filters ? 'contract_status' THEN
      IF jsonb_typeof(p_filters->'contract_status') = 'array' AND jsonb_array_length(p_filters->'contract_status') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(contract_status IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'contract_status') || ')))';
      ELSIF p_filters->>'contract_status' IS NOT NULL AND p_filters->>'contract_status' != '' THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          format('contract_status = %L', p_filters->>'contract_status');
      END IF;
    END IF;
    
    -- Pricing type filter
    IF p_filters ? 'pricing_type' AND p_filters->>'pricing_type' IS NOT NULL AND p_filters->>'pricing_type' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('pricing_type = %L', p_filters->>'pricing_type');
    END IF;
    
    -- Loading period start date range filters
    IF p_filters ? 'loading_period_start_from' AND p_filters->>'loading_period_start_from' IS NOT NULL AND p_filters->>'loading_period_start_from' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('loading_period_start >= %L::date', p_filters->>'loading_period_start_from');
    END IF;
    
    IF p_filters ? 'loading_period_start_to' AND p_filters->>'loading_period_start_to' IS NOT NULL AND p_filters->>'loading_period_start_to' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('loading_period_start <= %L::date', p_filters->>'loading_period_start_to');
    END IF;
    
    -- Loading period end date range filters
    IF p_filters ? 'loading_period_end_from' AND p_filters->>'loading_period_end_from' IS NOT NULL AND p_filters->>'loading_period_end_from' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('loading_period_end >= %L::date', p_filters->>'loading_period_end_from');
    END IF;
    
    IF p_filters ? 'loading_period_end_to' AND p_filters->>'loading_period_end_to' IS NOT NULL AND p_filters->>'loading_period_end_to' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('loading_period_end <= %L::date', p_filters->>'loading_period_end_to');
    END IF;
    
    -- Status filter (all, in-process, completed)
    IF p_filters ? 'status' AND p_filters->>'status' IS NOT NULL AND p_filters->>'status' != '' AND p_filters->>'status' != 'all' THEN
      IF p_filters->>'status' = 'in-process' THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(balance IS NULL OR balance > 0)';
      ELSIF p_filters->>'status' = 'completed' THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          'balance <= 0';
      END IF;
    END IF;
  END IF;
  
  -- Add status = 'open' constraint if not already specified
  IF v_where_clause = '' THEN
    v_where_clause := ' WHERE status = ''open''';
  ELSE
    v_where_clause := v_where_clause || ' AND status = ''open''';
  END IF;
  
  -- Build the ORDER BY clause from the sort columns array
  IF p_sort_columns IS NOT NULL AND jsonb_typeof(p_sort_columns) = 'array' AND jsonb_array_length(p_sort_columns) > 0 THEN
    v_order_by := ' ORDER BY ';
    
    FOR i IN 0..jsonb_array_length(p_sort_columns) - 1 LOOP
      v_sort_item := p_sort_columns->i;
      
      -- Add comma if not the first sort column
      IF i > 0 THEN
        v_order_by := v_order_by || ', ';
      END IF;
      
      -- Add the sort column and direction
      v_order_by := v_order_by || format('%I %s', 
                                     v_sort_item->>'column', 
                                     CASE WHEN upper(v_sort_item->>'direction') = 'DESC' THEN 'DESC' ELSE 'ASC' END);
    END LOOP;
    
    -- Add sort_order as a tie-breaker if it's not already included
    IF NOT v_order_by ~ 'sort_order' THEN
      v_order_by := v_order_by || ', sort_order ASC';
    END IF;
  ELSE
    -- Default sort order
    v_order_by := ' ORDER BY sort_order ASC, created_at DESC';
  END IF;
  
  -- First, count total filtered records
  v_query := 'SELECT COUNT(*) FROM open_trades' || v_where_clause;
  
  EXECUTE v_query INTO v_total_count;
  
  -- Calculate total pages
  v_total_pages := CEIL(v_total_count::FLOAT / p_page_size);
  
  -- Query for the filtered and paginated data
  IF v_total_count > 0 THEN
    v_query := 'SELECT json_agg(t) FROM (SELECT * FROM open_trades' || 
              v_where_clause || 
              v_order_by || 
              format(' LIMIT %s OFFSET %s', p_page_size, (p_page - 1) * p_page_size) ||
              ') t';
    
    EXECUTE v_query INTO v_filtered_trades;
  ELSE
    -- If no results, return empty JSON array
    v_filtered_trades := '[]'::json;
  END IF;
  
  -- Create pagination metadata
  v_pagination_meta := json_build_object(
    'totalItems', v_total_count,
    'totalPages', GREATEST(v_total_pages, 1),
    'currentPage', p_page,
    'pageSize', p_page_size
  );
  
  -- Return combined result
  RETURN json_build_object(
    'trades', COALESCE(v_filtered_trades, '[]'::json),
    'pagination', v_pagination_meta
  );
END;
$function$;
