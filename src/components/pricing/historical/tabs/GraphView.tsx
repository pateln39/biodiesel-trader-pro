
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Brush,
  Legend,
} from 'recharts';

interface PriceDataPoint {
  id: string;
  price_date: string;
  price: number;
  instrument_id: string;
  instrumentName: string;
}

interface StatItem {
  instrumentId: string;
  instrumentName: string;
  min: number;
  max: number;
  avg: number;
  volatility: number;
}

interface GraphViewProps {
  data: Record<string, PriceDataPoint[]>;
  statistics: StatItem[];
  instrumentNames: Record<string, string>;
  isLoading: boolean;
}

export const GraphView: React.FC<GraphViewProps> = ({
  data,
  statistics,
  instrumentNames,
  isLoading
}) => {
  // Check if we have valid data
  const instrumentIds = Object.keys(data || {});
  
  // Get all unique dates across all instruments - with safety checks
  const allDatesSet = new Set<string>();
  instrumentIds.forEach(id => {
    if (data[id] && Array.isArray(data[id])) {
      data[id].forEach(item => {
        if (item && item.price_date) {
          allDatesSet.add(item.price_date);
        }
      });
    }
  });
  
  // Convert to array and sort ascending for the chart
  const allDates = [...allDatesSet].sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Create chart data with a data point for each date, with all instrument prices
  const chartData = allDates.map(date => {
    const dataPoint: any = {
      date,
      formattedDate: format(new Date(date), 'dd MMM yyyy')
    };
    
    instrumentIds.forEach(id => {
      if (data[id] && Array.isArray(data[id])) {
        const priceItem = data[id].find(item => item && item.price_date === date);
        if (priceItem) {
          dataPoint[id] = priceItem.price;
        }
      }
    });
    
    return dataPoint;
  });

  // Neon colors for the chart
  const colors = [
    "#39FF14", // Neon green
    "#FF10F0", // Neon pink
    "#00FFFF", // Neon cyan
    "#FFFF00", // Neon yellow
    "#FF3131", // Neon red
    "#1F51FF", // Neon blue
  ];

  // Chart theme
  const chartTheme = {
    background: "#000000",
    text: "#FFFFFF",
    grid: "#FFFFFF40",
    line: colors,
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
  
  if (instrumentIds.length === 0 || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p>No data available to display chart. Please select at least one instrument.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-black text-white">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
        <CardTitle className="text-white">Price Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 pt-4 relative">
          {/* Custom legend box */}
          <div className="absolute top-0 right-0 z-10 bg-white p-2 rounded-md shadow-lg">
            <div className="text-xs font-medium text-black mb-1">Legend</div>
            {instrumentIds.map((id, index) => (
              <div key={id} className="flex items-center gap-2 text-xs text-black">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span>{instrumentNames[id] || id}</span>
              </div>
            ))}
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis 
                dataKey="formattedDate" 
                stroke={chartTheme.text}
                tick={{ fill: chartTheme.text, fontSize: 12 }}
                tickFormatter={(value) => value.substring(0, 6)}
              />
              <YAxis 
                stroke={chartTheme.text}
                tick={{ fill: chartTheme.text, fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                content={(props) => {
                  if (!props.active || !props.payload) {
                    return null;
                  }
                  
                  return (
                    <div className="rounded-lg border border-white/20 bg-black/95 p-2 shadow-xl backdrop-blur-sm">
                      <p className="font-medium text-sm text-white">
                        {props.label}
                      </p>
                      <div className="mt-2 space-y-1">
                        {props.payload.map((entry: any, index: number) => {
                          if (!entry.value) return null;
                          const instrumentId = entry.dataKey as string;
                          return (
                            <p key={index} className="text-sm flex justify-between gap-4">
                              <span style={{ color: entry.color }}>{instrumentNames[instrumentId] || instrumentId}: </span>
                              <span className="font-mono">${Number(entry.value).toFixed(2)}</span>
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              
              <Brush 
                dataKey="formattedDate"
                height={30}
                stroke={chartTheme.text}
                tickFormatter={(value) => value.substring(0, 3)}
                y={280}
              />
              
              {/* Hide the built-in legend since we have a custom one */}
              <Legend wrapperStyle={{ display: 'none' }} />
              
              {instrumentIds.map((id, index) => (
                <Line 
                  key={id}
                  type="monotone" 
                  dataKey={id} 
                  name={id}
                  stroke={colors[index % colors.length]} 
                  strokeWidth={2}
                  activeDot={{ r: 8, stroke: colors[index % colors.length], strokeWidth: 2, fill: 'white' }}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {statistics && statistics.length > 0 && (
          <>
            <div className="text-xl font-semibold text-white mt-8 mb-2">Summary Table</div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-2 text-white/70">Instrument</th>
                    <th className="text-right p-2 text-white/70">Min Price</th>
                    <th className="text-right p-2 text-white/70">Max Price</th>
                    <th className="text-right p-2 text-white/70">Avg Price</th>
                    <th className="text-right p-2 text-white/70">Volatility</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.map(stat => (
                    <tr key={stat.instrumentId} className="border-b border-white/10">
                      <td className="p-2 text-white">{stat.instrumentName}</td>
                      <td className="p-2 text-right font-mono text-white">${stat.min.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono text-white">${stat.max.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono text-white">${stat.avg.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono text-white">{stat.volatility.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
