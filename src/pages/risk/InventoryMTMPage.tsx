
import React from 'react';
import Layout from '@/components/Layout';
import InventoryMTMTable from '@/components/risk/InventoryMTMTable';
import ProductLegend from '@/components/operations/storage/ProductLegend';

const InventoryMTMPage = () => {
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Inventory (MTM)</h1>
        <div className="mb-4">
          <ProductLegend />
        </div>
        <InventoryMTMTable />
      </div>
    </Layout>
  );
};

export default InventoryMTMPage;
