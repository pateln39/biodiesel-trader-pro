import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { PaginationMeta } from '@/types/pagination';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationNavProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

const PaginationNav: React.FC<PaginationNavProps> = ({
  pagination,
  onPageChange,
  className,
}) => {
  const { currentPage, totalPages } = pagination;
  const location = useLocation();
  
  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start if end is maxed out
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };
  
  const pageNumbers = getPageNumbers();
  
  if (totalPages <= 1) {
    return null;
  }

  // Create URL with updated page parameter
  const createPageUrl = (page: number) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', page.toString());
    return `${location.pathname}?${searchParams.toString()}`;
  };
  
  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink 
            to={createPageUrl(Math.max(1, currentPage - 1))}
            onClick={(e) => {
              e.preventDefault();
              onPageChange(Math.max(1, currentPage - 1));
            }}
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
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(1);
                }}
                isActive={1 === currentPage}
              >
                1
              </PaginationLink>
            </PaginationItem>
            {pageNumbers[0] > 2 && (
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
              onClick={(e) => {
                e.preventDefault();
                onPageChange(page);
              }}
              isActive={page === currentPage}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        
        {/* Last page if not in visible range */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink 
                to={createPageUrl(totalPages)}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(totalPages);
                }}
                isActive={totalPages === currentPage}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}
        
        <PaginationItem>
          <PaginationLink 
            to={createPageUrl(Math.min(totalPages, currentPage + 1))}
            onClick={(e) => {
              e.preventDefault();
              onPageChange(Math.min(totalPages, currentPage + 1));
            }}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            aria-disabled={currentPage >= totalPages}
            direction="next"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
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

// Ellipsis component remains unchanged
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
