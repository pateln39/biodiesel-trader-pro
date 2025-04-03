import { ReactNode } from 'react';
import { Dialog } from '@/components/ui/dialog';

/**
 * A utility function to display a confirmation dialog and wait for the user's response
 * @param options The confirmation dialog options
 * @returns A promise that resolves to true if confirmed, false otherwise
 */
export function confirm({
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
}: {
  title?: string;
  description?: string;
  confirmButton?: ReactNode;
}): Promise<boolean> {
  return new Promise((resolve) => {
    // Create a div for our dialog
    const dialogContainer = document.createElement('div');
    document.body.appendChild(dialogContainer);

    // Keep track of dialog state
    let open = true;

    // Function to clean up the dialog when we're done
    const cleanup = () => {
      open = false;
      // Remove the dialog from the DOM after closing animation is complete
      setTimeout(() => {
        document.body.removeChild(dialogContainer);
      }, 300);
    };

    // Handle the confirm action
    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    // Handle the cancel action
    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    // Create the dialog component
    const dialogComponent = (
      <Dialog open={open} onOpenChange={() => handleCancel()}>
        <div className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <button 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
              onClick={handleConfirm}
            >
              Confirm
            </button>
          </div>
        </div>
      </Dialog>
    );

    // Render the dialog component
    // @ts-ignore - Using dynamic React import
    const ReactDOM = require('react-dom/client');
    const root = ReactDOM.createRoot(dialogContainer);
    root.render(dialogComponent);
  });
}
