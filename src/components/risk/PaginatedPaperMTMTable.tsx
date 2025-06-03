
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useFilteredPaperMTM } from '@/hooks/useFilteredPaperMTM';
import PaginationNav from '@/components/ui/pagination-nav';
import PaperPriceDetails from './PaperPriceDetails';

const PaginatedPaperMTMTable: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeg, setSelectedLeg] = useState<{
    legId: string;
    product: string;
    rightSide?: {
      product: string;
      price?: number;
    };
    period: string;
    quantity: number;
    buySell: 'buy' | 'sell';
    relationshipType: string;
    price: number;
  } | null>(null);

  const { data, isLoading, error } = useFilteredPaperMTM({
    page: currentPage,
    pageSize: 15,
  });

  const positions = data?.data || [];
  const pagination = data?.meta;

  const handleViewPrices = (position: any) => {
    setSelectedLeg({
      legId: position.leg_id,
      product: position.product,
      rightSide: position.right_side,
      period: position.period,
      quantity: position.quantity,
      buySell: position.buy_sell as 'buy' | 'sell',
      relationshipType: position.relationship_type,
      price: position.trade_price
    });
  };

  const totalMtm = positions.reduce((sum, pos) => sum + (pos.mtm_value || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>Loading paper MTM positions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12 text-red-600">
        <p>Error loading paper MTM positions: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-right">
        <div className="text-sm font-medium">Total Paper MTM Position</div>
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
                  <TableCell>{position.trade_reference}</TableCell>
                  <TableCell>
                    {position.product}
                    <Badge variant={position.relationship_type === 'FP' ? 'default' : 
                             position.relationship_type === 'DIFF' ? 'secondary' : 'outline'} 
                           className="ml-2">
                      {position.relationship_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={position.buy_sell === 'buy' ? 'default' : 'outline'}>
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
                      position.period_type === 'past' ? 'default' : 
                      position.period_type === 'current' ? 'secondary' : 
                      'outline'
                    }>
                      {position.period} ({position.period_type})
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
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <p className="mb-2">No paper MTM positions available.</p>
          <p>MTM positions will appear here once calculated.</p>
        </div>
      )}

      {selectedLeg && (
        <PaperPriceDetails
          isOpen={!!selectedLeg}
          onClose={() => setSelectedLeg(null)}
          tradeLegId={selectedLeg.legId}
          product={selectedLeg.product}
          rightSide={selectedLeg.rightSide}
          period={selectedLeg.period}
          quantity={selectedLeg.quantity}
          buySell={selectedLeg.buySell}
          relationshipType={selectedLeg.relationshipType}
          price={selectedLeg.price}
        />
      )}
    </div>
  );
};

export default PaginatedPaperMTMTable;
