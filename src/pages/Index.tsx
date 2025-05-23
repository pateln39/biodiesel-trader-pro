import React from 'react';
import { TrendingUp, Package, Clock, AlertTriangle, BarChart3, DollarSign } from 'lucide-react';
import Layout from '@/components/Layout';
import DashboardCard from '@/components/DashboardCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LineChart, ComposedChart } from 'recharts';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import { useReferenceData } from '@/hooks/useReferenceData';
import ProductLegend from '@/components/operations/storage/ProductLegend';
import { useDashboardAggregates } from '@/hooks/useDashboardAggregates';

const demurrageData = [
  { month: 'Jul', totalUSD: 150000, usdPerMT: 0.18 },
  { month: 'Aug', totalUSD: 220000, usdPerMT: 0.25 },
  { month: 'Sep', totalUSD: 180000, usdPerMT: 0.22 },
  { month: 'Oct', totalUSD: 270000, usdPerMT: 0.32 },
  { month: 'Nov', totalUSD: 240000, usdPerMT: 0.28 },
  { month: 'Dec', totalUSD: 260000, usdPerMT: 0.30 },
  { month: 'Jan', totalUSD: 350000, usdPerMT: 0.38 },
];

const qiuData = [
  { counterparty: 'Counterparty A', limit: 500000, utilization: 50 },
  { counterparty: 'Counterparty B', limit: 400000, utilization: 75 },
  { counterparty: 'Counterparty C', limit: 300000, utilization: 25 },
];

const pnlData = [
  { month: 'Jan', physicalARA: 200000, refinery: 50000, dynamicHedging: 30000 },
  { month: 'Feb', physicalARA: 220000, refinery: 55000, dynamicHedging: 35000 },
  { month: 'Mar', physicalARA: 240000, refinery: 60000, dynamicHedging: 40000 },
  { month: 'Apr', physicalARA: 260000, refinery: 65000, dynamicHedging: 45000 },
  { month: 'May', physicalARA: 280000, refinery: 70000, dynamicHedging: 50000 },
  { month: 'Jun', physicalARA: 300000, refinery: 75000, dynamicHedging: 55000 },
  { month: 'Jul', physicalARA: 320000, refinery: 80000, dynamicHedging: 60000 },
];

