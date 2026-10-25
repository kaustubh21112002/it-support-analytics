import React from 'react';
import { Info } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  takeaway?: string;
  action?: React.ReactNode;
  height?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  takeaway,
  action,
  height = 'h-72'
}) => {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-card p-5 sm:p-6 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">{title}</h4>
            {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>

        <div className={`w-full ${height} relative min-w-0 min-h-0`}>
          {children}
        </div>
      </div>

      {takeaway && (
        <div
          className="mt-4 flex items-start gap-2 bg-surface-subtle border border-border-subtle p-3 rounded-lg text-xs text-text-secondary"
          role="note"
          aria-label="Observed finding"
        >
          <Info className="w-3.5 h-3.5 text-brand-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="leading-relaxed">
            <span className="font-semibold text-text-primary">Observed Finding: </span>
            <span>{takeaway}</span>
          </div>
        </div>
      )}
    </div>
  );
};
