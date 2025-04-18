
import React from 'react';
import { 
  TableHead, 
  TableCell,
} from '@/components/ui/table';
import { 
  SortableTable,
  SortableItem
} from '@/components/ui/sortable-table';
import { TruncatedCell } from '@/components/operations/storage/TruncatedCell';
import { TerminalAssignment } from '@/hooks/useTerminalAssignments';
import { useSortableTerminalAssignments } from '@/hooks/useSortableTerminalAssignments';
import EditableAssignmentComments from '@/components/operations/storage/EditableAssignmentComments';
import ProductToken from '@/components/operations/storage/ProductToken';

interface SortableAssignmentListProps {
  terminalId: string;
  movements: any[];
  updateAssignmentComments: (assignmentId: string, comments: string) => void;
  columnWidths: Record<string, number>;
}

const SortableAssignmentList = ({ 
  terminalId, 
  movements, 
  updateAssignmentComments,
  columnWidths
}: SortableAssignmentListProps) => {
  const { 
    assignments, 
    handleReorder 
  } = useSortableTerminalAssignments(terminalId);

  // Combine movement data with assignment data
  const sortableItems: (SortableItem & { 
    movement: any, 
    assignment: TerminalAssignment 
  })[] = assignments
    .map(assignment => {
      const movement = movements.find(m => m.assignment_id === assignment.id);
      if (!movement) return null;
      
      return {
        id: assignment.id as string,
        movement,
        assignment
      };
    })
    .filter(Boolean) as any[];

  // Create a wrapper for handleReorder that converts the SortableItems back to TerminalAssignments
  const handleReorderWrapper = (items: (SortableItem & { 
    movement: any; 
    assignment: TerminalAssignment; 
  })[]) => {
    // Map the complex items back to just the assignment objects
    const assignments = items.map(item => item.assignment);
    handleReorder(assignments);
  };

  // Get background color class based on movement type
  const getRowBgClass = (item: SortableItem & { 
    movement: any; 
    assignment: TerminalAssignment; 
  }) => {
    return item.movement?.buy_sell === "buy" 
      ? "bg-green-900/10 hover:bg-green-900/20" 
      : "bg-red-900/10 hover:bg-red-900/20";
  };

  return (
    <SortableTable
      items={sortableItems}
      onReorder={handleReorderWrapper}
      getRowBgClass={getRowBgClass}
      renderHeader={() => (
        <>
          <TableHead 
            className={`w-[${columnWidths.counterparty}px] h-10`}
            style={{ width: `${columnWidths.counterparty}px` }}
          >
            <TruncatedCell 
              text="Counterparty" 
              width={columnWidths.counterparty - 8} 
              className="text-[10px] font-medium"
            />
          </TableHead>
          <TableHead 
            className={`w-[${columnWidths.tradeRef}px] h-10`}
            style={{ width: `${columnWidths.tradeRef}px` }}
          >
            <TruncatedCell 
              text="Trade Ref" 
              width={columnWidths.tradeRef - 8} 
              className="text-[10px] font-medium"
            />
          </TableHead>
          <TableHead 
            className={`w-[${columnWidths.bargeName}px] h-10`}
            style={{ width: `${columnWidths.bargeName}px` }}
          >
            <TruncatedCell 
              text="Barge" 
              width={columnWidths.bargeName - 8} 
              className="text-[10px] font-medium"
            />
          </TableHead>
          <TableHead 
            className={`w-[${columnWidths.movementDate}px] h-10`}
            style={{ width: `${columnWidths.movementDate}px` }}
          >
            <TruncatedCell 
              text="Move Date" 
              width={columnWidths.movementDate - 8} 
              className="text-[10px] font-medium"
            />
          </TableHead>
          <TableHead 
            className={`w-[${columnWidths.nominationDate}px] h-10`}
            style={{ width: `${columnWidths.nominationDate}px` }}
          >
            <TruncatedCell 
              text="Nom. Valid" 
              width={columnWidths.nominationDate - 8} 
              className="text-[10px] font-medium"
            />
          </TableHead>
          <TableHead 
            className={`w-[${columnWidths.customs}px] h-10`}
            style={{ width: `${columnWidths.customs}px` }}
          >
            <TruncatedCell 
              text="Customs" 
              width={columnWidths.customs - 8} 
              className="text-[10px] font-medium"
            />
          </TableHead>
          <TableHead 
            className={`w-[${columnWidths.sustainability}px] h-10`}
            style={{ width: `${columnWidths.sustainability}px` }}
          >
            <TruncatedCell 
              text="Sustain." 
              width={columnWidths.sustainability - 8} 
              className="text-[10px] font-medium"
            />
          </TableHead>
          <TableHead 
            className={`w-[${columnWidths.comments}px] h-10`}
            style={{ width: `${columnWidths.comments}px` }}
          >
            <TruncatedCell 
              text="Comments" 
              width={columnWidths.comments - 8} 
              className="text-[10px] font-medium"
            />
          </TableHead>
          <TableHead 
            className={`w-[${columnWidths.quantity}px] h-10`}
            style={{ width: `${columnWidths.quantity}px` }}
          >
            <TruncatedCell 
              text="Qty (MT)" 
              width={columnWidths.quantity - 8} 
              className="text-[10px] font-medium"
            />
          </TableHead>
        </>
      )}
      renderRow={(item) => {
        const { movement, assignment } = item;
        
        return (
          <>
            <TableCell className="py-2 text-[10px] h-10">
              <TruncatedCell 
                text={movement?.counterparty} 
                width={columnWidths.counterparty - 16} 
                className="font-medium text-[10px]"
              />
            </TableCell>
            <TableCell className="py-2 text-[10px] h-10">
              <TruncatedCell 
                text={movement?.trade_reference} 
                width={columnWidths.tradeRef - 16} 
                className="text-[10px]"
              />
            </TableCell>
            <TableCell className="py-2 text-[10px] h-10">
              <TruncatedCell 
                text={movement?.barge_name} 
                width={columnWidths.bargeName - 16} 
                className="text-[10px]"
              />
            </TableCell>
            <TableCell className="py-2 text-[10px] h-10">
              <TruncatedCell 
                text={assignment?.assignment_date ? new Date(assignment.assignment_date).toLocaleDateString() : '-'} 
                width={columnWidths.movementDate - 16} 
                className="text-[10px]"
              />
            </TableCell>
            <TableCell className="py-2 text-[10px] h-10">
              <TruncatedCell 
                text={movement?.nomination_valid ? new Date(movement.nomination_valid).toLocaleDateString() : '-'}
                width={columnWidths.nominationDate - 16} 
                className="text-[10px]"
              />
            </TableCell>
            <TableCell className="py-2 text-[10px] h-10">
              <span className={`
                px-1 py-0.5 rounded-full text-[10px] font-medium truncate block
                ${movement?.customs_status === "T1" 
                  ? "bg-green-900/60 text-green-200" 
                  : "bg-blue-900/60 text-blue-200"}
              `} style={{ maxWidth: `${columnWidths.customs - 16}px` }}>
                {movement?.customs_status}
              </span>
            </TableCell>
            <TableCell className="py-2 text-[10px] h-10">
              <TruncatedCell 
                text={movement?.sustainability} 
                width={columnWidths.sustainability - 16} 
                className="text-[10px]"
              />
            </TableCell>
            <TableCell className="py-2 text-[10px] h-10">
              <EditableAssignmentComments
                assignmentId={assignment.id as string}
                initialValue={assignment.comments || ''}
                onSave={updateAssignmentComments}
                className="text-[10px]"
              />
            </TableCell>
            <TableCell className="py-2 text-[10px] h-10">
              <div className="flex justify-center">
                <ProductToken 
                  product={movement?.product}
                  value={assignment?.quantity_mt?.toString() || '0'}
                />
              </div>
            </TableCell>
          </>
        );
      }}
    />
  );
};

export default SortableAssignmentList;
