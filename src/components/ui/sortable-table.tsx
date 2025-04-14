
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface SortableTableProps<T> {
  items: T[];
  renderHeader: () => React.ReactElement;
  renderRow: (item: T) => React.ReactElement;
  rowId: (item: T) => string | number;
  onReorder?: (items: T[]) => void;
}

export function SortableTable<T>({
  items,
  renderHeader,
  renderRow,
  rowId,
  onReorder
}: SortableTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {renderHeader()}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={rowId(item)}>
            {renderRow(item)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
