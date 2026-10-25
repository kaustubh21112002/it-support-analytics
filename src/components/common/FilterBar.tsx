import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Calendar, Search, SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';
import { Department } from '../../types';

export interface FilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AccessibleFilterSelectProps {
  id?: string;
  label: string;
  value: string | number;
  options: FilterOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Accessible dropdown implementing WAI-ARIA Listbox Pattern with complete keyboard navigation:
 * - ArrowDown / ArrowUp moves through available non-disabled options.
 * - Home / End jumps to the first / last available option.
 * - Enter / Space activates and selects the focused option.
 * - Escape closes the menu and restores focus to the trigger button.
 * - Tab closes the menu and allows natural focus traversal.
 * - Full ARIA support: aria-haspopup="listbox", aria-expanded, aria-activedescendant, aria-selected, aria-disabled.
 */
export const AccessibleFilterSelect: React.FC<AccessibleFilterSelectProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  icon,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const autoId = React.useId();
  const baseId = id || `filter-select-${autoId.replace(/:/g, '')}`;
  const triggerId = `${baseId}-trigger`;
  const listboxId = `${baseId}-listbox`;

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const activeOption = options.find((o) => String(o.value) === String(value)) || options[0];
  const displayLabel = activeOption ? activeOption.label : String(value);

  // Helper to find the next/previous non-disabled option index
  const findNextIndex = (
    startIndex: number,
    direction: 1 | -1,
    opts: FilterOption[]
  ): number => {
    if (opts.length === 0) return -1;
    let idx = startIndex;
    for (let i = 0; i < opts.length; i++) {
      idx = (idx + direction + opts.length) % opts.length;
      if (!opts[idx].disabled) {
        return idx;
      }
    }
    return startIndex >= 0 && !opts[startIndex]?.disabled ? startIndex : -1;
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Scroll highlighted item into view if listbox is scrollable
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return;
    const listEl = listboxRef.current;
    if (!listEl) return;
    const optionEl = listEl.children[highlightedIndex] as HTMLElement | undefined;
    if (optionEl && typeof optionEl.scrollIntoView === 'function') {
      optionEl.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, highlightedIndex]);

