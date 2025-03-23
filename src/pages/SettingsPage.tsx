
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components';

const SettingsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Configure your user preferences and notification settings.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Configure system-wide settings (admin only).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
