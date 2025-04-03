
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { deletePhysicalTrade, deletePhysicalTradeLeg } from '@/utils/physicalTradeDeleteUtils';

const TradeDeletePage = () => {
  const navigate = useNavigate();
  const { id: tradeId, legId } = useParams<{ id: string, legId?: string }>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  
  // Handle the deletion process
  const handleDelete = async () => {
    if (!tradeId) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      // Track progress for UI feedback
      const trackProgress = (progressValue: number) => {
        setProgress(progressValue);
      };
      
      let success = false;
      if (legId) {
        // Delete a specific leg
        success = await deletePhysicalTradeLeg(legId, tradeId, trackProgress);
        if (success) {
          toast.success(`Trade leg deleted successfully`);
        }
      } else {
        // Delete the entire trade
        success = await deletePhysicalTrade(tradeId, trackProgress);
        if (success) {
          toast.success(`Trade deleted successfully`);
        }
      }
      
      // Invalidate queries to refresh the trades list
      if (success) {
        await queryClient.invalidateQueries({ queryKey: ['trades'] });
        // Navigate back to trades page
        navigate('/trades');
      }
    } catch (err) {
      console.error('Error during deletion:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      toast.error("Deletion failed", {
        description: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Navigate back without deleting
  const handleCancel = () => {
    navigate('/trades');
  };
  
  return (
    <Layout>
      <Helmet>
        <title>Confirm Deletion | Trading Platform</title>
      </Helmet>
      
      <div className="container mx-auto py-6 max-w-3xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleCancel} 
            className="flex items-center"
            disabled={isDeleting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trades
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Confirm Deletion</CardTitle>
            <CardDescription>
              {legId ? 
                "You are about to delete a trade leg. This action cannot be undone." : 
                "You are about to delete a trade. This action cannot be undone."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            
            {isDeleting && (
              <div className="my-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">Deletion in progress...</p>
              </div>
            )}
            
            <Alert className="bg-gradient-to-br from-brand-navy/75 via-brand-navy/60 to-brand-lime/25 border-r-[3px] border-brand-lime/30 text-white mb-4">
              <AlertTriangle className="h-5 w-5 text-[#FEC6A1]" />
              <AlertTitle className="text-[#FEC6A1] font-medium">Warning</AlertTitle>
              <AlertDescription className="text-white">
                Are you sure you want to {legId ? "delete this trade leg" : "delete this trade"}?
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Confirm Delete
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default TradeDeletePage;
