
import React, { useState, useEffect } from 'react';
import { Calculator, Clock, Plus, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from "@/components/ui/data-table";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';

interface DemurrageCalculation {
  id: string;
  movement_id: string;
  barge_vessel_id: string;
  quantity_loaded: number;
  calculation_rate: string;
  total_laytime: number;
  rate: number;
  total_time_used: number;
  demurrage_hours: number;
  demurrage_due: number;
  created_at: string;
  updated_at: string;
  comments: string | null;
  // References and aggregated data
  movement_reference: string | null;
  barge_name: string | null;
  counterparty: string | null;
}

const DemurragePage = () => {
  const [calculations, setCalculations] = useState<DemurrageCalculation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalculations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('demurrage_calculations')
        .select(`
          *,
          movements(reference_number, counterparty, barge_name),
          barges_vessels(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      // Transform the data to flatten the nested structure
      const transformedData = data.map((item: any) => ({
        ...item,
        movement_reference: item.movements?.reference_number || null,
        barge_name: item.movements?.barge_name || item.barges_vessels?.name || null,
        counterparty: item.movements?.counterparty || null,
      }));
      
      setCalculations(transformedData);
    } catch (err) {
      console.error('Error fetching demurrage calculations:', err);
      toast.error('Failed to load demurrage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculations();
  }, []);

  const columns: ColumnDef<DemurrageCalculation>[] = [
    {
      accessorKey: 'movement_reference',
      header: 'Movement Reference',
    },
    {
      accessorKey: 'barge_name',
      header: 'Barge/Vessel',
    },
    {
      accessorKey: 'counterparty',
      header: 'Counterparty',
    },
    {
      accessorKey: 'calculation_rate',
      header: 'Calc Rate',
    },
    {
      accessorKey: 'total_laytime',
      header: 'Total Laytime',
      cell: ({ row }) => <span>{row.original.total_laytime?.toFixed(2)} hrs</span>,
    },
    {
      accessorKey: 'total_time_used',
      header: 'Time Used',
      cell: ({ row }) => <span>{row.original.total_time_used?.toFixed(2)} hrs</span>,
    },
    {
      accessorKey: 'demurrage_hours',
      header: 'Demurrage Hours',
      cell: ({ row }) => <span>{row.original.demurrage_hours?.toFixed(2)} hrs</span>,
    },
    {
      accessorKey: 'rate',
      header: 'Rate (€/hr)',
      cell: ({ row }) => <span>€{row.original.rate?.toFixed(2)}</span>,
    },
    {
      accessorKey: 'demurrage_due',
      header: 'Demurrage Due',
      cell: ({ row }) => <span>€{row.original.demurrage_due?.toFixed(2)}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => <span>{format(new Date(row.original.created_at), 'dd-MM-yyyy HH:mm')}</span>,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Demurrage</h1>
          <div className="flex gap-2">
            <Button onClick={fetchCalculations} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Demurrage Calculations
            </CardTitle>
            <CardDescription>
              View and manage demurrage calculations for movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={calculations} 
              loading={loading}
              searchKey="barge_name" 
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Barges & Vessels
            </CardTitle>
            <CardDescription>
              Manage vessels and barges used in demurrage calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Add or manage barges and vessels. These will be available in the demurrage calculator to automatically
              populate deadweight data.
            </p>
            <Button variant="outline" size="sm" onClick={() => {
              toast.info("Not implemented", { description: "Vessel management page will be implemented in the future." });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Manage Vessels
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DemurragePage;
