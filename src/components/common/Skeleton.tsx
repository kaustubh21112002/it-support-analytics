import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

/**
 * Base accessible skeleton primitive.
 * Supports text, circular, and rectangular variants.
 * Uses restrained neutral colors and respects prefers-reduced-motion.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'rounded h-3.5',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  return (
    <div
      role="status"
      aria-hidden="true"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style
      }}
      className={`bg-slate-200 dark:bg-slate-750 animate-pulse motion-reduce:animate-none ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
};

/**
 * KPI Metric Card skeleton matching KpiCard layout exactly.
 */
export const KpiCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`bg-surface rounded-xl border border-border p-4 sm:p-5 shadow-xs flex flex-col justify-between ${className}`}
      role="status"
      aria-label="Loading metric..."
    >
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-24 h-3.5" />
        <Skeleton variant="rectangular" className="w-8 h-8 rounded-lg" />
      </div>
      <div className="mt-4 mb-2">
        <Skeleton variant="text" className="w-32 h-8 rounded-md" />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Skeleton variant="text" className="w-16 h-3 rounded" />
        <Skeleton variant="text" className="w-24 h-3 rounded" />
      </div>
    </div>
  );
};

/**
 * Chart Card skeleton matching ChartCard layout.
 */
export const ChartCardSkeleton: React.FC<{
  title?: string;
  className?: string;
  height?: number;
}> = ({ title, className = '', height = 260 }) => {
  return (
    <div
      className={`bg-surface rounded-xl border border-border p-4 sm:p-6 shadow-xs flex flex-col justify-between ${className}`}
      role="status"
      aria-label={title ? `Loading ${title}...` : 'Loading chart analytics...'}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1.5">
          <Skeleton variant="text" className="w-48 h-4" />
          <Skeleton variant="text" className="w-32 h-3" />
        </div>
        <Skeleton variant="rectangular" className="w-16 h-6 rounded-md" />
      </div>

      {/* Simulated chart canvas bars/waves */}
      <div
        style={{ height: `${height}px` }}
        className="w-full bg-slate-50/70 rounded-lg p-4 flex items-end justify-between gap-2 border border-slate-100"
      >
        <div className="h-1/3 w-full bg-slate-200/80 rounded-t animate-pulse motion-reduce:animate-none" />
        <div className="h-2/3 w-full bg-slate-200/80 rounded-t animate-pulse motion-reduce:animate-none" />
        <div className="h-1/2 w-full bg-slate-200/80 rounded-t animate-pulse motion-reduce:animate-none" />
        <div className="h-4/5 w-full bg-slate-200/80 rounded-t animate-pulse motion-reduce:animate-none" />
        <div className="h-3/5 w-full bg-slate-200/80 rounded-t animate-pulse motion-reduce:animate-none" />
        <div className="h-full w-full bg-slate-200/80 rounded-t animate-pulse motion-reduce:animate-none" />
        <div className="h-3/4 w-full bg-slate-200/80 rounded-t animate-pulse motion-reduce:animate-none" />
      </div>

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-border">
        <Skeleton variant="text" className="w-28 h-3" />
        <Skeleton variant="text" className="w-20 h-3" />
      </div>
    </div>
  );
};

/**
 * Table skeleton matching DataTable structure and responsive density.
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 6, columns = 5, className = '' }) => {
  return (
    <div
      className={`border border-border rounded-xl overflow-hidden bg-surface shadow-xs ${className}`}
      role="status"
      aria-label="Loading table data..."
    >
      {/* Table Toolbar Skeleton */}
      <div className="p-3 sm:p-4 border-b border-border bg-surface-subtle flex items-center justify-between gap-3">
        <Skeleton variant="text" className="w-32 h-4" />
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-24 h-7 rounded-lg" />
          <Skeleton variant="rectangular" className="w-20 h-7 rounded-lg" />
        </div>
      </div>

      {/* Table Header */}
      <div className="border-b border-border bg-slate-100/70 p-3 sm:px-4 grid grid-cols-5 gap-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`th-sk-${i}`} variant="text" className="h-3.5 w-3/4" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={`tr-sk-${rIdx}`} className="p-3 sm:px-4 grid grid-cols-5 gap-3 items-center">
            <Skeleton variant="text" className="h-4 w-4/5" />
            <Skeleton variant="text" className="h-3.5 w-full" />
            <Skeleton variant="rectangular" className="h-5 w-20 rounded-full" />
            <Skeleton variant="rectangular" className="h-5 w-16 rounded-full" />
            <Skeleton variant="text" className="h-3.5 w-1/2" />
          </div>
        ))}
      </div>

      {/* Table Footer */}
      <div className="p-3 border-t border-border bg-surface-subtle flex items-center justify-between">
        <Skeleton variant="text" className="w-28 h-3" />
        <Skeleton variant="rectangular" className="w-36 h-6 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Full Dashboard Skeleton for Executive Service Overview, SLA Command Center, etc.
 */
