import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'brand' | 'healthy' | 'warning' | 'critical' | 'neutral';
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  onClick?: () => void;
  badge?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'neutral',
  trend,
  onClick,
  badge
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'healthy':
        return {
          iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
          dot: 'bg-emerald-500',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-700 border border-amber-100',
          dot: 'bg-amber-500',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'critical':
        return {
          iconBg: 'bg-red-50 text-red-700 border border-red-100',
          dot: 'bg-red-500',
          badgeBg: 'bg-red-50 text-red-700 border-red-200',
        };
      case 'brand':
        return {
          iconBg: 'bg-indigo-50 text-brand-600 border border-indigo-100',
          dot: 'bg-brand-500',
          badgeBg: 'bg-indigo-50 text-brand-700 border-indigo-200',
        };
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-600 border border-slate-200',
          dot: 'bg-slate-400',
          badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-xl p-3.5 sm:p-4 border border-border shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-brand-300' : ''
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-1.5 mb-2">
          <p className="text-[10px] xl:text-[11px] font-semibold text-text-secondary uppercase tracking-wider leading-snug line-clamp-2">
            {title}
          </p>
          {Icon && (
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${styles.iconBg}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-text-primary tracking-tight tabular-nums">
            {value}
          </h3>
          {badge && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${styles.badgeBg}`}>
              {badge}
            </span>
          )}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-[11px]">
          {subtitle && (
            <span className="text-text-secondary leading-snug line-clamp-1">
              {subtitle}
            </span>
          )}
          {trend && (
            <div className="flex items-center gap-1 ml-auto flex-shrink-0">
              <span
                className={`font-semibold tabular-nums ${
                  trend.isPositive ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {trend.value}
              </span>
              <span className="text-slate-400 text-[10px]">
                {trend.label || 'vs recorded'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

