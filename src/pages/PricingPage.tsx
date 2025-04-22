
import React from 'react';
import Layout from '@/components/Layout';
import { Helmet } from 'react-helmet-async';

const PricingPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Pricing | BioDiesel CTRM</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Pricing</h1>
          <p>This page will contain pricing functionality.</p>
        </div>
      </Layout>
    </>
  );
};

export default PricingPage;
