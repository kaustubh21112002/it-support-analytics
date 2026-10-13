import React from 'react';
import { RotateCcw, Calendar, Search, SlidersHorizontal } from 'lucide-react';
import { Department } from '../../types';

interface FilterBarProps {
  departments?: Department[];
  selectedDepartment?: string | number;
  onDepartmentChange?: (deptId: string) => void;
  selectedPriority?: string;
  onPriorityChange?: (priority: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
  onReset?: () => void;
  extraControls?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  departments = [],
  selectedDepartment = 'All',
  onDepartmentChange,
  selectedPriority = 'All',
  onPriorityChange,
  selectedStatus = 'All',
  onStatusChange,
  searchQuery,
  onSearchChange,
  dateRange = 'FY 2024 (Full Year)',
  onDateRangeChange,
  onReset,
  extraControls
}) => {
  // Count active non-default filters
  let activeFilterCount = 0;
  if (selectedDepartment && selectedDepartment !== 'All') activeFilterCount++;
  if (selectedPriority && selectedPriority !== 'All') activeFilterCount++;
  if (selectedStatus && selectedStatus !== 'All') activeFilterCount++;
  if (searchQuery && searchQuery.trim().length > 0) activeFilterCount++;
  if (dateRange && dateRange !== 'FY 2024 (Full Year)') activeFilterCount++;

  return (
    <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-lg border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        {/* Active filter count indicator */}
        {activeFilterCount > 0 && (
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-brand-50 border border-brand-200/80 text-brand-800 text-[11px] font-semibold">
            <SlidersHorizontal className="w-3 h-3 text-brand-600" />
            <span>{activeFilterCount} Active</span>
          </div>
        )}

        {/* Search */}
        {onSearchChange && (
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tickets, IDs, or issues..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-xs bg-surface-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-text-primary transition-colors"
            />
          </div>
        )}

        {/* Date range */}
        {onDateRangeChange && (
          <div className="flex items-center gap-1.5 bg-surface-subtle border border-border rounded-lg px-2.5 h-9 text-xs text-text-primary">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              aria-label="Date range selector"
              className="bg-transparent border-none text-xs focus:outline-none font-medium text-text-primary cursor-pointer pr-1"
            >
              <option value="FY 2024 (Full Year)">FY 2024 (Full Year: Jan – Dec)</option>
              <option value="Q1 2024">Q1 2024 (Jan – Mar)</option>
              <option value="Q2 2024">Q2 2024 (Apr – Jun)</option>
              <option value="Q3 2024">Q3 2024 (Jul – Sep)</option>
              <option value="Q4 2024">Q4 2024 (Oct – Dec)</option>
            </select>
          </div>
        )}

        {/* Department Filter */}
        {onDepartmentChange && (
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            aria-label="Filter by department"
            className="bg-surface-subtle border border-border rounded-lg px-2.5 h-9 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-colors"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.department_name}
              </option>
            ))}
          </select>
        )}

        {/* Priority Filter */}
        {onPriorityChange && (
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            aria-label="Filter by priority"
            className="bg-surface-subtle border border-border rounded-lg px-2.5 h-9 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-colors"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical (4h target)</option>
            <option value="High">High (8h target)</option>
            <option value="Medium">Medium (24h target)</option>
            <option value="Low">Low (72h target)</option>
          </select>
        )}

        {/* Status Filter */}
        {onStatusChange && (
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by status"
            className="bg-surface-subtle border border-border rounded-lg px-2.5 h-9 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer transition-colors"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        )}

        {extraControls}
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 h-9 text-xs font-medium text-slate-600 hover:text-text-primary bg-surface-subtle hover:bg-slate-200/70 border border-border rounded-lg transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
