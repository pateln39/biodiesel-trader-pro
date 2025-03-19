
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PaperTradeRow as PaperTradeRowType } from '@/types/paper';
import PaperTradeRow from './PaperTradeRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaperTradeTableProps {
  rows: PaperTradeRowType[];
  onAddRow: () => void;
  onUpdateRow: (updatedRow: PaperTradeRowType) => void;
  onRemoveRow: (id: string) => void;
  broker: string;
  tradeReference: string;
  disabled?: boolean;
}

const PaperTradeTable: React.FC<PaperTradeTableProps> = ({
  rows,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  broker,
  tradeReference,
  disabled = false
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Trade Rows</CardTitle>
        <Button 
          type="button" 
          onClick={onAddRow} 
          variant="outline" 
          size="sm"
          disabled={disabled}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No trade rows added. Click "Add Row" to create a trade row.
            </div>
          ) : (
            rows.map((row, index) => (
              <PaperTradeRow
                key={row.id}
                row={row}
                onChange={onUpdateRow}
                onRemove={() => onRemoveRow(row.id)}
                broker={broker}
                tradeReference={tradeReference}
                rowIndex={index}
                disabled={disabled}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaperTradeTable;
