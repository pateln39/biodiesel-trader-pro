
import React from 'react';
import Layout from '@/components/Layout';
import StoragePageLayout from '@/components/operations/storage/StoragePageLayout';
import { useStorageState } from '@/hooks/useStorageState';

/**
 * StoragePage component for managing terminal storage tanks and movements
 */
const StoragePage: React.FC = () => {
  return (
    <Layout>
      <StoragePageLayout useStorageState={useStorageState()} />
    </Layout>
  );
};

export default StoragePage;
