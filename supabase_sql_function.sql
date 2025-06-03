CREATE OR REPLACE FUNCTION public.filter_movements(p_filters jsonb, p_page integer DEFAULT 1, p_page_size integer DEFAULT 15, p_sort_columns jsonb DEFAULT '[{"column": "sort_order", "direction": "asc"}]'::jsonb)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_count INTEGER;
  v_total_pages INTEGER;
  v_filtered_movements JSON;
  v_pagination_meta JSON;
  v_where_clause TEXT := '';
  v_query TEXT;
  v_order_by TEXT := '';
  v_sort_item JSONB;
BEGIN
  -- Start building the WHERE clause based on filters
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN
    -- Trade Reference filter (text search)
    IF p_filters ? 'tradeReference' AND p_filters->>'tradeReference' IS NOT NULL AND p_filters->>'tradeReference' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('trade_reference ILIKE ''%%'' || %L || ''%%''', p_filters->>'tradeReference');
    END IF;
    
    -- Status filter (array)
    IF p_filters ? 'status' THEN
      IF jsonb_typeof(p_filters->'status') = 'array' AND jsonb_array_length(p_filters->'status') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(status IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'status') || ')))';
      ELSIF p_filters->>'status' IS NOT NULL AND p_filters->>'status' != '' THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          format('status = %L', p_filters->>'status');
      END IF;
    END IF;
    
    -- Buy/Sell filter (array)
    IF p_filters ? 'buySell' THEN
      IF jsonb_typeof(p_filters->'buySell') = 'array' AND jsonb_array_length(p_filters->'buySell') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(buy_sell IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'buySell') || ')))';
      END IF;
    END IF;
    
    -- Product filter (array)
    IF p_filters ? 'product' THEN
      IF jsonb_typeof(p_filters->'product') = 'array' AND jsonb_array_length(p_filters->'product') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(product IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'product') || ')))';
      END IF;
    END IF;
    
    -- Incoterm filter (array)
    IF p_filters ? 'incoTerm' THEN
      IF jsonb_typeof(p_filters->'incoTerm') = 'array' AND jsonb_array_length(p_filters->'incoTerm') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(inco_term IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'incoTerm') || ')))';
      END IF;
    END IF;
    
    -- Sustainability filter (array)
    IF p_filters ? 'sustainability' THEN
      IF jsonb_typeof(p_filters->'sustainability') = 'array' AND jsonb_array_length(p_filters->'sustainability') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(sustainability IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'sustainability') || ')))';
      END IF;
    END IF;
    
    -- Counterparty filter (array)
    IF p_filters ? 'counterparty' THEN
      IF jsonb_typeof(p_filters->'counterparty') = 'array' AND jsonb_array_length(p_filters->'counterparty') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(counterparty IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'counterparty') || ')))';
      END IF;
    END IF;
    
    -- Credit status filter (array)
    IF p_filters ? 'creditStatus' THEN
      IF jsonb_typeof(p_filters->'creditStatus') = 'array' AND jsonb_array_length(p_filters->'creditStatus') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(credit_status IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'creditStatus') || ')))';
      END IF;
    END IF;
    
    -- Customs status filter (array)
    IF p_filters ? 'customsStatus' THEN
      IF jsonb_typeof(p_filters->'customsStatus') = 'array' AND jsonb_array_length(p_filters->'customsStatus') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(customs_status IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'customsStatus') || ')))';
      END IF;
    END IF;
    
    -- Loadport filter (array)
    IF p_filters ? 'loadport' THEN
      IF jsonb_typeof(p_filters->'loadport') = 'array' AND jsonb_array_length(p_filters->'loadport') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(loadport IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'loadport') || ')))';
      END IF;
    END IF;
    
    -- Loadport Inspector filter (array)
    IF p_filters ? 'loadportInspector' THEN
      IF jsonb_typeof(p_filters->'loadportInspector') = 'array' AND jsonb_array_length(p_filters->'loadportInspector') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(loadport_inspector IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'loadportInspector') || ')))';
      END IF;
    END IF;
    
    -- Disport filter (array)
    IF p_filters ? 'disport' THEN
      IF jsonb_typeof(p_filters->'disport') = 'array' AND jsonb_array_length(p_filters->'disport') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(disport IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'disport') || ')))';
      END IF;
    END IF;
    
    -- Disport Inspector filter (array)
    IF p_filters ? 'disportInspector' THEN
      IF jsonb_typeof(p_filters->'disportInspector') = 'array' AND jsonb_array_length(p_filters->'disportInspector') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(disport_inspector IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'disportInspector') || ')))';
      END IF;
    END IF;
    
    -- Loading period start date range filters
    IF p_filters ? 'loadingPeriodStartFrom' AND p_filters->>'loadingPeriodStartFrom' IS NOT NULL AND p_filters->>'loadingPeriodStartFrom' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('loading_period_start >= %L::date', p_filters->>'loadingPeriodStartFrom');
    END IF;
    
    IF p_filters ? 'loadingPeriodStartTo' AND p_filters->>'loadingPeriodStartTo' IS NOT NULL AND p_filters->>'loadingPeriodStartTo' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('loading_period_start <= %L::date', p_filters->>'loadingPeriodStartTo');
    END IF;
    
    -- Loading period end date range filters
    IF p_filters ? 'loadingPeriodEndFrom' AND p_filters->>'loadingPeriodEndFrom' IS NOT NULL AND p_filters->>'loadingPeriodEndFrom' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('loading_period_end >= %L::date', p_filters->>'loadingPeriodEndFrom');
    END IF;
    
    IF p_filters ? 'loadingPeriodEndTo' AND p_filters->>'loadingPeriodEndTo' IS NOT NULL AND p_filters->>'loadingPeriodEndTo' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('loading_period_end <= %L::date', p_filters->>'loadingPeriodEndTo');
    END IF;

    -- Nomination ETA filter
    IF p_filters ? 'nominationEtaFrom' AND p_filters->>'nominationEtaFrom' IS NOT NULL AND p_filters->>'nominationEtaFrom' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('nomination_eta >= %L::timestamp', p_filters->>'nominationEtaFrom');
    END IF;
    
    IF p_filters ? 'nominationEtaTo' AND p_filters->>'nominationEtaTo' IS NOT NULL AND p_filters->>'nominationEtaTo' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('nomination_eta <= %L::timestamp', p_filters->>'nominationEtaTo');
    END IF;

    -- Nomination Valid filter
    IF p_filters ? 'nominationValidFrom' AND p_filters->>'nominationValidFrom' IS NOT NULL AND p_filters->>'nominationValidFrom' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('nomination_valid >= %L::timestamp', p_filters->>'nominationValidFrom');
    END IF;
    
    IF p_filters ? 'nominationValidTo' AND p_filters->>'nominationValidTo' IS NOT NULL AND p_filters->>'nominationValidTo' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('nomination_valid <= %L::timestamp', p_filters->>'nominationValidTo');
    END IF;

    -- Cash Flow filter
    IF p_filters ? 'cashFlowFrom' AND p_filters->>'cashFlowFrom' IS NOT NULL AND p_filters->>'cashFlowFrom' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('cash_flow >= %L::date', p_filters->>'cashFlowFrom');
    END IF;
    
    IF p_filters ? 'cashFlowTo' AND p_filters->>'cashFlowTo' IS NOT NULL AND p_filters->>'cashFlowTo' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('cash_flow <= %L::date', p_filters->>'cashFlowTo');
    END IF;

    -- BL Date filter
    IF p_filters ? 'blDateFrom' AND p_filters->>'blDateFrom' IS NOT NULL AND p_filters->>'blDateFrom' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('bl_date >= %L::date', p_filters->>'blDateFrom');
    END IF;
    
    IF p_filters ? 'blDateTo' AND p_filters->>'blDateTo' IS NOT NULL AND p_filters->>'blDateTo' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('bl_date <= %L::date', p_filters->>'blDateTo');
    END IF;

    -- COD Date filter
    IF p_filters ? 'codDateFrom' AND p_filters->>'codDateFrom' IS NOT NULL AND p_filters->>'codDateFrom' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('cod_date >= %L::date', p_filters->>'codDateFrom');
    END IF;
    
    IF p_filters ? 'codDateTo' AND p_filters->>'codDateTo' IS NOT NULL AND p_filters->>'codDateTo' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('cod_date <= %L::date', p_filters->>'codDateTo');
    END IF;
  END IF;
  
  -- Add base filter to exclude transfers and reconciliations
  IF v_where_clause = '' THEN
    v_where_clause := ' WHERE product NOT IN (''Transfer'', ''RECONCILIATION'')';
  ELSE
    v_where_clause := v_where_clause || ' AND product NOT IN (''Transfer'', ''RECONCILIATION'')';
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
      
      -- Map frontend column names to database column names
      DECLARE
        column_name TEXT;
      BEGIN
        column_name := v_sort_item->>'column';
        
        -- Map any frontend column names that differ from database column names
        IF column_name = 'nominationEta' THEN
          column_name := 'nomination_eta';
        ELSIF column_name = 'nominationValid' THEN
          column_name := 'nomination_valid';
        ELSIF column_name = 'cashFlow' THEN
          column_name := 'cash_flow';
        ELSIF column_name = 'blDate' THEN
          column_name := 'bl_date';
        ELSIF column_name = 'codDate' THEN
          column_name := 'cod_date';
        END IF;
        
        -- Add the sort column and direction
        v_order_by := v_order_by || format('%I %s', 
                                       column_name, 
                                       CASE WHEN upper(v_sort_item->>'direction') = 'DESC' THEN 'DESC' ELSE 'ASC' END);
      END;
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
  v_query := 'SELECT COUNT(*) FROM movements' || v_where_clause;
  
  EXECUTE v_query INTO v_total_count;
  
  -- Calculate total pages
  v_total_pages := CEIL(v_total_count::FLOAT / p_page_size);
  
  -- Query for the filtered and paginated data
  IF v_total_count > 0 THEN
    v_query := 'SELECT json_agg(t) FROM (SELECT * FROM movements' || 
              v_where_clause || 
              v_order_by || 
              format(' LIMIT %s OFFSET %s', p_page_size, (p_page - 1) * p_page_size) ||
              ') t';
    
    EXECUTE v_query INTO v_filtered_movements;
  ELSE
    -- If no results, return empty JSON array
    v_filtered_movements := '[]'::json;
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
    'movements', COALESCE(v_filtered_movements, '[]'::json),
    'pagination', v_pagination_meta
  );
