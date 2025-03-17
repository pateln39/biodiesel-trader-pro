
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
  const [zoomState, setZoomState] = React.useState<{
    refAreaLeft: string | null;
    refAreaRight: string | null;
    zoomedIn: boolean;
  }>({
    refAreaLeft: null,
    refAreaRight: null,
    zoomedIn: false
  });
  
  const [zoomedDomain, setZoomedDomain] = React.useState<{
    x: [number, number] | null;
    y: [number, number] | null;
  }>({
    x: null,
    y: null
  });

  // Prepare the chart data
  const instrumentIds = Object.keys(data);
  
  // Get all unique dates across all instruments
  const allDatesSet = new Set<string>();
  instrumentIds.forEach(id => {
    data[id].forEach(item => {
      allDatesSet.add(item.price_date);
    });
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
      const priceItem = data[id].find(item => item.price_date === date);
      if (priceItem) {
        dataPoint[id] = priceItem.price;
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

  // Handle mouse events for zoom
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
    
    // Find index of left and right areas for zoom
    const leftIndex = chartData.findIndex(d => d.date === zoomState.refAreaLeft);
    const rightIndex = chartData.findIndex(d => d.date === zoomState.refAreaRight);
    
    // Get min and max prices within the selected range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    
    chartData.slice(
      Math.min(leftIndex, rightIndex),
      Math.max(leftIndex, rightIndex) + 1
    ).forEach(dataPoint => {
      instrumentIds.forEach(id => {
        if (dataPoint[id] !== undefined) {
          minPrice = Math.min(minPrice, dataPoint[id]);
          maxPrice = Math.max(maxPrice, dataPoint[id]);
        }
      });
    });
    
    // Add some padding
    minPrice = minPrice * 0.95;
    maxPrice = maxPrice * 1.05;
    
    setZoomedDomain({
      x: [leftIndex, rightIndex],
      y: [minPrice, maxPrice]
    });
    
    setZoomState({
      refAreaLeft: null,
      refAreaRight: null,
      zoomedIn: true
    });
  };
  
  const handleZoomOut = () => {
    setZoomedDomain({
      x: null,
      y: null
    });
    setZoomState({
      refAreaLeft: null,
      refAreaRight: null,
      zoomedIn: false
    });
  };

  // Handle wheel zoom for Y axis
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!zoomState.zoomedIn || !zoomedDomain.y) return;
    
    const { deltaY } = e;
    const [min, max] = zoomedDomain.y;
    const range = max - min;
    
    // Scale factor - smaller for more precise zoom
    const scaleFactor = 0.05;
    
    if (deltaY < 0) {
      // Zoom in - decrease the range
      const newMin = min + range * scaleFactor;
      const newMax = max - range * scaleFactor;
      setZoomedDomain(prev => ({
        ...prev,
        y: [newMin, newMax]
      }));
    } else {
      // Zoom out - increase the range
      const newMin = min - range * scaleFactor;
      const newMax = max + range * scaleFactor;
      setZoomedDomain(prev => ({
        ...prev,
        y: [newMin, newMax]
      }));
    }
    
    e.preventDefault();
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
            <p>No data available to display chart.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-black text-white">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
        <CardTitle className="text-white">Price Trends</CardTitle>
        {zoomState.zoomedIn && (
          <button 
            className="text-xs text-white/70 hover:text-white"
            onClick={handleZoomOut}
          >
            Reset Zoom
          </button>
        )}
      </CardHeader>
      <CardContent>
        <div 
          className="h-80 pt-4" 
          onWheel={handleWheel}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis 
                dataKey="formattedDate" 
                stroke={chartTheme.text}
                tick={{ fill: chartTheme.text, fontSize: 12 }}
                domain={zoomedDomain.x ? ['dataMin', 'dataMax'] : ['auto', 'auto']}
                tickFormatter={(value) => value.substring(0, 6)}
                allowDataOverflow={true}
              />
              <YAxis 
                stroke={chartTheme.text}
                tick={{ fill: chartTheme.text, fontSize: 12 }}
                domain={zoomedDomain.y || ['auto', 'auto']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                allowDataOverflow={true}
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
                        {props.payload.map((entry, index) => {
                          if (!entry.value) return null;
                          const instrumentId = entry.dataKey as string;
                          return (
                            <p key={index} className="text-sm flex justify-between gap-4">
                              <span style={{ color: entry.color }}>{instrumentNames[instrumentId]}: </span>
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
              
              <Legend 
                formatter={(value) => instrumentNames[value] || value}
                wrapperStyle={{ color: chartTheme.text }}
              />
              
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
              
              {zoomState.refAreaLeft && zoomState.refAreaRight && (
                <ReferenceArea 
                  x1={zoomState.refAreaLeft} 
                  x2={zoomState.refAreaRight} 
                  strokeOpacity={0.3}
                  fill={chartTheme.text}
                  fillOpacity={0.3}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {statistics.length > 0 && (
          <div className="mt-4 overflow-x-auto">
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
        )}
      </CardContent>
    </Card>
  );
};
