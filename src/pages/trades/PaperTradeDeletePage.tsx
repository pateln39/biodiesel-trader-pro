
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { deletePaperTrade, deletePaperTradeLeg } from '@/utils/paperTradeDeleteUtils';

const PaperTradeDeletePage = () => {
  const { id: tradeId, legId } = useParams();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { paperTrades, isLoading, refetchPaperTrades } = usePaperTrades();
  
  const trade = paperTrades.find(t => t.id === tradeId);
  const leg = legId ? trade?.legs.find(l => l.id === legId) : null;
  
  const isLegDeletion = Boolean(legId);
  const isMultiLeg = trade?.legs.length && trade.legs.length > 1;
  
  useEffect(() => {
    if (!isLoading && !trade) {
      setError('Trade not found');
    }
  }, [trade, isLoading]);
  
  const handleDelete = async () => {
    if (!tradeId) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      if (isLegDeletion && legId) {
        console.log(`[PAPER_DELETE] Deleting paper trade leg: ${legId} from trade: ${tradeId}`);
        await deletePaperTradeLeg(legId, tradeId);
      } else {
        console.log(`[PAPER_DELETE] Deleting entire paper trade: ${tradeId}`);
        await deletePaperTrade(tradeId);
      }
      
      setIsSuccess(true);
      refetchPaperTrades();
      
      // Navigate back after successful deletion
      setTimeout(() => {
        navigate('/trades');
      }, 2000);
      
    } catch (err) {
      console.error('Error during deletion:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const renderDeleteContent = () => {
    if (isSuccess) {
      return (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-600">Success</AlertTitle>
          <AlertDescription>
            {isLegDeletion
              ? `Paper trade leg ${leg?.legReference} has been deleted.`
              : `Paper trade ${trade?.tradeReference} has been deleted.`
            }
            <div className="mt-2">
              Redirecting to trades list...
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-600">Warning</AlertTitle>
          <AlertDescription>
            {isLegDeletion
              ? `You are about to delete a paper trade leg. This action cannot be undone.${!isMultiLeg ? ' Since this is the only leg, the entire trade will be deleted.' : ''}`
              : 'You are about to delete an entire paper trade. This action cannot be undone.'
            }
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="bg-muted/40">
            <CardTitle>
              {isLegDeletion
                ? `Delete Paper Trade Leg: ${leg?.legReference}`
                : `Delete Paper Trade: ${trade?.tradeReference}`
              }
            </CardTitle>
            <CardDescription>
              {isLegDeletion
                ? 'You are about to delete a specific leg of this paper trade.'
                : 'This will permanently delete the paper trade and all its legs.'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Trade Reference</h3>
                <p className="text-lg font-medium">{trade?.tradeReference}</p>
              </div>

              {isLegDeletion && leg ? (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Leg Reference</h3>
                    <p className="text-lg font-medium">{leg.legReference}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Product & Period</h3>
                    <p className="text-lg font-medium">{leg.product} - {leg.period}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Quantity & Price</h3>
                    <p className="text-lg font-medium">{leg.quantity} at {leg.price}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Broker</h3>
                    <p className="text-lg font-medium">{trade?.broker}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Number of Legs</h3>
                    <p className="text-lg font-medium">{trade?.legs.length || 0}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t bg-muted/30 px-6 py-4">
            <Button variant="outline" disabled={isDeleting} asChild>
              <Link to="/trades">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>Deleting...</>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isLegDeletion ? 'Delete Leg' : 'Delete Trade'}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </>
    );
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {isLegDeletion ? 'Delete Paper Trade Leg' : 'Delete Paper Trade'}
          </h1>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="flex justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          renderDeleteContent()
        )}
      </div>
    </Layout>
  );
};

export default PaperTradeDeletePage;
