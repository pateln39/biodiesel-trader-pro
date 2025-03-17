
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer } from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceArea, 
  ReferenceLine 
} from 'recharts';
import type { PriceDataPoint } from './HistoricalPriceTable';
import { ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

interface HistoricalPriceChartProps {
  data: PriceDataPoint[];
  isLoading: boolean;
  instrumentName: string;
}

export const HistoricalPriceChart: React.FC<HistoricalPriceChartProps> = ({
  data,
  isLoading,
  instrumentName
}) => {
  const [zoomState, setZoomState] = React.useState<{
    refAreaLeft: string | null;
    refAreaRight: string | null;
    zoomedIn: boolean;
  }>({
    refAreaLeft: null,
    refAreaRight: null,
    zoomedIn: false
  });

  // Process chart data (need to be sorted by date ascending)
  const chartData = React.useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.price_date).getTime() - new Date(b.price_date).getTime())
      .map(item => ({
        date: item.price_date,
        price: item.price,
        formattedDate: format(new Date(item.price_date), 'dd MMM yyyy')
      }));
  }, [data]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (data.length === 0) return null;
    
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // Calculate standard deviation as a volatility measure
    const mean = avg;
    const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const volatility = (stdDev / mean) * 100; // as percentage
    
    return { min, max, avg, volatility };
  }, [data]);
  
  const handleMouseDown = (e: any) => {
    if (!e || !e.activeLabel) return;
    setZoomState(prev => ({
      ...prev,
      refAreaLeft: e.activeLabel
    }));
  };
  
  const handleMouseMove = (e: any) => {
    if (!e || !e.activeLabel || !zoomState.refAreaLeft) return;
    setZoomState(prev => ({
      ...prev,
      refAreaRight: e.activeLabel
    }));
  };
  
  const handleMouseUp = () => {
    if (!zoomState.refAreaLeft || !zoomState.refAreaRight) {
      setZoomState(prev => ({
        ...prev,
        refAreaLeft: null,
        refAreaRight: null
      }));
      return;
    }
    
    setZoomState(prev => ({
      refAreaLeft: null,
      refAreaRight: null,
      zoomedIn: true
    }));
  };
  
  const handleZoomOut = () => {
    setZoomState({
      refAreaLeft: null,
      refAreaRight: null,
      zoomedIn: false
    });
  };
  
  const sciTheme = {
    line: "#9b87f5", // Primary purple
    grid: "#1A1F2C30", // Dark Purple with transparency
    axis: "#7E69AB", // Secondary purple
    background: "transparent",
    tooltip: {
      background: "rgba(26, 31, 44, 0.9)", // Dark purple with opacity
      border: "#9b87f5",
      text: "#ffffff",
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p>No data available to display chart.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{instrumentName} Price Trends</CardTitle>
        {zoomState.zoomedIn && (
          <button 
            className="text-xs text-muted-foreground hover:text-primary"
            onClick={handleZoomOut}
          >
            Reset Zoom
          </button>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ChartContainer
            config={{
              price: { color: sciTheme.line },
            }}
          >
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sciTheme.line} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={sciTheme.line} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={sciTheme.grid} />
              <XAxis 
                dataKey="formattedDate" 
                stroke={sciTheme.axis}
                tick={{ fill: sciTheme.axis, fontSize: 12 }}
                tickFormatter={(value) => value.substring(0, 6)}
              />
              <YAxis 
                stroke={sciTheme.axis}
                tick={{ fill: sciTheme.axis, fontSize: 12 }}
                domain={['auto', 'auto']}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                content={(props) => {
                  if (!props.active || !props.payload || !props.payload.length) {
                    return null;
                  }
                  
                  return (
                    <div className="rounded-lg border border-border/50 bg-background/95 p-2 shadow-xl backdrop-blur-sm">
                      <p className="font-medium text-sm">{props.payload[0].payload.formattedDate}</p>
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">Price: </span>
                        <span className="font-mono">${Number(props.payload[0].value).toFixed(2)}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={sciTheme.line} 
                strokeWidth={2}
                activeDot={{ r: 8, stroke: sciTheme.line, strokeWidth: 2, fill: 'white' }}
                dot={false}
                animationDuration={500}
                connectNulls
              />
              {stats && (
                <ReferenceLine 
                  y={stats.avg} 
                  strokeDasharray="3 3"
                  stroke="#D6BCFA" // Light purple
                  label={{ 
                    value: `Avg: $${stats.avg.toFixed(2)}`,
                    position: 'right',
                    fill: '#D6BCFA',
                    fontSize: 12
                  }}
                />
              )}
              {zoomState.refAreaLeft && zoomState.refAreaRight && (
                <ReferenceArea 
                  x1={zoomState.refAreaLeft} 
                  x2={zoomState.refAreaRight} 
                  strokeOpacity={0.3}
                  fill={sciTheme.line}
                  fillOpacity={0.3}
                />
              )}
            </LineChart>
          </ChartContainer>
        </div>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
              <div className="text-xs text-muted-foreground">Min Price</div>
              <div className="text-lg font-mono">${stats.min.toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
              <div className="text-xs text-muted-foreground">Max Price</div>
              <div className="text-lg font-mono">${stats.max.toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
              <div className="text-xs text-muted-foreground">Avg Price</div>
              <div className="text-lg font-mono">${stats.avg.toFixed(2)}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
              <div className="text-xs text-muted-foreground">Volatility</div>
              <div className="text-lg font-mono">{stats.volatility.toFixed(2)}%</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