const Index = () => {
  const { 
    physicalPositionData, 
    tradesPerMonthData, 
    loading, 
    error, 
    refetchData 
  } = useDashboardAggregates();
  
  const { productOptions, productColors, isLoadingProducts } = useReferenceData();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to your Biodiesel Trading CTRM system.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Trades"
            description="Manage physical and paper trades"
            icon={BarChart3}
            count={95}
            linkTo="/trades"
            linkText="View all trades"
            className="bg-brand-navy border-brand-blue/30"
          />
          <DashboardCard
            title="Open Operations"
            description="Schedule and manage movements"
            icon={Package}
            count={42}
            linkTo="/operations"
            linkText="View operations"
            className="bg-brand-navy border-brand-blue/30"
          />
          <DashboardCard
            title="Exposure"
            description="View current market exposure"
            icon={TrendingUp}
            count={18}
            linkTo="/exposure"
            linkText="View exposure report"
            className="bg-brand-navy border-brand-blue/30"
          />
          <DashboardCard
            title="Audit Log"
            description="Track all system changes"
            icon={Clock}
            count={156}
            linkTo="/audit"
            linkText="View audit logs"
            className="bg-brand-navy border-brand-blue/30"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-brand-navy text-white border-brand-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Physical Position by Month and Grade</CardTitle>
            </CardHeader>
            <CardContent>
              {loading || isLoadingProducts ? (
                <TableLoadingState />
              ) : error ? (
                <TableErrorState error={error} onRetry={refetchData} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-blue/30 bg-brand-blue/20">
                        <th className="text-left p-2 text-brand-lime font-semibold">Month</th>
                        {productOptions.map(product => (
                          <th key={product} className="text-right p-2 text-brand-lime font-semibold">{product}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {physicalPositionData.map((row) => (
                        <tr key={row.month} className="border-b border-brand-blue/30 hover:bg-brand-blue/10 transition-colors">
                          <td className="text-left p-2 font-medium">{row.month}</td>
                          {productOptions.map(product => (
                            <td key={`${row.month}-${product}`} className="text-right p-2 font-bold text-white">
                              {row[product] !== 0 ? row[product] : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-brand-navy text-white border-brand-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Trades per Month</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableLoadingState />
              ) : error ? (
                <TableErrorState error={error} onRetry={refetchData} />
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={tradesPerMonthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1D59A9" opacity={0.3} />
                      <XAxis dataKey="month" stroke="#FFFFFF" />
                      <YAxis yAxisId="left" orientation="left" stroke="#FFFFFF" />
                      <YAxis yAxisId="right" orientation="right" stroke="#B4D335" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-brand-navy p-3 border border-brand-blue/30 rounded shadow">
                                <p className="text-brand-lime">{`Volume: ${payload[1]?.value || 0} mt`}</p>
                                <p className="text-white">{`Count: ${payload[0]?.value || 0}`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill="#1D59A9" name="Count" />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="#B4D335" 
                        strokeWidth={3} 
                        dot={{ fill: '#B4D335', strokeWidth: 2 }}
                        name="Volume (mt)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-brand-navy text-white border-brand-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">QIU</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-blue/30">
                      <th className="text-left p-2">Counterparty</th>
                      <th className="text-right p-2">Limit</th>
                      <th className="text-right p-2 text-brand-lime">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qiuData.map((row) => (
                      <tr key={row.counterparty} className="border-b border-brand-blue/30">
                        <td className="text-left p-2">{row.counterparty}</td>
                        <td className="text-right p-2">{row.limit.toLocaleString()}</td>
                        <td className="text-right p-2 text-brand-lime">{row.utilization}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-brand-blue/30">
                      <td className="text-left p-2">QB Limit</td>
                      <td className="text-right p-2">500,000</td>
                      <td className="text-right p-2 text-brand-lime">60%</td>
                    </tr>
                    <tr>
                      <td className="text-left p-2">CB Limit</td>
                      <td className="text-right p-2">400,000</td>
                      <td className="text-right p-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-brand-navy text-white border-brand-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Demurrage per Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demurrageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1D59A9" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#FFFFFF" />
                    <YAxis yAxisId="left" orientation="left" stroke="#FFFFFF" />
                    <YAxis yAxisId="right" orientation="right" stroke="#B4D335" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-brand-navy p-3 border border-brand-blue/30 rounded shadow">
                              <p className="text-brand-lime">{`USD/MT: ${payload[1]?.value || 0}`}</p>
                              <p className="text-white">{`Total USD: ${(payload[0]?.value || 0).toLocaleString()}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="totalUSD" fill="#1D59A9" name="Total USD" />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="usdPerMT" 
                      stroke="#B4D335" 
                      strokeWidth={3} 
                      dot={{ fill: '#B4D335', strokeWidth: 2 }}
                      name="USD/MT"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-brand-navy text-white border-brand-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Open Demurrage Claims</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl font-bold text-white mb-2">5</div>
                <p className="text-muted-foreground">Pending resolution</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-brand-navy text-white border-brand-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">QB Limit</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="w-full h-8 bg-brand-blue/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-lime rounded-full" 
                  style={{ width: '60%' }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <Card className="bg-brand-navy text-white border-brand-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">PnL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pnlData} stackOffset="sign">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1D59A9" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#FFFFFF" />
                    <YAxis stroke="#FFFFFF" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const month = payload[0]?.payload?.month || '';
                          const physicalARA = payload[0]?.value || 0;
                          const refinery = payload[1]?.value || 0;
                          const dynamicHedging = payload[2]?.value || 0;
                          
                          return (
                            <div className="bg-brand-navy p-3 border border-brand-blue/30 rounded shadow">
                              <p className="text-white">{`Month: ${month}`}</p>
                              <p className="text-brand-blue">{`Physical ARA: ${physicalARA.toLocaleString()}`}</p>
                              <p className="text-brand-lime">{`Refinery: ${refinery.toLocaleString()}`}</p>
                              <p className="text-white">{`Dynamic Hedging: ${dynamicHedging.toLocaleString()}`}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="physicalARA" stackId="a" fill="#1D59A9" name="Physical ARA" />
                    <Bar dataKey="refinery" stackId="a" fill="#B4D335" name="Refinery" />
                    <Bar dataKey="dynamicHedging" stackId="a" fill="#4A90E2" name="Dynamic Hedging" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