export const DashboardSkeleton: React.FC<{ pageTitle?: string }> = ({
  pageTitle = 'Dashboard Analytics'
}) => {
  return (
    <div
      className="space-y-4 sm:space-y-6"
      role="status"
      aria-busy="true"
      aria-label={`Loading ${pageTitle}...`}
    >
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton variant="text" className="w-48 sm:w-64 h-7" />
            <Skeleton variant="rectangular" className="w-28 h-5 rounded-full" />
          </div>
          <Skeleton variant="text" className="w-64 sm:w-96 h-3.5" />
        </div>
        <Skeleton variant="rectangular" className="w-36 h-9 rounded-lg" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-surface rounded-xl border border-border p-3 sm:p-4 shadow-xs flex flex-wrap items-center gap-3">
        <Skeleton variant="rectangular" className="w-40 h-8 rounded-lg" />
        <Skeleton variant="rectangular" className="w-36 h-8 rounded-lg" />
        <Skeleton variant="rectangular" className="w-32 h-8 rounded-lg" />
        <div className="ml-auto">
          <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCardSkeleton key={`dash-kpi-${i}`} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <ChartCardSkeleton className="lg:col-span-2" height={280} />
        <ChartCardSkeleton className="lg:col-span-1" height={280} />
      </div>

      {/* Exception Table Skeleton */}
      <TableSkeleton rows={4} columns={5} />
    </div>
  );
};

/**
 * Ticket Detail Skeleton matching AgentTicketDetail / EmployeeTicketDetail layout.
 */
export const TicketDetailSkeleton: React.FC<{ ticketId?: string }> = ({ ticketId }) => {
  return (
    <div
      className="max-w-6xl mx-auto space-y-4 sm:space-y-6"
      role="status"
      aria-busy="true"
      aria-label={`Loading ticket ${ticketId || ''}...`}
    >
      {/* Return Link Placeholder */}
      <div className="w-32">
        <Skeleton variant="text" className="w-24 h-4" />
      </div>

      {/* Ticket Header Banner Skeleton */}
      <div className="bg-surface rounded-xl border border-border p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Skeleton variant="rectangular" className="w-24 h-6 rounded-md" />
            <Skeleton variant="rectangular" className="w-20 h-5 rounded-full" />
            <Skeleton variant="rectangular" className="w-20 h-5 rounded-full" />
          </div>
          <Skeleton variant="rectangular" className="w-32 h-8 rounded-lg" />
        </div>
        <Skeleton variant="text" className="w-3/4 sm:w-1/2 h-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
          <Skeleton variant="text" className="w-24 h-3.5" />
          <Skeleton variant="text" className="w-24 h-3.5" />
          <Skeleton variant="text" className="w-24 h-3.5" />
          <Skeleton variant="text" className="w-24 h-3.5" />
        </div>
      </div>

      {/* 2-Column Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Timeline & Conversation (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-surface rounded-xl border border-border p-4 sm:p-6 shadow-xs space-y-4">
            <Skeleton variant="text" className="w-36 h-4 mb-2" />
            {/* Timeline item 1 */}
            <div className="p-3.5 rounded-lg border border-border bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" className="w-28 h-3.5" />
                <Skeleton variant="text" className="w-20 h-3" />
              </div>
              <Skeleton variant="text" className="w-full h-3" />
              <Skeleton variant="text" className="w-3/4 h-3" />
            </div>
            {/* Timeline item 2 */}
            <div className="p-3.5 rounded-lg border border-border bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" className="w-28 h-3.5" />
                <Skeleton variant="text" className="w-20 h-3" />
              </div>
              <Skeleton variant="text" className="w-5/6 h-3" />
            </div>
          </div>

          {/* Reply composer placeholder */}
          <div className="bg-surface rounded-xl border border-border p-4 sm:p-5 shadow-xs space-y-3">
            <Skeleton variant="text" className="w-40 h-3.5" />
            <Skeleton variant="rectangular" className="w-full h-24 rounded-lg" />
            <div className="flex justify-end">
              <Skeleton variant="rectangular" className="w-28 h-8 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Right Column: Triage Form Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface rounded-xl border border-border p-4 sm:p-5 shadow-xs space-y-4">
            <Skeleton variant="text" className="w-28 h-4 mb-2" />
            <div className="space-y-3">
              <div>
                <Skeleton variant="text" className="w-20 h-3 mb-1" />
                <Skeleton variant="rectangular" className="w-full h-9 rounded-lg" />
              </div>
              <div>
                <Skeleton variant="text" className="w-20 h-3 mb-1" />
                <Skeleton variant="rectangular" className="w-full h-9 rounded-lg" />
              </div>
              <div>
                <Skeleton variant="text" className="w-20 h-3 mb-1" />
                <Skeleton variant="rectangular" className="w-full h-9 rounded-lg" />
              </div>
              <Skeleton variant="rectangular" className="w-full h-9 rounded-lg mt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
