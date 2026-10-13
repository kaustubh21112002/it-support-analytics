import React from 'react';
import { SummaryMetrics } from '../../types';

interface ExecutiveMetricLedgerProps {
  metrics: SummaryMetrics;
}

export const ExecutiveMetricLedger: React.FC<ExecutiveMetricLedgerProps> = ({ metrics }) => {
  const items = [
    {
      label: 'TOTAL VOLUME',
      value: metrics.totalTickets.toLocaleString(),
      detail: '8,000 governed records',
      status: 'neutral',
      group: 'Volume'
    },
    {
      label: 'OPEN BACKLOG',
      value: metrics.openTickets.toLocaleString(),
      detail: '17.4% pending resolution',
      status: 'warning',
      group: 'Volume'
    },
    {
      label: 'RESOLVED OUTCOMES',
      value: metrics.resolvedTickets.toLocaleString(),
      detail: '82.7% resolved denominator',
      status: 'healthy',
      group: 'Volume'
    },
    {
      label: 'MEAN TURNAROUND',
      value: `${metrics.avgResolutionHours}h`,
      detail: '24/7 calendar-hour basis',
      status: 'neutral',
      group: 'Service Level'
    },
    {
      label: 'SLA COMPLIANCE',
      value: `${metrics.slaCompliancePct}%`,
      detail: 'Target: 85.0% threshold met',
      status: 'healthy',
      group: 'Service Level'
    },
    {
      label: 'RECORDED BREACHES',
      value: metrics.slaBreachedCount.toLocaleString(),
      detail: `${metrics.slaBreachPct}% of resolved tickets`,
      status: 'critical',
      group: 'Service Level'
    }
  ];

  return (
    <div className="bg-surface rounded-xl border border-slate-200/90 shadow-xs overflow-hidden mb-6">
      <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span className="font-semibold text-slate-700 tracking-tight">Executive Metric Ledger</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 text-[11px]">Governed Baseline Metrics ($N = 8,000$)</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          Calendar Hours (24/7)
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {items.map((item, idx) => (
          <div key={idx} className="p-4 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {item.label}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.status === 'healthy'
                      ? 'bg-emerald-500'
                      : item.status === 'critical'
                      ? 'bg-red-500'
                      : item.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                />
              </div>

              <div className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums my-1">
                {item.value}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              {item.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
