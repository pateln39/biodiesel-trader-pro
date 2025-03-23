
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import Layout from '@/core/components/Layout';
import { PhysicalTradeForm, PaperTradeForm } from '@/modules/trade/components';
import { useTrades } from '@/modules/trade/hooks';
import { TradeType } from '@/modules/trade/types';

const TradeEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.Physical);
  const { refetchTrades } = useTrades();

  const handleTradeSubmit = async (success: boolean) => {
    if (success) {
      toast.success('Trade saved successfully!');
      await refetchTrades();
      navigate('/trade');
    } else {
      toast.error('Failed to save trade.');
    }
  };

  return (
    <Layout>
      <Tabs defaultValue="physical" className="w-full">
        <TabsList>
          <TabsTrigger value="physical" onClick={() => setTradeType(TradeType.Physical)}>Physical Trade</TabsTrigger>
          <TabsTrigger value="paper" onClick={() => setTradeType(TradeType.Paper)}>Paper Trade</TabsTrigger>
        </TabsList>
        <TabsContent value="physical">
          <Card>
            <CardHeader>
              <CardTitle>Enter Physical Trade</CardTitle>
              <CardDescription>Enter the details of the physical trade.</CardDescription>
            </CardHeader>
            <CardContent>
              <PhysicalTradeForm onSubmit={handleTradeSubmit} />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/trade')}>
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="paper">
          <Card>
            <CardHeader>
              <CardTitle>Enter Paper Trade</CardTitle>
              <CardDescription>Enter the details of the paper trade.</CardDescription>
            </CardHeader>
            <CardContent>
              <PaperTradeForm 
                tradeReference=""
                onSubmit={handleTradeSubmit}
                onCancel={() => navigate('/trade')}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/trade')}>
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default TradeEntryPage;
