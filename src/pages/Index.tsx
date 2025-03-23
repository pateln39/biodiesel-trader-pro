
import React from 'react';
import { FileText, TrendingUp, Package, Clock, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import DashboardCard from '@/components/DashboardCard';

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
            icon={FileText}
            count={0}
            linkTo="/trades"
            linkText="View all trades"
          />
          <DashboardCard
            title="Open Operations"
            description="Schedule and manage movements"
            icon={Package}
            count={0}
            linkTo="/operations"
            linkText="View operations"
          />
          <DashboardCard
            title="Exposure"
            description="View current market exposure"
            icon={TrendingUp}
            count={0}
            linkTo="/exposure"
            linkText="View exposure report"
          />
          <DashboardCard
            title="Audit Log"
            description="Track all system changes"
            icon={Clock}
            count={0}
            linkTo="/audit"
            linkText="View audit logs"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="col-span-1">
            <h2 className="text-lg font-medium mb-4">Recent Trades</h2>
            <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center h-[200px]">
              <p className="text-muted-foreground mb-2">No recent trades found</p>
              <a href="/trades/new" className="text-primary hover:underline text-sm">
                Create your first trade
              </a>
            </div>
          </div>
          <div className="col-span-1">
            <h2 className="text-lg font-medium mb-4">Alerts</h2>
            <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center h-[200px]">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No alerts to display</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