  const handleSelect = (option: FilterOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        const selectedIdx = options.findIndex((o) => String(o.value) === String(value));
        if (selectedIdx >= 0 && !options[selectedIdx].disabled) {
          setHighlightedIndex(selectedIdx);
        } else {
          const firstValid = options.findIndex((o) => !o.disabled);
          setHighlightedIndex(firstValid >= 0 ? firstValid : 0);
        }
      }
      return;
    }

    // Keyboard navigation when open
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => findNextIndex(prev, 1, options));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => findNextIndex(prev, -1, options));
        break;

      case 'Home':
        e.preventDefault();
        const firstValid = options.findIndex((o) => !o.disabled);
        if (firstValid >= 0) setHighlightedIndex(firstValid);
        break;

      case 'End':
        e.preventDefault();
        for (let i = options.length - 1; i >= 0; i--) {
          if (!options[i].disabled) {
            setHighlightedIndex(i);
            break;
          }
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;

      case 'Tab':
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  const isHighlighted = (idx: number) => idx === highlightedIndex;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        onClick={() => {
          if (!isOpen) {
            const selectedIdx = options.findIndex((o) => String(o.value) === String(value));
            setHighlightedIndex(selectedIdx >= 0 && !options[selectedIdx].disabled ? selectedIdx : 0);
          }
          setIsOpen(!isOpen);
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={label}
        aria-activedescendant={isOpen && highlightedIndex >= 0 ? `${listboxId}-opt-${highlightedIndex}` : undefined}
        className={`inline-flex items-center justify-between gap-1.5 bg-surface-subtle border border-border rounded-lg px-2.5 h-9 text-xs font-medium text-text-primary hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer transition-colors shadow-xs ${className}`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon}
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          className="absolute left-0 mt-1 min-w-full w-max max-w-xs bg-surface border border-border rounded-lg shadow-lg z-30 py-1 max-h-60 overflow-y-auto focus:outline-none"
        >
          {options.map((opt, idx) => {
            const isSelected = String(opt.value) === String(value);
            const highlighted = isHighlighted(idx);
            return (
              <li
                key={`${opt.value}-${idx}`}
                id={`${listboxId}-opt-${idx}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled ? true : undefined}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => {
                  if (!opt.disabled) setHighlightedIndex(idx);
                }}
                className={`px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                  opt.disabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : 'cursor-pointer ' +
                      (highlighted
                        ? 'bg-slate-100 text-text-primary'
                        : 'text-text-primary hover:bg-slate-50')
                } ${isSelected ? 'font-semibold text-brand-700 bg-brand-50/70' : ''}`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 ml-2" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export interface FilterBarProps {
  departments?: Department[];
  selectedDepartment?: string | number;
  onDepartmentChange?: (deptId: string) => void;
  selectedPriority?: string;
  onPriorityChange?: (priority: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  selectedSla?: string;
  onSlaChange?: (sla: string) => void;
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
  selectedSla = 'All',
  onSlaChange,
  searchQuery,
  onSearchChange,
  dateRange = 'FY 2024 (Full Year)',
  onDateRangeChange,
  onReset,
  extraControls
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  // Focus entry & restoration for mobile drawer
  useEffect(() => {
    if (isDrawerOpen) {
      wasOpenRef.current = true;
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerButtonRef.current?.focus();
    }
  }, [isDrawerOpen]);

  // Keyboard management: Escape key to close + Tab/Shift+Tab focus trap
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsDrawerOpen(false);
        return;
      }

      if (e.key === 'Tab') {
        const container = drawerPanelRef.current;
        if (!container) return;

        const focusableElements = container.querySelectorAll<HTMLElement>(
          'button:not([disabled]):not([tabindex="-1"]), a[href]:not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // Determine active states
  const isDeptActive =
    selectedDepartment !== undefined &&
    selectedDepartment !== 'All' &&
    selectedDepartment !== '';
  const isPriorityActive =
    selectedPriority !== undefined &&
    selectedPriority !== 'All' &&
    selectedPriority !== '';
  const isStatusActive =
    selectedStatus !== undefined &&
    selectedStatus !== 'All' &&
    selectedStatus !== '';
  const isSlaActive =
    selectedSla !== undefined &&
    selectedSla !== 'All' &&
    selectedSla !== '';
  const isSearchActive =
    searchQuery !== undefined && searchQuery.trim().length > 0;
  const isDateActive =
    dateRange !== undefined && dateRange !== 'FY 2024 (Full Year)';

  // Count active non-default filters
  let activeFilterCount = 0;
  if (isDeptActive) activeFilterCount++;
  if (isPriorityActive) activeFilterCount++;
  if (isStatusActive) activeFilterCount++;
  if (isSlaActive) activeFilterCount++;
  if (isSearchActive) activeFilterCount++;
  if (isDateActive) activeFilterCount++;

  // Handler for Clear All
  const handleClearAll = () => {
    if (onReset) {
      onReset();
    } else {
      if (onSearchChange) onSearchChange('');
      if (onDepartmentChange) onDepartmentChange('All');
      if (onPriorityChange) onPriorityChange('All');
      if (onStatusChange) onStatusChange('All');
      if (onSlaChange) onSlaChange('All');
      if (onDateRangeChange) onDateRangeChange('FY 2024 (Full Year)');
    }
  };

  // Find department label for chips
  const activeDeptObj = isDeptActive
    ? departments.find((d) => String(d.department_id) === String(selectedDepartment))
    : null;
  const deptLabel = activeDeptObj
    ? activeDeptObj.department_name
    : String(selectedDepartment);

  return (
    <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-lg border border-slate-200 mb-6">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Mobile Toolbar (< md): Compact search (if supported) + Filter Drawer trigger + Quick Reset */}
        <div className="flex md:hidden items-center justify-between gap-2 flex-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {onSearchChange && (
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-text-primary transition-colors"
                  aria-label="Search tickets"
                />
              </div>
            )}

            <button
              ref={triggerButtonRef}
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 h-9 text-xs font-semibold bg-surface hover:bg-slate-100 text-text-primary border border-border rounded-lg transition-colors shadow-xs flex-shrink-0"
              aria-label={`Open filters drawer (${activeFilterCount} active)`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Direct Mobile Reset Button when filters are active */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-2.5 h-9 text-xs font-medium text-slate-600 hover:text-text-primary bg-surface hover:bg-slate-100 border border-border rounded-lg transition-colors shadow-xs flex-shrink-0"
              aria-label="Reset all active filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Desktop Toolbar (>= md): Horizontal compact toolbar */}
        <div className="hidden md:flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Active filter count indicator */}
          {activeFilterCount > 0 && (
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded bg-brand-50 border border-brand-200/80 text-brand-800 text-[11px] font-semibold">
              <SlidersHorizontal className="w-3 h-3 text-brand-600" />
              <span>{activeFilterCount} Active</span>
            </div>
          )}

          {/* Desktop Search */}
          {onSearchChange && (
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tickets, IDs, or issues..."
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 h-9 text-xs bg-surface-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-text-primary transition-colors"
                aria-label="Search tickets"
              />
            </div>
          )}

          {/* Desktop Date Range */}
          {onDateRangeChange && (
            <AccessibleFilterSelect
              id="desktop-date-range"
              label="Date range selector"
              value={dateRange}
              onChange={onDateRangeChange}
              icon={<Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
              options={[
                { value: 'FY 2024 (Full Year)', label: 'FY 2024 (Full Year: Jan – Dec)' },
                { value: 'Q1 2024', label: 'Q1 2024 (Jan – Mar)' },
                { value: 'Q2 2024', label: 'Q2 2024 (Apr – Jun)' },
                { value: 'Q3 2024', label: 'Q3 2024 (Jul – Sep)' },
                { value: 'Q4 2024', label: 'Q4 2024 (Oct – Dec)' }
              ]}
            />
          )}

          {/* Desktop Department */}
          {onDepartmentChange && (
            <AccessibleFilterSelect
              id="desktop-department"
              label="Filter by department"
              value={String(selectedDepartment)}
              onChange={onDepartmentChange}
              options={[
                { value: 'All', label: 'All Departments' },
                ...departments.map((d) => ({
                  value: String(d.department_id),
                  label: d.department_name
                }))
              ]}
            />
          )}

          {/* Desktop Priority */}
          {onPriorityChange && (
            <AccessibleFilterSelect
              id="desktop-priority"
              label="Filter by priority"
              value={selectedPriority}
              onChange={onPriorityChange}
              options={[
                { value: 'All', label: 'All Priorities' },
                { value: 'Critical', label: 'Critical (4h target)' },
                { value: 'High', label: 'High (8h target)' },
                { value: 'Medium', label: 'Medium (24h target)' },
                { value: 'Low', label: 'Low (72h target)' }
              ]}
            />
          )}

          {/* Desktop Status */}
          {onStatusChange && (
            <AccessibleFilterSelect
              id="desktop-status"
              label="Filter by status"
              value={selectedStatus}
              onChange={onStatusChange}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active Backlog', label: 'Active Backlog (Open / In Prog / Pend)' },
                { value: 'Open', label: 'Open (Awaiting Triage)' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Resolved', label: 'Resolved' },
                { value: 'Closed', label: 'Closed' }
              ]}
            />
          )}

          {/* Desktop SLA */}
          {onSlaChange && (
            <AccessibleFilterSelect
              id="desktop-sla"
              label="Filter by SLA state"
              value={selectedSla}
              onChange={onSlaChange}
              options={[
                { value: 'All', label: 'All SLA States' },
                { value: 'Breached', label: 'SLA Breached' },
                { value: 'Compliant', label: 'SLA Compliant' },
                { value: 'At Risk', label: 'At Risk (<4h target)' }
              ]}
            />
          )}

          {extraControls}
        </div>

        {/* Desktop Reset Button */}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="hidden md:inline-flex items-center gap-1.5 px-3 h-9 text-xs font-medium text-slate-600 hover:text-text-primary bg-surface-subtle hover:bg-slate-200/70 border border-border rounded-lg transition-colors shadow-xs flex-shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Active Filter Chips: Displays individual removable chips and Clear all */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-200/80 mt-2.5 text-xs">
          <span className="text-[11px] font-semibold text-text-secondary mr-1">Active filters:</span>

          {/* Search chip */}
          {isSearchActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200/90 text-brand-800 text-[11px] font-medium">
              <span>Search: &ldquo;{searchQuery.trim()}&rdquo;</span>
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="p-0.5 hover:bg-brand-200/70 rounded text-brand-700 transition-colors"
                aria-label={`Remove search filter "${searchQuery.trim()}"`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Department chip */}
          {isDeptActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200/90 text-brand-800 text-[11px] font-medium">
              <span>Dept: {deptLabel}</span>
              <button
                type="button"
                onClick={() => onDepartmentChange?.('All')}
                className="p-0.5 hover:bg-brand-200/70 rounded text-brand-700 transition-colors"
                aria-label={`Remove department filter ${deptLabel}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Priority chip */}
          {isPriorityActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200/90 text-brand-800 text-[11px] font-medium">
              <span>Priority: {selectedPriority}</span>
              <button
                type="button"
                onClick={() => onPriorityChange?.('All')}
                className="p-0.5 hover:bg-brand-200/70 rounded text-brand-700 transition-colors"
                aria-label={`Remove priority filter ${selectedPriority}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Status chip */}
          {isStatusActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200/90 text-brand-800 text-[11px] font-medium">
              <span>Status: {selectedStatus}</span>
              <button
                type="button"
                onClick={() => onStatusChange?.('All')}
                className="p-0.5 hover:bg-brand-200/70 rounded text-brand-700 transition-colors"
                aria-label={`Remove status filter ${selectedStatus}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* SLA chip */}
          {isSlaActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200/90 text-brand-800 text-[11px] font-medium">
              <span>SLA: {selectedSla}</span>
              <button
                type="button"
                onClick={() => onSlaChange?.('All')}
                className="p-0.5 hover:bg-brand-200/70 rounded text-brand-700 transition-colors"
                aria-label={`Remove SLA filter ${selectedSla}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Date range chip */}
          {isDateActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200/90 text-brand-800 text-[11px] font-medium">
              <span>Date: {dateRange}</span>
              <button
                type="button"
                onClick={() => onDateRangeChange?.('FY 2024 (Full Year)')}
                className="p-0.5 hover:bg-brand-200/70 rounded text-brand-700 transition-colors"
                aria-label="Reset date range to full year"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Clear all action */}
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 hover:underline ml-1 inline-flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* Mobile Side Drawer Modal (< md) */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-drawer-heading"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            ref={drawerPanelRef}
            className="relative w-full max-w-xs bg-surface h-full shadow-2xl z-10 flex flex-col justify-between overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-subtle">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-600" />
                <h2 id="filter-drawer-heading" className="text-sm font-bold text-text-primary">
                  Filter Options
                </h2>
                {activeFilterCount > 0 && (
                  <span className="bg-brand-100 text-brand-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-slate-200/60 transition-colors"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body - Stacked Form Controls */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Date Range if supported */}
              {onDateRangeChange && (
                <div className="space-y-1.5">
                  <label htmlFor="mobile-date-range" className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Date Range
                  </label>
                  <div className="flex items-center gap-2 bg-surface-subtle border border-border rounded-lg px-3 h-10 text-xs text-text-primary">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <select
                      id="mobile-date-range"
                      value={dateRange}
                      onChange={(e) => onDateRangeChange(e.target.value)}
                      className="w-full bg-transparent border-none text-xs focus:outline-none font-medium text-text-primary cursor-pointer"
                    >
                      <option value="FY 2024 (Full Year)">FY 2024 (Full Year: Jan – Dec)</option>
                      <option value="Q1 2024">Q1 2024 (Jan – Mar)</option>
                      <option value="Q2 2024">Q2 2024 (Apr – Jun)</option>
                      <option value="Q3 2024">Q3 2024 (Jul – Sep)</option>
                      <option value="Q4 2024">Q4 2024 (Oct – Dec)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Department if supported */}
              {onDepartmentChange && (
                <div className="space-y-1.5">
                  <label htmlFor="mobile-department" className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Department
                  </label>
                  <select
                    id="mobile-department"
                    value={selectedDepartment}
                    onChange={(e) => onDepartmentChange(e.target.value)}
                    className="w-full bg-surface-subtle border border-border rounded-lg px-3 h-10 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority if supported */}
              {onPriorityChange && (
                <div className="space-y-1.5">
                  <label htmlFor="mobile-priority" className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Priority Tier
                  </label>
                  <select
                    id="mobile-priority"
                    value={selectedPriority}
                    onChange={(e) => onPriorityChange(e.target.value)}
                    className="w-full bg-surface-subtle border border-border rounded-lg px-3 h-10 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="All">All Priorities</option>
                    <option value="Critical">Critical (4h target)</option>
                    <option value="High">High (8h target)</option>
                    <option value="Medium">Medium (24h target)</option>
                    <option value="Low">Low (72h target)</option>
                  </select>
                </div>
              )}

              {/* Status if supported */}
              {onStatusChange && (
                <div className="space-y-1.5">
                  <label htmlFor="mobile-status" className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    id="mobile-status"
                    value={selectedStatus}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="w-full bg-surface-subtle border border-border rounded-lg px-3 h-10 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active Backlog">Active Backlog (Open / In Prog / Pend)</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              )}

              {/* SLA if supported */}
              {onSlaChange && (
                <div className="space-y-1.5">
                  <label htmlFor="mobile-sla" className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    SLA State
                  </label>
                  <select
                    id="mobile-sla"
                    value={selectedSla}
                    onChange={(e) => onSlaChange(e.target.value)}
                    className="w-full bg-surface-subtle border border-border rounded-lg px-3 h-10 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="All">All SLA States</option>
                    <option value="Breached">SLA Breached</option>
                    <option value="Compliant">SLA Compliant</option>
                    <option value="At Risk">At Risk (&lt;4h target)</option>
                  </select>
                </div>
              )}

              {extraControls && (
                <div className="pt-2 border-t border-border">
                  {extraControls}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border bg-surface-subtle space-y-2">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-full h-10 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold rounded-lg text-xs shadow-xs flex items-center justify-center transition-colors"
              >
                Apply Filters
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleClearAll();
                  }}
                  className="w-full h-9 bg-surface hover:bg-slate-100 text-text-secondary hover:text-text-primary font-medium border border-border rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
