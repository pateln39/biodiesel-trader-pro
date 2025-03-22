
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FileQuestion } from 'lucide-react';
import { Layout } from '@/core/components';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <Layout>
      <Helmet>
        <title>Page Not Found</title>
      </Helmet>
      
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <FileQuestion className="h-24 w-24 text-muted-foreground mb-6" />
        
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/">Back to Dashboard</Link>
          </Button>
          
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
