
import React from 'react';
import Layout from '@/components/Layout';
import InventoryMTMTable from '@/components/risk/InventoryMTMTable';

const InventoryMTMPage = () => {
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Inventory (MTM)</h1>
        <InventoryMTMTable />
      </div>
    </Layout>
  );
};

export default InventoryMTMPage;
