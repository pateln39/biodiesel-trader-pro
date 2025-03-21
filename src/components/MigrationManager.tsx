
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { 
  migratePaperTrades,
  cleanupPaperTradesFromPhysicalTable 
} from '@/utils/dataMigrationUtils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from './ui/progress';

const MigrationManager = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [cleanupComplete, setCleanupComplete] = useState(false);
  
  // Function to perform the migration
  const handleMigration = async () => {
    try {
      setIsMigrating(true);
      setMigrationError(null);
      setProgress(10);
      
      // Step 1: Migrate paper trades
      const migrationSuccess = await migratePaperTrades();
      setProgress(70);
      
      if (!migrationSuccess) {
        throw new Error("Migration failed");
      }
      
      setMigrationComplete(true);
      setProgress(100);
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsMigrating(false);
    }
  };
  
  // Function to clean up old data after successful migration
  const handleCleanup = async () => {
    try {
      setIsMigrating(true);
      setMigrationError(null);
      setProgress(10);
      
      // Clean up old paper trades from physical_trades table
      const cleanupSuccess = await cleanupPaperTradesFromPhysicalTable();
      setProgress(70);
      
      if (!cleanupSuccess) {
        throw new Error("Cleanup failed");
      }
      
      setCleanupComplete(true);
      setProgress(100);
    } catch (error) {
      console.error('Cleanup error:', error);
      setMigrationError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsMigrating(false);
    }
  };
  
  if (migrationComplete && cleanupComplete) {
    return null; // No UI needed when migration is complete
  }
  
  return (
    <div className="fixed inset-x-0 bottom-0 p-4 z-50 bg-background/80 backdrop-blur-sm border-t">
      <div className="container max-w-xl mx-auto space-y-4">
        {migrationError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Migration Error</AlertTitle>
            <AlertDescription>{migrationError}</AlertDescription>
          </Alert>
        ) : null}
        
        {!migrationComplete ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Migration Required</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>A one-time migration is needed to move paper trades to a new database structure.</p>
              <p>This will improve application performance and help avoid UI freezing issues.</p>
              
              {isMigrating && (
                <div className="space-y-2">
                  <p className="font-medium">Migration in progress...</p>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              <Button 
                onClick={handleMigration} 
                disabled={isMigrating}
                className="mt-2"
              >
                {isMigrating ? 'Migrating...' : 'Start Migration'}
              </Button>
            </AlertDescription>
          </Alert>
        ) : !cleanupComplete ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Migration Completed Successfully</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>The data migration was successful! You can now clean up the old data.</p>
              
              {isMigrating && (
                <div className="space-y-2">
                  <p className="font-medium">Cleanup in progress...</p>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              <Button 
                onClick={handleCleanup} 
                disabled={isMigrating}
                variant="default"
                className="mt-2"
              >
                {isMigrating ? 'Cleaning up...' : 'Clean Up Old Data'}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </div>
  );
};

export default MigrationManager;
