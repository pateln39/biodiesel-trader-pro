
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OpenTrade } from '@/hooks/useOpenTrades';
import { formatDate } from '@/utils/dateUtils';
import { formatLegReference } from '@/utils/tradeUtils';
import { Loader2, Ship, MessageSquare, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from '@/integrations/supabase/client';
import FormulaCellDisplay from '@/components/trades/physical/FormulaCellDisplay';
import CommentsCellInput from '@/components/trades/physical/CommentsCellInput';
import ScheduleMovementForm from '@/components/operations/ScheduleMovementForm';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import TradeMovementsDialog from './TradeMovementsDialog';
import { useSortableOpenTrades } from '@/hooks/useSortableOpenTrades';
import { SortableTable } from '@/components/ui/sortable-table';
import { cn } from '@/lib/utils'; // Add this import
