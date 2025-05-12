
import React from 'react';
import { format } from 'date-fns';
import { Group, Ungroup, MessageSquare, FileText, Warehouse, Eye, Edit, Trash2, Calculator } from 'lucide-react';
import { Movement } from '@/types';
import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ProductToken from '@/components/operations/storage/ProductToken';
import { TruncatedCell } from '@/components/operations/storage/TruncatedCell';
import { getGroupColorClasses } from '@/utils/colorUtils';

// Constants for cell width to maintain consistency
const CELL_WIDTHS = {
  reference: 160,
  buySell: 80,
  incoterm: 100,
  sustainability: 110,
  product: 120,
  date: 110,
  counterparty: 150,
  comments: 80,
  creditStatus: 120,
  quantity: 120,
  location: 140,
  inspector: 140,
  bargeName: 140,
  status: 130,
  actions: 120
};

interface MovementRowProps {
  movement: Movement;
  index: number;
  movements: Movement[];
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onCommentsClick: (movement: Movement) => void;
  onViewTradeDetails: (tradeId: string, legId?: string) => void;
  onEditMovement: (movement: Movement) => void;
  onStorageClick: (movement: Movement) => void;
  onDemurrageCalculatorClick: (movement: Movement) => void;
  onDeleteMovement: (id: string) => void;
  onUngroupClick: (groupId: string) => void;
  isUngrouping: boolean;
}

