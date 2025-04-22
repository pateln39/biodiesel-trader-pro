
import React from 'react';
import Layout from '@/components/Layout';
import { Helmet } from 'react-helmet-async';

const TradesPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Trades | BioDiesel CTRM</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Trades</h1>
          <p>This page will contain trade management functionality.</p>
        </div>
      </Layout>
    </>
  );
};

export default TradesPage;
