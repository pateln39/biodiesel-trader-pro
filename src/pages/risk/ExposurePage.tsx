
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { usePhysicalPositions } from '@/hooks/usePhysicalPositions';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DateRangeFilter } from '@/components/risk/DateRangeFilter';
import { 
  calculateProratedExposure, 
  getMonthDates 
} from '@/utils/exposureUtils';

interface ExposureRowData {
  month: string;
  instrument: string;
  physical: number;
  pricing: number;
  paper: number;
  net: number;
}

export default function ExposurePage() {
  const { physicalPositions, loading: physicalLoading } = usePhysicalPositions();
  const { trades: paperTrades, loading: paperLoading } = usePaperTrades();
  
  // Date range filter state
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);
  
  // Check if filters are applied
  const isFiltered = Boolean(startDateFilter || endDateFilter);
  
  // Reset filters
  const resetFilters = () => {
    setStartDateFilter(null);
    setEndDateFilter(null);
  };

  const columns: ColumnDef<ExposureRowData>[] = [
    {
      accessorKey: 'month',
      header: 'Month',
      cell: ({ row }) => <div className="font-medium">{row.getValue('month')}</div>,
    },
    {
      accessorKey: 'instrument',
      header: 'Instrument',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.instrument}
        </div>
      ),
    },
    {
      accessorKey: 'physical',
      header: 'Physical',
      cell: ({ row }) => {
        const value = row.getValue<number>('physical');
        return (
          <div className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''}>
            {value !== 0 ? value.toLocaleString() : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'pricing',
      header: 'Pricing',
      cell: ({ row }) => {
        const value = row.getValue<number>('pricing');
        return (
          <div className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''}>
            {value !== 0 ? value.toLocaleString() : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'paper',
      header: 'Paper',
      cell: ({ row }) => {
        const value = row.getValue<number>('paper');
        return (
          <div className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''}>
            {value !== 0 ? value.toLocaleString() : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'net',
      header: 'Net',
      cell: ({ row }) => {
        const value = row.getValue<number>('net');
        return (
          <Badge 
            variant={value > 0 ? 'default' : value < 0 ? 'destructive' : 'outline'}
            className="font-bold"
          >
            {value !== 0 ? value.toLocaleString() : '0'}
          </Badge>
        );
      },
    },
  ];

  const exposureData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const years = [new Date().getFullYear() % 100, (new Date().getFullYear() + 1) % 100];
    const periods = years.flatMap(year => months.map(month => `${month}-${year.toString().padStart(2, '0')}`));
    
    const instruments = [
      'Argus UCOME',
      'Argus RME',
      'Argus FAME0',
      'Argus HVO',
      'Platts LSGO',
      'Platts Diesel',
      'ICE GASOIL FUTURES',
      'ICE GASOIL FUTURES (EFP)'
    ];
    
    // Initialize exposures object
    const exposuresByMonth: Record<string, Record<string, { physical: number; pricing: number; paper: number; net: number }>> = {};
    
    periods.forEach(period => {
      exposuresByMonth[period] = {};
      instruments.forEach(instrument => {
        exposuresByMonth[period][instrument] = { physical: 0, pricing: 0, paper: 0, net: 0 };
      });
    });
    
    // Process Physical trades
    if (physicalPositions && physicalPositions.legs) {
      physicalPositions.legs.forEach(leg => {
        // Physical exposure - unaffected by date filters
        const physicalExposure = leg.physical || {};
        Object.entries(physicalExposure).forEach(([instrument, value]) => {
          if (value !== 0 && exposuresByMonth[leg.month] && exposuresByMonth[leg.month][instrument]) {
            exposuresByMonth[leg.month][instrument].physical += value;
          }
        });
        
        // Pricing exposure - affected by date filters
        if (leg.trade && leg.trade.pricingPeriodStart && leg.trade.pricingPeriodEnd) {
          const pricingStart = new Date(leg.trade.pricingPeriodStart);
          const pricingEnd = new Date(leg.trade.pricingPeriodEnd);
          
          if (leg.trade.pricingType === 'efp') {
            // Handle EFP trades
            const efpDesignatedMonth = leg.trade.efpDesignatedMonth;
            
            if (!leg.trade.efpAgreedStatus && efpDesignatedMonth) {
              const proratedExposure = calculateProratedExposure(
                leg.trade.formula,
                startDateFilter,
                endDateFilter,
                pricingStart,
                pricingEnd,
                efpDesignatedMonth,
                leg.trade.buySell,
                leg.trade.quantity,
                true,
                efpDesignatedMonth
              );
              
              Object.entries(proratedExposure).forEach(([instrument, value]) => {
                if (exposuresByMonth[efpDesignatedMonth] && exposuresByMonth[efpDesignatedMonth][instrument]) {
                  exposuresByMonth[efpDesignatedMonth][instrument].pricing += value;
                }
              });
            }
          } else {
            // Handle standard trades
            periods.forEach(period => {
              const monthDates = getMonthDates(period);
              if (!monthDates) return;
              
              const proratedExposure = calculateProratedExposure(
                leg.trade?.formula,
                startDateFilter,
                endDateFilter,
                pricingStart,
                pricingEnd,
                period,
                leg.trade.buySell,
                leg.trade.quantity
              );
              
              Object.entries(proratedExposure).forEach(([instrument, value]) => {
                if (exposuresByMonth[period] && exposuresByMonth[period][instrument]) {
                  exposuresByMonth[period][instrument].pricing += value;
                }
              });
            });
          }
        }
      });
    }
    
    // Process Paper trades - unaffected by date filters
    if (paperTrades) {
      paperTrades.forEach(trade => {
        if (!trade.legs) return;
        
        trade.legs.forEach(leg => {
          if (!leg.formula?.monthlyDistribution) return;
          
          const monthlyDistribution = leg.formula.monthlyDistribution;
          
          Object.entries(monthlyDistribution).forEach(([instrument, distribution]) => {
            if (typeof distribution === 'object') {
              Object.entries(distribution).forEach(([month, value]) => {
                if (exposuresByMonth[month] && exposuresByMonth[month][instrument]) {
                  exposuresByMonth[month][instrument].paper += value;
                  exposuresByMonth[month][instrument].pricing += value;
                }
              });
            }
          });
        });
      });
    }
    
    // Calculate net exposures
    Object.entries(exposuresByMonth).forEach(([month, instrumentMap]) => {
      Object.entries(instrumentMap).forEach(([instrument, values]) => {
        values.net = values.physical + values.pricing + values.paper;
      });
    });
    
    // Transform to table data format
    const tableData: ExposureRowData[] = [];
    
    periods.forEach(period => {
      instruments.forEach(instrument => {
        const exposure = exposuresByMonth[period][instrument];
        if (exposure.physical !== 0 || exposure.pricing !== 0 || exposure.paper !== 0) {
          tableData.push({
            month: period,
            instrument,
            physical: exposure.physical,
            pricing: exposure.pricing,
            paper: exposure.paper,
            net: exposure.net
          });
        }
      });
    });
    
    // Add total rows for each month
    periods.forEach(period => {
      const monthTotal = {
        month: period,
        instrument: 'TOTAL',
        physical: 0,
        pricing: 0,
        paper: 0,
        net: 0
      };
      
      instruments.forEach(instrument => {
        const exposure = exposuresByMonth[period][instrument];
        monthTotal.physical += exposure.physical;
        monthTotal.pricing += exposure.pricing;
        monthTotal.paper += exposure.paper;
        monthTotal.net += exposure.net;
      });
      
      // Only add if there's exposure in this month
      if (monthTotal.physical !== 0 || monthTotal.pricing !== 0 || monthTotal.paper !== 0) {
        tableData.push(monthTotal);
      }
    });
    
    return tableData;
  }, [physicalPositions, paperTrades, startDateFilter, endDateFilter]);

  const loading = physicalLoading || paperLoading;

  return (
    <TabsContent value="exposure" className="space-y-4">
      <div className="mb-4">
        <DateRangeFilter
          startDate={startDateFilter}
          endDate={endDateFilter}
          onStartDateChange={setStartDateFilter}
          onEndDateChange={setEndDateFilter}
          onReset={resetFilters}
          isFiltered={isFiltered}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Exposure by Instrument</span>
            {isFiltered && (
              <Badge variant="outline" className="ml-2">
                Date Filtered
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={exposureData} isLoading={loading} />
        </CardContent>
      </Card>
    </TabsContent>
  );
}
