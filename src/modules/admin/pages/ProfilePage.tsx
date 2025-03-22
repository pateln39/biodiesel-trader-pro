
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/core/components';

const ProfilePage = () => {
  return (
    <Layout>
      <Helmet>
        <title>User Profile</title>
      </Helmet>
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
        
        {/* Profile content will be added here */}
        <div className="p-6 bg-card rounded-md border">
          <p className="text-center text-muted-foreground">
            User profile settings will be displayed here
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
