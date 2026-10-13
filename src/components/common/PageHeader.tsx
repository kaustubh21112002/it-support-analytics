import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Database } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  showSyntheticDisclaimer?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  showSyntheticDisclaimer = false,
}) => {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-text-secondary mb-2.5" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                {crumb.path && !isLast ? (
                  <Link to={crumb.path} className="hover:text-brand-600 font-medium transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-text-primary font-semibold' : 'text-slate-500'}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">{title}</h1>
            {showSyntheticDisclaimer && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                Governed Benchmark · Seed 42
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">{subtitle}</p>}
        </div>

        {actions && <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
