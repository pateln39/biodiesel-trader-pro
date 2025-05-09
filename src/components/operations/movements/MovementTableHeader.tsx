
import React from 'react';
import { TableHead } from '@/components/ui/table';
import { Checkbox } from "@/components/ui/checkbox";
import { DateSortHeader } from '@/components/operations/DateSortHeader';
import { DateSortColumn, SortConfig } from '@/hooks/useMovementDateSort';

interface MovementTableHeaderProps {
  onToggleSelectAll: () => void;
  allSelected: boolean;
  filteredMovementsLength: number;
  sortColumns: SortConfig[];
  onToggleSortColumn: (column: DateSortColumn) => void;
}

const MovementTableHeader: React.FC<MovementTableHeaderProps> = ({
  onToggleSelectAll,
  allSelected,
  filteredMovementsLength,
  sortColumns,
  onToggleSortColumn
}) => {
  return (
    <>
      <TableHead className="h-10">
        <div className="flex items-center">
          <div className="p-2 cursor-pointer" onClick={(e) => {
            e.stopPropagation();
            onToggleSelectAll();
          }}>
            <Checkbox
              className="mr-2"
              checked={allSelected && filteredMovementsLength > 0}
            />
          </div>
          <span className="whitespace-nowrap">Movement Reference Number</span>
        </div>
      </TableHead>
      <TableHead className="h-10 whitespace-nowrap">Buy/Sell</TableHead>
      <TableHead className="h-10 whitespace-nowrap">Incoterm</TableHead>
      <TableHead className="h-10 whitespace-nowrap">Sustainability</TableHead>
      <TableHead className="h-10 whitespace-nowrap">Product</TableHead>
      <TableHead className="h-10 whitespace-nowrap">
        <DateSortHeader
          column="loading_period_start"
          label="Loading Start"
          sortColumns={sortColumns}
          onSort={onToggleSortColumn}
        />
      </TableHead>
      <TableHead className="h-10 whitespace-nowrap">
        <DateSortHeader
          column="loading_period_end"
          label="Loading End"
          sortColumns={sortColumns}
          onSort={onToggleSortColumn}
        />
      </TableHead>
      <TableHead className="h-10 whitespace-nowrap">Counterparty</TableHead>
      <TableHead className="h-10 whitespace-nowrap">Comments</TableHead>
      <TableHead className="h-10 whitespace-nowrap">Credit Status</TableHead>
      <TableHead className="h-10 whitespace-nowrap">Scheduled Quantity</TableHead>
      <TableHead className="h-10 whitespace-nowrap">
        <DateSortHeader
          column="nominationEta"
          label="Nomination ETA"
          sortColumns={sortColumns}
          onSort={onToggleSortColumn}
        />
      </TableHead>
      <TableHead className="h-10 whitespace-nowrap">
        <DateSortHeader
          column="nominationValid"
          label="Nomination Valid"
          sortColumns={sortColumns}
          onSort={onToggleSortColumn}
        />
      </TableHead>
      <TableHead className="h-10 whitespace-nowrap">
        <DateSortHeader
          column="cashFlow"
          label="Cash Flow Date"
          sortColumns={sortColumns}
          onSort={onToggleSortColumn}
        />
      </TableHead>
      <TableHead className="bg-gray-700 h-10 whitespace-nowrap">Barge Name</TableHead>
      <TableHead className="h-10 whitespace-nowrap">Loadport</TableHead>
      <TableHead className="h-10 whitespace-nowrap">Loadport Inspector</TableHead>
      <TableHead className="h-10 whitespace-nowrap">Disport</TableHead>
      <TableHead className="h-10 whitespace-nowrap">Disport Inspector</TableHead>
      <TableHead className="h-10 whitespace-nowrap">
        <DateSortHeader
          column="blDate"
          label="BL Date"
          sortColumns={sortColumns}
          onSort={onToggleSortColumn}
        />
      </TableHead>
      <TableHead className="h-10 whitespace-nowrap">Actual Quantity</TableHead>
      <TableHead className="h-10 whitespace-nowrap">
        <DateSortHeader
          column="codDate"
          label="COD Date"
          sortColumns={sortColumns}
          onSort={onToggleSortColumn}
        />
      </TableHead>
      <TableHead className="h-10 whitespace-nowrap">Status</TableHead>
      <TableHead className="text-center h-10 whitespace-nowrap">Actions</TableHead>
    </>
  );
};

export default MovementTableHeader;
