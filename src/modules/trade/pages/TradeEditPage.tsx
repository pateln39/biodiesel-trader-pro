import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Layout from '@/core/components/Layout';
import { PhysicalTradeForm } from '@/modules/trade/components';
import { PhysicalTrade, BuySell, Product, Unit, IncoTerm, PaymentTerm, CreditStatus } from '@/modules/trade/types';

const TradeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<PhysicalTrade | null>(null);

  const { data: tradeData, isLoading, isError } = useQuery({
    queryKey: ['trade', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Trade ID is required');
      }

      const { data, error } = await supabase
        .from('parent_trades')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as PhysicalTrade;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (tradeData) {
      setTrade(tradeData);
    }
  }, [tradeData]);

  const handleUpdateTrade = async (updatedTrade: PhysicalTrade) => {
    try {
      if (!id) {
        throw new Error('Trade ID is required');
      }

      const { error } = await supabase
        .from('parent_trades')
        .update(updatedTrade)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Trade updated successfully');
      navigate('/trades');
    } catch (error: any) {
      console.error('Error updating trade:', error);
      toast.error('Failed to update trade', {
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return <div>Loading trade details...</div>;
  }

  if (isError) {
    return <div>Error loading trade details.</div>;
  }

  if (!trade) {
    return <div>Trade not found.</div>;
  }

  return (
    <Layout title="Edit Trade">
      <div className="container mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-4">Edit Physical Trade</h1>
        {trade && (
          <PhysicalTradeForm
            initialValues={trade}
            onSubmit={handleUpdateTrade}
            isEditMode={true}
          />
        )}
      </div>
    </Layout>
  );
};

export default TradeEditPage;