END;
$function$;

-- Function to filter physical MTM positions with sorting by trade leg creation date
CREATE OR REPLACE FUNCTION public.filter_physical_mtm_positions(
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 15,
  p_sort_columns jsonb DEFAULT '[{"column": "created_at", "direction": "desc"}]'::jsonb
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_count INTEGER;
  v_total_pages INTEGER;
  v_filtered_positions JSON;
  v_pagination_meta JSON;
  v_where_clause TEXT := '';
  v_query TEXT;
  v_order_by TEXT := '';
  v_sort_item JSONB;
BEGIN
  -- Start building the WHERE clause based on filters
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN
    -- Trade Reference filter (text search)
    IF p_filters ? 'tradeReference' AND p_filters->>'tradeReference' IS NOT NULL AND p_filters->>'tradeReference' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('p.trade_reference ILIKE ''%%'' || %L || ''%%''', p_filters->>'tradeReference');
    END IF;
    
    -- Product filter (array)
    IF p_filters ? 'product' THEN
      IF jsonb_typeof(p_filters->'product') = 'array' AND jsonb_array_length(p_filters->'product') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(p.product IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'product') || ')))';
      END IF;
    END IF;
    
    -- Buy/Sell filter (array)
    IF p_filters ? 'buySell' THEN
      IF jsonb_typeof(p_filters->'buySell') = 'array' AND jsonb_array_length(p_filters->'buySell') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(p.buy_sell IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'buySell') || ')))';
      END IF;
    END IF;
    
    -- Physical Type filter (array)
    IF p_filters ? 'physicalType' THEN
      IF jsonb_typeof(p_filters->'physicalType') = 'array' AND jsonb_array_length(p_filters->'physicalType') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(p.physical_type IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'physicalType') || ')))';
      END IF;
    END IF;
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
      
      -- Map frontend column names to database column names
      DECLARE
        column_name TEXT;
      BEGIN
        column_name := v_sort_item->>'column';
        
        -- Map column names - use leg creation date for sorting
        IF column_name = 'created_at' OR column_name = 'leg_created_at' THEN
          column_name := 'tl.created_at';
        ELSIF column_name = 'calculated_at' THEN
          column_name := 'p.calculated_at';
        ELSIF column_name = 'trade_reference' THEN
          column_name := 'p.trade_reference';
        ELSIF column_name = 'product' THEN
          column_name := 'p.product';
        ELSIF column_name = 'buy_sell' THEN
          column_name := 'p.buy_sell';
        ELSIF column_name = 'mtm_value' THEN
          column_name := 'p.mtm_value';
        ELSE
          column_name := 'tl.created_at'; -- Default fallback to leg creation date
        END IF;
        
        -- Add the sort column and direction
        v_order_by := v_order_by || format('%s %s', 
                                       column_name, 
                                       CASE WHEN upper(v_sort_item->>'direction') = 'DESC' THEN 'DESC' ELSE 'ASC' END);
      END;
    END LOOP;
  ELSE
    -- Default sort order by trade leg creation date (most recent first)
    v_order_by := ' ORDER BY tl.created_at DESC';
  END IF;
  
  -- First, count total filtered records
  v_query := 'SELECT COUNT(*) FROM physical_mtm_positions p 
              INNER JOIN trade_legs tl ON p.leg_id = tl.id' || v_where_clause;
  
  EXECUTE v_query INTO v_total_count;
  
  -- Calculate total pages
  v_total_pages := CEIL(v_total_count::FLOAT / p_page_size);
  
  -- Query for the filtered and paginated data with explicit column selection
  IF v_total_count > 0 THEN
    v_query := 'SELECT json_agg(t) FROM (
                  SELECT 
                    p.id,
                    p.leg_id,
                    p.trade_reference,
                    p.leg_reference,
                    p.physical_type,
                    p.buy_sell,
                    p.product,
                    p.quantity,
                    p.pricing_period_start,
                    p.pricing_period_end,
                    p.pricing_type,
                    p.period_type,
                    p.trade_price,
                    p.mtm_price,
                    p.mtm_value,
                    p.efp_premium,
                    p.efp_agreed_status,
                    p.efp_fixed_value,
                    p.mtm_future_month,
                    p.calculated_at,
                    p.created_at,
                    p.updated_at
                  FROM physical_mtm_positions p 
                  INNER JOIN trade_legs tl ON p.leg_id = tl.id' || 
              v_where_clause || 
              v_order_by || 
              format(' LIMIT %s OFFSET %s', p_page_size, (p_page - 1) * p_page_size) ||
              ') t';
    
    EXECUTE v_query INTO v_filtered_positions;
  ELSE
    -- If no results, return empty JSON array
    v_filtered_positions := '[]'::json;
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
    'positions', COALESCE(v_filtered_positions, '[]'::json),
    'pagination', v_pagination_meta
  );
