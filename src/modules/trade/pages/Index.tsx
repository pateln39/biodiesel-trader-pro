
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FileText, Package, TrendingUp, BarChart, AlertCircle } from 'lucide-react';
import { Layout } from '@/core/components';
import { Button } from '@/components/ui/button';
import { DashboardCard } from '@/core/components';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  return (
    <Layout>
      <Helmet>
        <title>BioDiesel CTRM Dashboard</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>System Upgrade in Progress</AlertTitle>
          <AlertDescription>
            We are currently upgrading our system architecture. You may notice some improvements in performance.
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Trades"
            description="View and manage physical and paper trades"
            icon={FileText}
            count={12}
            linkTo="/trades"
            linkText="View all trades"
          />
          
          <DashboardCard
            title="Operations"
            description="Track shipments and deliveries"
            icon={Package}
            count={5}
            linkTo="/operations"
            linkText="View operations"
          />
          
          <DashboardCard
            title="Risk Exposure"
            description="Monitor your market risk exposure"
            icon={BarChart}
            count={3}
            linkTo="/risk/exposure"
            linkText="View exposure"
          />
          
          <DashboardCard
            title="P&L"
            description="Track profit and loss across your portfolio"
            icon={TrendingUp}
            linkTo="/risk/pnl"
            linkText="View P&L reports"
          />
        </div>
        
        <div className="mt-6">
          <Link to="/trades/new">
            <Button>New Trade</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
