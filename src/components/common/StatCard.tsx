import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70',
  trend,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl bg-white dark:bg-slate-900 p-4 relative overflow-hidden transition-all duration-150 group border border-slate-200/90 dark:border-slate-800 shadow-subtle',
        onClick && 'cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-card',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <h3 className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
            {value}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate pt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <div className={clsx('p-2.5 rounded-lg shrink-0 transition-transform group-hover:scale-105', iconBg)}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5 text-[11px] font-medium">
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold border',
              trend.isPositive
                ? 'text-slate-800 bg-slate-100 dark:text-slate-200 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60'
            )}
          >
            {trend.isPositive ? <TrendingUp className="w-3 h-3 text-slate-600 dark:text-slate-400" /> : <TrendingDown className="w-3 h-3" />}
            {trend.isPositive ? `+${trend.value}%` : `-${trend.value}%`}
          </span>
          <span className="text-slate-400 truncate">{trend.label || 'vs período anterior'}</span>
        </div>
      )}
    </div>
  );
};
