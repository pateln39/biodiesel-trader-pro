
// This file contains the SQL functions used for the dashboard aggregates
// These are for reference and documentation only - the actual functions are created in the database

/*
-- Function to get physical positions by month and product
CREATE OR REPLACE FUNCTION public.get_physical_positions_by_month()
RETURNS TABLE (
  month text,
  product text,
  position_value numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH physical_trades AS (
    SELECT 
      tl.id,
      tl.product,
      tl.loading_period_start,
      tl.buy_sell,
      tl.quantity
    FROM 
      trade_legs tl
      JOIN parent_trades pt ON tl.parent_trade_id = pt.id
    WHERE 
      pt.trade_type = 'physical'
      AND tl.loading_period_start IS NOT NULL
  )
  SELECT 
    to_char(date_trunc('month', loading_period_start), 'Mon YY') AS month,
    product,
    SUM(CASE WHEN buy_sell = 'buy' THEN quantity ELSE -quantity END) AS position_value
  FROM 
    physical_trades
  GROUP BY 
    date_trunc('month', loading_period_start), product
  ORDER BY 
    date_trunc('month', loading_period_start), product;
END;
$$;

-- Function to get physical positions by month with product columns (pivoted)
CREATE OR REPLACE FUNCTION public.get_physical_positions_pivoted()
RETURNS TABLE (
  month text,
  products jsonb
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH position_data AS (
    SELECT 
      to_char(date_trunc('month', tl.loading_period_start), 'Mon YY') AS month,
      tl.product,
      SUM(CASE WHEN tl.buy_sell = 'buy' THEN tl.quantity ELSE -tl.quantity END) AS position_value
    FROM 
      trade_legs tl
      JOIN parent_trades pt ON tl.parent_trade_id = pt.id
    WHERE 
      pt.trade_type = 'physical'
      AND tl.loading_period_start IS NOT NULL
    GROUP BY 
      date_trunc('month', tl.loading_period_start), tl.product
  ),
  months AS (
    SELECT 
      to_char(generate_series(
        date_trunc('month', CURRENT_DATE - interval '2 months'),
        date_trunc('month', CURRENT_DATE + interval '4 months'),
        interval '1 month'
      ), 'Mon YY') AS month
    ORDER BY 
      generate_series(
        date_trunc('month', CURRENT_DATE - interval '2 months'),
        date_trunc('month', CURRENT_DATE + interval '4 months'),
        interval '1 month'
      )
  )
  SELECT 
    m.month,
    COALESCE(
      jsonb_object_agg(
        p.product, 
        COALESCE(p.position_value, 0)
      ),
      '{}'::jsonb
    ) AS products
  FROM 
    months m
    LEFT JOIN position_data p ON m.month = p.month
  GROUP BY 
    m.month
  ORDER BY 
    to_date(m.month, 'Mon YY');
END;
$$;

-- Function to get trades per month with count and volume
CREATE OR REPLACE FUNCTION public.get_trades_per_month()
RETURNS TABLE (
  month text,
  count bigint,
  volume numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH trade_data AS (
    SELECT 
      to_char(date_trunc('month', tl.loading_period_start), 'Mon YY') AS month,
      tl.id,
      tl.quantity
    FROM 
      trade_legs tl
      JOIN parent_trades pt ON tl.parent_trade_id = pt.id
    WHERE 
      pt.trade_type = 'physical'
      AND tl.loading_period_start IS NOT NULL
  ),
  months AS (
    SELECT 
      to_char(generate_series(
        date_trunc('month', CURRENT_DATE - interval '2 months'),
        date_trunc('month', CURRENT_DATE + interval '4 months'),
        interval '1 month'
      ), 'Mon YY') AS month
    ORDER BY 
      generate_series(
        date_trunc('month', CURRENT_DATE - interval '2 months'),
        date_trunc('month', CURRENT_DATE + interval '4 months'),
        interval '1 month'
      )
  )
  SELECT 
    m.month,
    COALESCE(COUNT(t.id), 0) AS count,
    COALESCE(SUM(ABS(t.quantity)), 0) AS volume
  FROM 
    months m
    LEFT JOIN trade_data t ON m.month = t.month
  GROUP BY 
    m.month
  ORDER BY 
    to_date(m.month, 'Mon YY');
END;
$$;
*/