const MovementRow: React.FC<MovementRowProps> = ({
  movement,
  index,
  movements,
  isSelected,
  onToggleSelect,
  onStatusChange,
  onCommentsClick,
  onViewTradeDetails,
  onEditMovement,
  onStorageClick,
  onDemurrageCalculatorClick,
  onDeleteMovement,
  onUngroupClick,
  isUngrouping,
}) => {
  // Function to identify if an item is part of a group
  const isGroupedMovement = (item: Movement) => {
    return !!item.group_id;
  };

  // Function to determine if an item is the first in a group
  const isFirstInGroup = (item: Movement, index: number, items: Movement[]) => {
    if (!item.group_id) return false;
    
    if (index === 0) return true;
    
    const previousMovement = items[index - 1];
    
    return item.group_id !== previousMovement.group_id;
  };

  // Function to determine if an item is the last in a group
  const isLastInGroup = (item: Movement, index: number, items: Movement[]) => {
    if (!item.group_id) return false;
    
    if (index === items.length - 1) return true;
    
    const nextMovement = items[index + 1];
    
    return item.group_id !== nextMovement.group_id;
  };

  // Get icon color based on group ID
  const getIconColorClass = (groupId: string): string => {
    const colorClasses = getGroupColorClasses(groupId);
    
    // Update color mappings based on our new color palette
    if (colorClasses.includes('amber')) return 'text-amber-400';
    if (colorClasses.includes('emerald')) return 'text-emerald-400';
    if (colorClasses.includes('sky')) return 'text-sky-400';
    if (colorClasses.includes('rose')) return 'text-rose-400';
    if (colorClasses.includes('lime')) return 'text-lime-400';
    if (colorClasses.includes('orange')) return 'text-orange-400';
    if (colorClasses.includes('cyan')) return 'text-cyan-400';
    return 'text-purple-400'; // Default
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return "default";
      case 'in progress':
        return "secondary";
      case 'cancelled':
        return "destructive";
      default:
        return "outline";
    }
  };

  const isInGroup = isGroupedMovement(movement);
  const isFirstGroupItem = isInGroup && isFirstInGroup(movement, index, movements);
  const iconColorClass = movement.group_id ? getIconColorClass(movement.group_id) : '';

  return (
    <>
      <TableCell className="h-10">
        <div className="flex items-center">
          <div className="p-2 cursor-pointer" onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(movement.id);
          }}>
            <Checkbox 
              checked={isSelected}
            />
          </div>
          <div className="flex items-center">
            {isInGroup && isFirstGroupItem && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 mr-1 ${getGroupColorClasses(movement.group_id as string).split(' ')[0]} hover:${getGroupColorClasses(movement.group_id as string).split(' ')[0].replace('/20', '/30')}`}
                      onClick={() => onUngroupClick(movement.group_id as string)}
                      disabled={isUngrouping}
                      data-ignore-row-click="true"
                    >
                      <Ungroup className={`h-3 w-3 ${iconColorClass}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ungroup these movements</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {isInGroup && !isFirstGroupItem && (
              <Group className={`h-3 w-3 ${iconColorClass} mr-1`} />
            )}
            <TruncatedCell 
              text={movement.referenceNumber} 
              width={CELL_WIDTHS.reference - 40} // Account for checkbox and icon
              className="text-xs"
            />
          </div>
        </div>
      </TableCell>
      <TableCell className="h-10">
        {movement.buySell && (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            movement.buySell === 'buy' 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'
          }`}>
            {movement.buySell === 'buy' ? 'BUY' : 'SELL'}
          </div>
        )}
      </TableCell>
      <TableCell className="h-10">
        <TruncatedCell 
          text={movement.incoTerm} 
          width={CELL_WIDTHS.incoterm} 
          className="text-xs"
        />
      </TableCell>
      <TableCell className="h-10">
        <TruncatedCell 
          text={movement.sustainability || '-'} 
          width={CELL_WIDTHS.sustainability} 
          className="text-xs"
        />
      </TableCell>
      <TableCell className="h-10">
        <ProductToken 
          product={movement.product}
          value={movement.product}
          showTooltip={true}
        />
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">
        {movement.loading_period_start ? format(new Date(movement.loading_period_start), 'dd MMM yyyy') : '-'}
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">
        {movement.loading_period_end ? format(new Date(movement.loading_period_end), 'dd MMM yyyy') : '-'}
      </TableCell>
      <TableCell className="h-10">
        <TruncatedCell 
          text={movement.counterpartyName} 
          width={CELL_WIDTHS.counterparty} 
          className="text-xs"
        />
      </TableCell>
      <TableCell className="h-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => onCommentsClick(movement)}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                {movement.comments && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500"></span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add or view comments</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="h-10">
        {movement.creditStatus && (
          <Badge variant={
            movement.creditStatus === 'approved' ? "default" :
            movement.creditStatus === 'rejected' ? "destructive" :
            "outline"
          }>
            {movement.creditStatus}
          </Badge>
        )}
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">
        {movement.scheduledQuantity?.toLocaleString()} MT
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">
        {movement.nominationEta ? format(new Date(movement.nominationEta), 'dd MMM yyyy') : '-'}
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">
        {movement.nominationValid ? format(new Date(movement.nominationValid), 'dd MMM yyyy') : '-'}
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">
        {movement.cashFlow ? format(new Date(movement.cashFlow), 'dd MMM yyyy') : '-'}
      </TableCell>
      <TableCell className="bg-gray-700 h-10">
        <TruncatedCell 
          text={movement.bargeName || '-'} 
          width={CELL_WIDTHS.bargeName} 
          className="text-xs"
        />
      </TableCell>
      <TableCell className="h-10">
        <TruncatedCell 
          text={movement.loadport || '-'} 
          width={CELL_WIDTHS.location} 
          className="text-xs"
        />
      </TableCell>
      <TableCell className="h-10">
        <TruncatedCell 
          text={movement.loadportInspector || '-'} 
          width={CELL_WIDTHS.inspector} 
          className="text-xs"
        />
      </TableCell>
      <TableCell className="h-10">
        <TruncatedCell 
          text={movement.disport || '-'} 
          width={CELL_WIDTHS.location} 
          className="text-xs"
        />
      </TableCell>
      <TableCell className="h-10">
        <TruncatedCell 
          text={movement.disportInspector || '-'} 
          width={CELL_WIDTHS.inspector} 
          className="text-xs"
        />
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">
        {movement.blDate ? format(new Date(movement.blDate), 'dd MMM yyyy') : '-'}
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">
        {movement.actualQuantity?.toLocaleString()} MT
      </TableCell>
      <TableCell className="h-10 whitespace-nowrap">
        {movement.codDate ? format(new Date(movement.codDate), 'dd MMM yyyy') : '-'}
      </TableCell>
      <TableCell className="h-10">
        <Select
          defaultValue={movement.status}
          onValueChange={(value) => {
            onStatusChange(movement.id, value);
          }}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue>
              <Badge variant={getStatusBadgeVariant(movement.status)}>
                {movement.status.charAt(0).toUpperCase() + movement.status.slice(1)}
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-center h-10">
        <div className="flex justify-center space-x-1" data-ignore-row-click="true">
          {movement.parentTradeId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => onViewTradeDetails(movement.parentTradeId as string, movement.tradeLegId)}
                    data-ignore-row-click="true"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Trade Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => onEditMovement(movement)}
            data-ignore-row-click="true"
          >
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => onStorageClick(movement)}
                  data-ignore-row-click="true"
                >
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Assign to Storage Terminal</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => onDemurrageCalculatorClick(movement)}
                  data-ignore-row-click="true"
                >
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Demurrage Calculator</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                data-ignore-row-click="true"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Movement</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this movement? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDeleteMovement(movement.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </>
  );
};

export default MovementRow;
