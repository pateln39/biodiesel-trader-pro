
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useFilteredPhysicalMTM, PhysicalMTMFilters } from '@/hooks/useFilteredPhysicalMTM';
import PaginationNav from '@/components/ui/pagination-nav';
import PriceDetails from '@/components/pricing/PriceDetails';

const PaginatedPhysicalMTMTable: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<PhysicalMTMFilters>({});
  const [selectedLeg, setSelectedLeg] = useState<{
    legId: string;
    formula: any;
    mtmFormula: any;
    startDate: Date;
    endDate: Date;
    quantity: number;
    buySell: 'buy' | 'sell';
    efpPremium?: number;
    efpAgreedStatus?: boolean;
    efpFixedValue?: number;
    pricingType?: string;
    mtmFutureMonth?: string;
  } | null>(null);

  const { data, isLoading, error } = useFilteredPhysicalMTM({
    page: currentPage,
    pageSize: 15,
    filters,
  });

  const positions = data?.data || [];
  const pagination = data?.meta;

  const handleViewPrices = (position: any) => {
    setSelectedLeg({
      legId: position.leg_id,
      formula: null, // Will need to be populated when we add calculations
      mtmFormula: null, // Will need to be populated when we add calculations
      startDate: new Date(position.pricing_period_start),
      endDate: new Date(position.pricing_period_end),
      quantity: position.quantity,
      buySell: position.buy_sell as 'buy' | 'sell',
      pricingType: position.pricing_type,
      efpPremium: position.efp_premium,
      efpAgreedStatus: position.efp_agreed_status,
      efpFixedValue: position.efp_fixed_value,
      mtmFutureMonth: position.mtm_future_month
    });
  };

  const totalMtm = positions.reduce((sum, pos) => sum + (pos.mtm_value || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>Loading physical MTM positions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12 text-red-600">
        <p>Error loading physical MTM positions: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-right">
        <div className="text-sm font-medium">Total Physical MTM Position</div>
        <div className={`text-2xl font-bold ${totalMtm >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${totalMtm.toFixed(2)}
        </div>
      </div>
      
      {positions.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trade Ref</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>B/S</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Trade Price</TableHead>
                <TableHead className="text-right">MTM Price</TableHead>
                <TableHead className="text-right">MTM Value</TableHead>
                <TableHead>Period</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell>
                    {position.physical_type === 'term' ? (
                      <>
                        {position.trade_reference}-{position.leg_reference.split('-').pop()}
                      </>
                    ) : (
                      <>
                        {position.trade_reference}
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    {position.product}
                    {position.pricing_type === 'efp' && (
                      <Badge variant="outline" className="ml-2">EFP</Badge>
                    )}
                    {position.mtm_future_month && (
                      <Badge variant="secondary" className="ml-2">Future: {position.mtm_future_month}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={position.buy_sell === 'buy' ? "default" : "outline"}>
                      {position.buy_sell.charAt(0).toUpperCase() + position.buy_sell.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {position.quantity.toLocaleString()} MT
                  </TableCell>
                  <TableCell className="text-right">
                    ${position.trade_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${position.mtm_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={position.mtm_value >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${position.mtm_value.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      position.period_type === 'historical' ? 'default' : 
                      position.period_type === 'current' ? 'secondary' : 
                      'outline'
                    }>
                      {position.period_type || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewPrices(position)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && (
            <PaginationNav
              pagination={pagination}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      ) : (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <p>No physical MTM positions available. MTM positions will appear here once calculated.</p>
        </div>
      )}

      {selectedLeg && (
        <PriceDetails
          isOpen={!!selectedLeg}
          onClose={() => setSelectedLeg(null)}
          tradeLegId={selectedLeg.legId}
          formula={selectedLeg.formula}
          mtmFormula={selectedLeg.mtmFormula}
          startDate={selectedLeg.startDate}
          endDate={selectedLeg.endDate}
          quantity={selectedLeg.quantity}
          buySell={selectedLeg.buySell}
          pricingType={selectedLeg.pricingType}
          efpPremium={selectedLeg.efpPremium}
          efpAgreedStatus={selectedLeg.efpAgreedStatus}
          efpFixedValue={selectedLeg.efpFixedValue}
          mtmFutureMonth={selectedLeg.mtmFutureMonth}
        />
      )}
    </div>
  );
};

export default PaginatedPhysicalMTMTable;
