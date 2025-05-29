
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { PaginationMeta } from '@/types/pagination';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PaginationNavProps {
  pagination: PaginationMeta;
  onPageChange?: (page: number) => void;
  className?: string;
}

const PaginationNav: React.FC<PaginationNavProps> = ({
  pagination,
  onPageChange,
  className,
}) => {
  const { currentPage, totalPages, totalItems, pageSize } = pagination;
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [goToPage, setGoToPage] = useState('');
  const [inputError, setInputError] = useState(false);
  
  // Calculate which page numbers to show with optimized ellipsis logic
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    
    // If total pages fit within max visible, show all
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if end is maxed out
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };
  
  const pageNumbers = getPageNumbers();
  const showFirstEllipsis = pageNumbers[0] > 2;
  const showLastEllipsis = pageNumbers[pageNumbers.length - 1] < totalPages - 1;
  
  // Calculate item range for current page
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  if (totalPages <= 1) {
    return null;
  }

  // Create URL with updated page parameter
  const createPageUrl = (page: number) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', page.toString());
    return `${location.pathname}?${searchParams.toString()}`;
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (onPageChange && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };
  
  // Handle go to page input
  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      setInputError(true);
      return;
    }
    
    setInputError(false);
    setGoToPage('');
    handlePageChange(pageNum);
  };
  
  // Handle input enter key
  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if the pagination container is focused or no input is focused
      if (document.activeElement?.tagName === 'INPUT' && document.activeElement !== containerRef.current?.querySelector('input')) {
        return;
      }
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (currentPage > 1) {
            handlePageChange(currentPage - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          handlePageChange(1);
          break;
        case 'End':
          e.preventDefault();
          handlePageChange(totalPages);
          break;
        case 'PageUp':
          e.preventDefault();
          handlePageChange(Math.max(1, currentPage - 5));
          break;
        case 'PageDown':
          e.preventDefault();
          handlePageChange(Math.min(totalPages, currentPage + 5));
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);
  
  return (
    <div 
      ref={containerRef}
      className={cn("space-y-4", className)}
      tabIndex={0}
      role="navigation"
      aria-label="Pagination Navigation"
    >
      {/* Context Information Row */}
      <div className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {totalItems} items
        </div>
      </div>
      
      {/* Navigation Controls Row */}
      <div className="flex items-center justify-between">
        {/* Main Navigation */}
        <div className="flex-1 flex justify-center">
          <Pagination>
            <PaginationContent className="gap-1">
              {/* First Page Button */}
              <PaginationItem>
                <PaginationLink 
                  to={createPageUrl(1)}
                  onClick={() => handlePageChange(1)}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  aria-disabled={currentPage <= 1}
                  aria-label="Go to first page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </PaginationLink>
              </PaginationItem>
              
              {/* Previous Button */}
              <PaginationItem>
                <PaginationLink 
                  to={createPageUrl(Math.max(1, currentPage - 1))}
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  aria-disabled={currentPage <= 1}
                  direction="previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </PaginationLink>
              </PaginationItem>
              
              {/* First page if not in visible range */}
              {pageNumbers[0] > 1 && (
                <>
                  <PaginationItem>
                    <PaginationLink 
                      to={createPageUrl(1)}
                      onClick={() => handlePageChange(1)}
                      isActive={1 === currentPage}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {showFirstEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}
              
              {/* Visible page numbers */}
              {pageNumbers.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    to={createPageUrl(page)}
                    onClick={() => handlePageChange(page)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              {/* Last page if not in visible range */}
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {showLastEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink 
                      to={createPageUrl(totalPages)}
                      onClick={() => handlePageChange(totalPages)}
                      isActive={totalPages === currentPage}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              {/* Next Button */}
              <PaginationItem>
                <PaginationLink 
                  to={createPageUrl(Math.min(totalPages, currentPage + 1))}
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  aria-disabled={currentPage >= totalPages}
                  direction="next"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </PaginationLink>
              </PaginationItem>
              
              {/* Last Page Button */}
              <PaginationItem>
                <PaginationLink 
                  to={createPageUrl(totalPages)}
                  onClick={() => handlePageChange(totalPages)}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  aria-disabled={currentPage >= totalPages}
                  aria-label="Go to last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        
        {/* Go to Page Input - Right Side */}
        <div className="flex items-center gap-2 ml-8">
          <span className="text-sm text-muted-foreground">Go to:</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={goToPage}
            onChange={(e) => {
              setGoToPage(e.target.value);
              setInputError(false);
            }}
            onKeyPress={handleInputKeyPress}
            onFocus={(e) => e.target.select()}
            className={cn(
              "w-16 h-8 text-center text-sm",
              inputError && "border-red-500 focus:border-red-500"
            )}
            placeholder={currentPage.toString()}
            aria-label="Go to page number"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleGoToPage}
            className="h-8 px-3"
            aria-label="Go to specified page"
          >
            Go
          </Button>
        </div>
      </div>
    </div>
  );
};

// Custom PaginationLink component that uses React Router Link
interface PaginationLinkProps extends React.ComponentProps<typeof Link> {
  isActive?: boolean;
  direction?: "previous" | "next";
}

const PaginationLink: React.FC<PaginationLinkProps> = ({
  className,
  isActive,
  direction,
  children,
  ...props
}) => (
  <Link
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "inline-flex h-10 items-center justify-center gap-1 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      {
        "border-primary": isActive,
        "bg-primary text-primary-foreground hover:bg-primary/90": isActive
      },
      className
    )}
    {...props}
  >
    {children}
  </Link>
);

// Ellipsis component
const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);

export default PaginationNav;
