
import React from 'react';
import { Download, Filter, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockAuditLogs } from '@/data/mockData';

const AuditLogPage = () => {
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
              className="pl-8"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>

        <div className="bg-card rounded-md border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium">Timestamp</th>
                  <th className="text-left p-3 font-medium">Entity Type</th>
                  <th className="text-left p-3 font-medium">Entity ID</th>
                  <th className="text-left p-3 font-medium">Field</th>
                  <th className="text-left p-3 font-medium">Old Value</th>
                  <th className="text-left p-3 font-medium">New Value</th>
                  <th className="text-left p-3 font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {mockAuditLogs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-muted/50">
                    <td className="p-3 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="p-3 capitalize">{log.entityType}</td>
                    <td className="p-3">{log.entityId}</td>
                    <td className="p-3 capitalize">{log.field}</td>
                    <td className="p-3">{log.oldValue || '-'}</td>
                    <td className="p-3">{log.newValue}</td>
                    <td className="p-3">{log.userId}</td>
                  </tr>
                ))}
                {mockAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuditLogPage;