END;
$function$;

-- Function to filter paper MTM positions with sorting by paper trade leg creation date
CREATE OR REPLACE FUNCTION public.filter_paper_mtm_positions(
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 15,
  p_sort_columns jsonb DEFAULT '[{"column": "created_at", "direction": "desc"}]'::jsonb
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_count INTEGER;
  v_total_pages INTEGER;
  v_filtered_positions JSON;
  v_pagination_meta JSON;
  v_where_clause TEXT := '';
  v_query TEXT;
  v_order_by TEXT := '';
  v_sort_item JSONB;
BEGIN
  -- Start building the WHERE clause based on filters
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN
    -- Trade Reference filter (text search)
    IF p_filters ? 'tradeReference' AND p_filters->>'tradeReference' IS NOT NULL AND p_filters->>'tradeReference' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('p.trade_reference ILIKE ''%%'' || %L || ''%%''', p_filters->>'tradeReference');
    END IF;
    
    -- Product filter (array)
    IF p_filters ? 'product' THEN
      IF jsonb_typeof(p_filters->'product') = 'array' AND jsonb_array_length(p_filters->'product') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(p.product IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'product') || ')))';
      END IF;
    END IF;
    
    -- Buy/Sell filter (array)
    IF p_filters ? 'buySell' THEN
      IF jsonb_typeof(p_filters->'buySell') = 'array' AND jsonb_array_length(p_filters->'buySell') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(p.buy_sell IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'buySell') || ')))';
      END IF;
    END IF;
    
    -- Relationship Type filter (array)
    IF p_filters ? 'relationshipType' THEN
      IF jsonb_typeof(p_filters->'relationshipType') = 'array' AND jsonb_array_length(p_filters->'relationshipType') > 0 THEN
        v_where_clause := v_where_clause || 
          CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
          '(p.relationship_type IN (SELECT jsonb_array_elements_text(' || quote_literal(p_filters->'relationshipType') || ')))';
      END IF;
    END IF;
    
    -- Period filter (string)
    IF p_filters ? 'period' AND p_filters->>'period' IS NOT NULL AND p_filters->>'period' != '' THEN
      v_where_clause := v_where_clause || 
        CASE WHEN v_where_clause = '' THEN ' WHERE ' ELSE ' AND ' END ||
        format('p.period = %L', p_filters->>'period');
    END IF;
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
      
      -- Map frontend column names to database column names
      DECLARE
        column_name TEXT;
      BEGIN
        column_name := v_sort_item->>'column';
        
        -- Map column names - use leg creation date for sorting
        IF column_name = 'created_at' OR column_name = 'leg_created_at' THEN
          column_name := 'ptl.created_at';
        ELSIF column_name = 'calculated_at' THEN
          column_name := 'p.calculated_at';
        ELSIF column_name = 'trade_reference' THEN
          column_name := 'p.trade_reference';
        ELSIF column_name = 'product' THEN
          column_name := 'p.product';
        ELSIF column_name = 'buy_sell' THEN
          column_name := 'p.buy_sell';
        ELSIF column_name = 'mtm_value' THEN
          column_name := 'p.mtm_value';
        ELSIF column_name = 'period' THEN
          column_name := 'p.period';
        ELSE
          column_name := 'ptl.created_at'; -- Default fallback to leg creation date
        END IF;
        
        -- Add the sort column and direction
        v_order_by := v_order_by || format('%s %s', 
                                       column_name, 
                                       CASE WHEN upper(v_sort_item->>'direction') = 'DESC' THEN 'DESC' ELSE 'ASC' END);
      END;
    END LOOP;
  ELSE
    -- Default sort order by paper trade leg creation date (most recent first)
    v_order_by := ' ORDER BY ptl.created_at DESC';
  END IF;
  
  -- First, count total filtered records
  v_query := 'SELECT COUNT(*) FROM paper_mtm_positions p 
              INNER JOIN paper_trade_legs ptl ON p.leg_id = ptl.id' || v_where_clause;
  
  EXECUTE v_query INTO v_total_count;
  
  -- Calculate total pages
  v_total_pages := CEIL(v_total_count::FLOAT / p_page_size);
  
  -- Query for the filtered and paginated data with explicit column selection
  IF v_total_count > 0 THEN
    v_query := 'SELECT json_agg(t) FROM (
                  SELECT 
                    p.id,
                    p.leg_id,
                    p.trade_reference,
                    p.leg_reference,
                    p.buy_sell,
                    p.product,
                    p.quantity,
                    p.period,
                    p.relationship_type,
                    p.period_type,
                    p.trade_price,
                    p.mtm_price,
                    p.mtm_value,
                    p.right_side,
                    p.calculated_at,
                    p.created_at,
                    p.updated_at
                  FROM paper_mtm_positions p 
                  INNER JOIN paper_trade_legs ptl ON p.leg_id = ptl.id' || 
              v_where_clause || 
              v_order_by || 
              format(' LIMIT %s OFFSET %s', p_page_size, (p_page - 1) * p_page_size) ||
              ') t';
    
    EXECUTE v_query INTO v_filtered_positions;
  ELSE
    -- If no results, return empty JSON array
    v_filtered_positions := '[]'::json;
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
    'positions', COALESCE(v_filtered_positions, '[]'::json),
    'pagination', v_pagination_meta
  );
END;
$function$;
