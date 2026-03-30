import React from 'react';
import { cn } from './card';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface StatusBadgeProps {
  status: 'critical' | 'warning' | 'good' | 'info' | 'error';
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, label, className, showIcon = true }: StatusBadgeProps) {
  const map = {
    critical: {
      colors: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: AlertCircle,
      defaultLabel: 'Critical'
    },
    error: {
      colors: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: AlertCircle,
      defaultLabel: 'Error'
    },
    warning: {
      colors: 'bg-warning/10 text-warning border-warning/20',
      icon: AlertTriangle,
      defaultLabel: 'Warning'
    },
    good: {
      colors: 'bg-success/10 text-success border-success/20',
      icon: CheckCircle2,
      defaultLabel: 'Good'
    },
    info: {
      colors: 'bg-primary/10 text-primary border-primary/20',
      icon: Info,
      defaultLabel: 'Info'
    }
  };

  const config = map[status];
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.colors, className)}>
      {showIcon && <Icon className="w-3.5 h-3.5 mr-1.5" />}
      {label || config.defaultLabel}
    </span>
  );
}
