import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Download, AlertTriangle, Layers, Clock } from 'lucide-react';

interface OperationalBriefingProps {
  whatItIs: string;
  whoItIsFor: string;
  whyItMatters: string;
  primaryAction: {
    label: string;
    to: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  secondaryAction?: {
    label: string;
    to: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  tertiaryAction?: {
    label: string;
    to: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  metricsHighlight?: {
    label: string;
    value: string;
    detail: string;
  };
}

export const OperationalBriefing: React.FC<OperationalBriefingProps> = ({
  whatItIs,
  whoItIsFor,
  whyItMatters,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  metricsHighlight
}) => {
  const PrimaryIcon = primaryAction.icon || ArrowRight;
  const SecondaryIcon = secondaryAction?.icon;
  const TertiaryIcon = tertiaryAction?.icon;

  return (
    <div className="bg-surface rounded-xl border border-slate-200/90 shadow-xs p-5 lg:p-6 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Context Narrative (What, Who, Why) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/80 uppercase">
              OPERATIONAL INTELLIGENCE BRIEFING
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Governed Reference (Seed 42)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* What it is */}
            <div className="space-y-1 border-l-2 border-slate-300 pl-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                WHAT IT IS
              </span>
              <p className="text-xs text-text-primary leading-snug font-medium">
                {whatItIs}
              </p>
            </div>

            {/* Who it is for */}
            <div className="space-y-1 border-l-2 border-slate-300 pl-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                WHO IT IS FOR
              </span>
              <p className="text-xs text-text-primary leading-snug font-medium">
                {whoItIsFor}
              </p>
            </div>

            {/* Why it matters */}
            <div className="space-y-1 border-l-2 border-brand-500 pl-3">
              <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block">
                WHY IT MATTERS
              </span>
              <p className="text-xs text-text-primary leading-snug font-medium">
                {whyItMatters}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: What to do next & Decision Action */}
        <div className="lg:col-span-4 bg-slate-50/70 rounded-lg p-4 border border-slate-200/80 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                WHAT TO DO NEXT
              </span>
              {metricsHighlight && (
                <span className="text-[11px] font-bold text-slate-900 tabular-nums">
                  {metricsHighlight.value}
                </span>
              )}
            </div>

            {metricsHighlight && (
              <p className="text-[11px] text-slate-600 leading-tight mb-3">
                {metricsHighlight.detail}
              </p>
            )}
          </div>

          <div className="space-y-2 pt-1">
            {/* Primary Action Button */}
            <Link
              to={primaryAction.to}
              className="w-full h-9 px-3.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center justify-between transition-colors group"
            >
              <span>{primaryAction.label}</span>
              <PrimaryIcon className="w-4 h-4 text-white/90 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Secondary Action */}
            {secondaryAction && (
              <Link
                to={secondaryAction.to}
                className="w-full h-8 px-3 bg-surface hover:bg-slate-100 text-text-primary font-medium border border-slate-200 rounded-lg text-xs flex items-center justify-between transition-colors"
              >
                <span>{secondaryAction.label}</span>
                {SecondaryIcon && <SecondaryIcon className="w-3.5 h-3.5 text-slate-500" />}
              </Link>
            )}

            {/* Tertiary Link */}
            {tertiaryAction && (
              <div className="text-center pt-1">
                <Link
                  to={tertiaryAction.to}
                  className="text-[11px] font-medium text-slate-500 hover:text-brand-600 hover:underline inline-flex items-center gap-1 transition-colors"
                >
                  {TertiaryIcon && <TertiaryIcon className="w-3 h-3" />}
                  <span>{tertiaryAction.label}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
