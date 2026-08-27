import { useState, useCallback } from 'react';

const PAGE_SIZE_KEY = 'kuiklo_admin_page_size';

export function usePageSize(defaultSize = 50) {
  const [pageSize, setPageSizeState] = useState(() => {
    const saved = localStorage.getItem(PAGE_SIZE_KEY);
    return saved ? parseInt(saved, 10) : defaultSize;
  });

  const setPageSize = useCallback((size) => {
    setPageSizeState(size);
    localStorage.setItem(PAGE_SIZE_KEY, size.toString());
  }, []);

  return [pageSize, setPageSize];
}
