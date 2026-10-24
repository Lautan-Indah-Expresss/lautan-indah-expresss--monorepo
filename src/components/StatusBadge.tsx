import React from 'react';
import { ShipmentStatus } from '../types';
import { Truck, CheckCircle2, AlertTriangle, Clock, Coffee, AlertCircle, PackageCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: ShipmentStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  switch (status) {
    case 'Dalam Perjalanan':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs ${sizeClasses[size]}`}
        >
          {showIcon && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
          Dalam Perjalanan
        </span>
      );

    case 'Tiba di Tujuan':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-sky-50 text-sky-800 border border-sky-200 shadow-xs ${sizeClasses[size]}`}
        >
          {showIcon && <Truck className="w-3.5 h-3.5 text-sky-600" />}
          Tiba di Tujuan
        </span>
      );

    case 'Selesai':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs ${sizeClasses[size]}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          Selesai
        </span>
      );

    case 'Selisih/Claim':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-rose-50 text-rose-800 border border-rose-300 shadow-xs font-semibold ${sizeClasses[size]}`}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
          Selisih/Claim
        </span>
      );

    case 'Istirahat':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-xs ${sizeClasses[size]}`}
        >
          {showIcon && <Coffee className="w-3.5 h-3.5 text-indigo-600" />}
          Istirahat
        </span>
      );

    case 'Terkendala':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-orange-50 text-orange-800 border border-orange-300 shadow-xs ${sizeClasses[size]}`}
        >
          {showIcon && <AlertCircle className="w-3.5 h-3.5 text-orange-600" />}
          Terkendala
        </span>
      );

    case 'Siap Muat':
    default:
      return (
        <span
          className={`inline-flex items-center rounded-md bg-slate-100 text-slate-700 border border-slate-200 shadow-xs ${sizeClasses[size]}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-slate-500" />}
          Siap Muat
        </span>
      );
  }
};
