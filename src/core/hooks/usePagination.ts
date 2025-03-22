
import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface PaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  useQueryParams?: boolean;
}

export function usePagination(options: PaginationOptions = {}) {
  const {
    defaultPage = 1,
    defaultPageSize = 10,
    useQueryParams = true,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial values from query params if useQueryParams is true
  const initialPage = useQueryParams
    ? parseInt(searchParams.get('page') || defaultPage.toString(), 10)
    : defaultPage;
  
  const initialPageSize = useQueryParams
    ? parseInt(searchParams.get('size') || defaultPageSize.toString(), 10)
    : defaultPageSize;

  const [page, setPageInternal] = useState(initialPage);
  const [pageSize, setPageSizeInternal] = useState(initialPageSize);

  const setPage = useCallback(
    (newPage: number) => {
      setPageInternal(newPage);
      
      if (useQueryParams) {
        searchParams.set('page', newPage.toString());
        setSearchParams(searchParams);
      }
    },
    [searchParams, setSearchParams, useQueryParams]
  );

  const setPageSize = useCallback(
    (newPageSize: number) => {
      setPageSizeInternal(newPageSize);
      // When changing page size, reset to page 1
      setPageInternal(1);
      
      if (useQueryParams) {
        searchParams.set('size', newPageSize.toString());
        searchParams.set('page', '1');
        setSearchParams(searchParams);
      }
    },
    [searchParams, setSearchParams, useQueryParams]
  );

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}
