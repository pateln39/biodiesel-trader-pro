
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/tradeUtils';
import { 
  Trade, 
  PhysicalTrade, 
  PaperTrade 
} from '@/types';
import { useTrades } from '@/hooks/useTrades';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell 
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

const TradesPage = () => {
  const { trades, loading, error, refetchTrades } = useTrades();
  const [activeTab, setActiveTab] = useState<"physical" | "paper">("physical");
  const [comments, setComments] = useState<Record<string, string>>({});

  // Filter trades based on the active tab
  const physicalTrades = trades.filter(trade => trade.tradeType === 'physical') as PhysicalTrade[];
  const paperTrades = trades.filter(trade => trade.tradeType === 'paper') as PaperTrade[];

  // Show error toast if query fails
  useEffect(() => {
    if (error) {
      toast.error('Failed to load trades', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }, [error]);

  const handleCommentChange = (tradeId: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [tradeId]: comment
    }));
    
    // Here you would typically save the comment to your backend
    // For now we'll just show a toast notification
    toast.success('Comment saved');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
          <Link to="/trades/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Trade
            </Button>
          </Link>
        </div>

        <div className="bg-card rounded-md border shadow-sm">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="font-semibold">All Trades</h2>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>
          
          <Tabs defaultValue="physical" onValueChange={(value) => setActiveTab(value as "physical" | "paper")} className="w-full">
            <div className="px-4 pt-2">
              <TabsList>
                <TabsTrigger value="physical">Physical Trades</TabsTrigger>
                <TabsTrigger value="paper">Paper Trades</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="physical" className="pt-2">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="p-8 flex flex-col items-center text-center space-y-4">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <div>
                    <h3 className="font-medium">Failed to load trades</h3>
                    <p className="text-muted-foreground text-sm">
                      {error instanceof Error ? error.message : 'Unknown error occurred'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchTrades()}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Buy/Sell</TableHead>
                      <TableHead>INCO</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Counterparty</TableHead>
                      <TableHead>Price Formula</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {physicalTrades.length > 0 ? (
                      physicalTrades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell>
                            <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                              {trade.tradeReference}
                            </Link>
                          </TableCell>
                          <TableCell className="capitalize">{trade.buySell}</TableCell>
                          <TableCell>{trade.incoTerm}</TableCell>
                          <TableCell className="text-right">{trade.quantity} {trade.unit}</TableCell>
                          <TableCell>{trade.product}</TableCell>
                          <TableCell>{trade.counterparty}</TableCell>
                          <TableCell>
                            {trade.pricingFormula && trade.pricingFormula.length > 0 ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">View Formula</Button>
                                </DialogTrigger>
                                <DialogContent className="w-80">
                                  <DialogHeader>
                                    <DialogTitle>Price Formula</DialogTitle>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <div className="text-sm">
                                      {trade.pricingFormula.map((component, idx) => (
                                        <div key={idx} className="mb-1">
                                          {component.instrument}: {component.percentage}% {component.adjustment > 0 ? `+${component.adjustment}` : component.adjustment < 0 ? component.adjustment : ''}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-muted-foreground">No formula</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Card className="p-2 min-w-[150px]">
                              <Textarea 
                                placeholder="Add your comments here..."
                                value={comments[trade.id] || ''}
                                onChange={(e) => setComments(prev => ({
                                  ...prev,
                                  [trade.id]: e.target.value
                                }))}
                                className="min-h-[60px] text-sm resize-y"
                                rows={2}
                              />
                              <div className="flex justify-end mt-2">
                                <Button 
                                  size="sm"
                                  onClick={() => handleCommentChange(trade.id, comments[trade.id] || '')}
                                >
                                  Save
                                </Button>
                              </div>
                            </Card>
                          </TableCell>
                          <TableCell className="text-center">
                            <Link to={`/trades/${trade.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                          No physical trades found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="paper" className="pt-2">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="p-8 flex flex-col items-center text-center space-y-4">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                    <div>
                      <h3 className="font-medium">Failed to load trades</h3>
                      <p className="text-muted-foreground text-sm">
                        {error instanceof Error ? error.message : 'Unknown error occurred'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetchTrades()}>
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Reference</th>
                        <th className="text-left p-3 font-medium">Broker</th>
                        <th className="text-left p-3 font-medium">Instrument</th>
                        <th className="text-right p-3 font-medium">Price</th>
                        <th className="text-right p-3 font-medium">Quantity</th>
                        <th className="text-left p-3 font-medium">Created</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paperTrades.length > 0 ? (
                        paperTrades.map((trade) => (
                          <tr key={trade.id} className="border-t hover:bg-muted/50">
                            <td className="p-3">
                              <Link to={`/trades/${trade.id}`} className="text-primary hover:underline">
                                {trade.tradeReference}
                              </Link>
                            </td>
                            <td className="p-3">{trade.broker}</td>
                            <td className="p-3">{trade.instrument}</td>
                            <td className="p-3 text-right">{trade.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right">{trade.quantity} MT</td>
                            <td className="p-3">{formatDate(trade.createdAt)}</td>
                            <td className="p-3 text-center">
                              <Link to={`/trades/${trade.id}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground">
                            No paper trades found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default TradesPage;
