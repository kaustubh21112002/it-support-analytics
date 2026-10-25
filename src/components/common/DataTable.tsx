import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, Inbox, RotateCcw } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onResetFilters?: () => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  pageSize = 10,
  emptyMessage = 'No records found matching the current filters.',
  loading = false,
  onRowClick,
  onResetFilters
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el || loading || data.length === 0) {
      setCanScrollRight(false);
      return;
    }
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const shouldShow = hasOverflow && !isAtEnd;
    setCanScrollRight((prev) => (prev !== shouldShow ? shouldShow : prev));
  }, [loading, data.length]);

  useEffect(() => {
    checkScroll();

    let resizeObserver: ResizeObserver | null = null;
    const el = tableContainerRef.current;
    if (el && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(el);
    }

    const timer = setTimeout(checkScroll, 50);
    window.addEventListener('resize', checkScroll);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      return sortDir === 'asc' ? 1 : -1;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startRecord = sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, sortedData.length);

  return (
    <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
      <div className="relative">
        <div
          ref={tableContainerRef}
          onScroll={checkScroll}
          className="overflow-x-auto"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-subtle border-b border-border text-text-secondary font-semibold select-none">
              {columns.map((col, colIdx) => {
                const isSorted = sortKey === col.key;
                const isFirstCol = colIdx === 0;
                const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                const justifyClass = col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start';

                const stickyClass = isFirstCol
                  ? 'sticky left-0 z-20 bg-surface-subtle border-r border-border shadow-[2px_0_5px_-2px_rgba(15,23,42,0.08)]'
                  : '';

                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`py-2.5 sm:py-3 px-3 sm:px-4 ${alignClass} ${stickyClass} ${
                      col.sortable ? 'cursor-pointer hover:text-text-primary transition-colors' : ''
                    } ${col.className || ''}`}
                  >
                    <div className={`flex items-center gap-1.5 ${justifyClass}`}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="flex-shrink-0 text-slate-400">
                          {isSorted ? (
                            sortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-brand-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-brand-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: 6 }).map((_, rIdx) => {
                const widths = ['w-20', 'w-44', 'w-24', 'w-16', 'w-28'];
                return (
                  <tr key={`skeleton-${rIdx}`} className="animate-pulse motion-reduce:animate-none" role="status" aria-hidden="true">
                    {columns.map((col, cIdx) => {
                      const isFirstCol = cIdx === 0;
                      const stickyClass = isFirstCol
                        ? 'sticky left-0 z-10 bg-surface border-r border-border shadow-[2px_0_5px_-2px_rgba(15,23,42,0.08)]'
                        : '';
                      return (
                        <td key={`sk-col-${cIdx}`} className={`py-2.5 sm:py-3.5 px-3 sm:px-4 ${stickyClass}`}>
                          <div className={`h-3.5 bg-slate-200 rounded ${widths[cIdx % widths.length]}`} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center text-text-secondary">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-text-primary">{emptyMessage}</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your filters or search keywords.</p>
                    {onResetFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-brand-600" />
                        <span>Reset all filters</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={String(row[keyField])}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick && onRowClick(row)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  className={`group transition-colors hover:bg-slate-50/80 focus:bg-indigo-50/40 focus:outline-none ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => {
                    const isFirstCol = colIdx === 0;
                    const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                    const stickyClass = isFirstCol
                      ? 'sticky left-0 z-10 bg-surface group-hover:bg-slate-50 group-focus:bg-indigo-50 border-r border-border shadow-[2px_0_5px_-2px_rgba(15,23,42,0.08)]'
                      : '';

                    return (
                      <td key={col.key} className={`py-2.5 sm:py-3 px-3 sm:px-4 text-text-primary ${alignClass} ${stickyClass} ${col.className || ''}`}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Subtle right-edge visual cue indicating horizontal overflow */}
      {canScrollRight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 bottom-0 w-6 sm:w-8 bg-gradient-to-l from-slate-900/[0.07] via-slate-900/[0.02] to-transparent transition-opacity duration-200 z-10"
        />
      )}
    </div>

      {!loading && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border bg-surface-subtle text-xs text-text-secondary gap-2">
          <div>
            Showing <span className="font-semibold text-text-primary tabular-nums">{startRecord}</span> to{' '}
            <span className="font-semibold text-text-primary tabular-nums">{endRecord}</span> of{' '}
            <span className="font-semibold text-text-primary tabular-nums">{sortedData.length}</span> records
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] p-1.5 rounded-md border border-border bg-surface hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-primary shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-text-primary tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] p-1.5 rounded-md border border-border bg-surface hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-text-primary shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
