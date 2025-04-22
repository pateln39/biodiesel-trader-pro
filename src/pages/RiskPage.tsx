
import React from 'react';
import Layout from '@/components/Layout';
import { Helmet } from 'react-helmet-async';

const RiskPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Risk Management | BioDiesel CTRM</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Risk Management</h1>
          <p>This page will contain risk management functionality.</p>
        </div>
      </Layout>
    </>
  );
};

export default RiskPage;
