import React from 'react';
import { TrendingUp, Package, Clock, AlertTriangle, BarChart3, DollarSign } from 'lucide-react';
import Layout from '@/components/Layout';
import DashboardCard from '@/components/DashboardCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LineChart } from 'recharts';

const physicalPositionData = [
  { month: 'Jan', UCOME: 150, FAME: 330, RME1: 330, RME2: 240 },
  { month: 'Feb', UCOME: 180, FAME: 320, RME1: 240, RME2: 250 },
  { month: 'Mar', UCOME: 150, FAME: 390, RME1: 230, RME2: 210 },
  { month: 'Apr', UCOME: 140, FAME: 260, RME1: 290, RME2: 200 },
  { month: 'May', UCOME: 190, FAME: 260, RME1: 310, RME2: 260 },
];

const tradesPerMonthData = [
  { month: 'Aug', count: 60, volume: 10 },
  { month: 'Sep', count: 65, volume: 15 },
  { month: 'Oct', count: 75, volume: 18 },
  { month: 'Nov', count: 90, volume: 25 },
  { month: 'Dec', count: 70, volume: 20 },
  { month: 'Jan', count: 80, volume: 22 },
  { month: 'Feb', count: 95, volume: 28 },
];

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
          {/* Physical Position Table */}
          <Card className="bg-brand-navy text-white border-brand-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Physical Position by Month and Grade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-blue/30 bg-brand-blue/20">
                      <th className="text-left p-2 text-brand-lime font-semibold">Month</th>
                      <th className="text-right p-2 text-brand-lime font-semibold">UCOME</th>
                      <th className="text-right p-2 text-brand-lime font-semibold">FAME</th>
                      <th className="text-right p-2 text-brand-lime font-semibold">RME</th>
                      <th className="text-right p-2 text-brand-lime font-semibold">RME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {physicalPositionData.map((row) => (
                      <tr key={row.month} className="border-b border-brand-blue/30 hover:bg-brand-blue/10 transition-colors">
                        <td className="text-left p-2 font-medium">{row.month}</td>
                        <td className="text-right p-2 font-bold text-white">{row.UCOME}</td>
                        <td className="text-right p-2 font-bold text-white">{row.FAME}</td>
                        <td className="text-right p-2 font-bold text-white">{row.RME1}</td>
                        <td className="text-right p-2 font-bold text-white">{row.RME2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Trades per Month */}
          <Card className="bg-brand-navy text-white border-brand-blue/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Trades per Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tradesPerMonthData}>
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
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* QIU Table */}
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
          
          {/* Demurrage Chart */}
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
          {/* Open Demurrage Claims */}
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
          
          {/* QB Limit */}
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
          {/* PnL Chart */}
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
