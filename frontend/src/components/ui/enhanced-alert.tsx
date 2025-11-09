/**
 * Enhanced Alert Component
 * Eye-catching alerts with icons and animations for different message types
 */

import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X, CalendarX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './alert';

export type AlertVariant = 'error' | 'warning' | 'success' | 'info' | 'conflict';

interface EnhancedAlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-900',
    icon: 'text-red-600',
    title: 'text-red-900',
    message: 'text-red-800',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    message: 'text-yellow-800',
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-900',
    icon: 'text-green-600',
    title: 'text-green-900',
    message: 'text-green-800',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    message: 'text-blue-800',
  },
  conflict: {
    container: 'bg-orange-50 border-orange-300 border-2 text-orange-900 shadow-lg animate-pulse',
    icon: 'text-orange-600',
    title: 'text-orange-900 font-bold',
    message: 'text-orange-800',
  },
};

const defaultIcons = {
  error: <AlertCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  success: <CheckCircle2 className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  conflict: <CalendarX className="h-5 w-5" />,
};

const defaultTitles = {
  error: 'Error',
  warning: 'Warning',
  success: 'Success',
  info: 'Information',
  conflict: '⚠️ Booking Conflict',
};

export function EnhancedAlert({
  variant = 'error',
  title,
  message,
  onClose,
  className,
  icon,
}: EnhancedAlertProps) {
  const styles = variantStyles[variant];
  const defaultIcon = defaultIcons[variant];
  const defaultTitle = defaultTitles[variant];

  return (
    <Alert
      className={cn(
        styles.container,
        'relative pr-10',
        variant === 'conflict' && 'ring-2 ring-orange-200',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          {icon || defaultIcon}
        </div>
        <div className="flex-1 min-w-0">
          {(title || defaultTitle) && (
            <AlertTitle className={cn('mb-1 font-semibold', styles.title)}>
              {title || defaultTitle}
            </AlertTitle>
          )}
          <AlertDescription className={cn('text-sm leading-relaxed', styles.message)}>
            {message}
          </AlertDescription>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              'absolute top-3 right-3 flex-shrink-0 rounded-md p-1 transition-colors',
              'hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2',
              variant === 'error' && 'hover:bg-red-100 focus:ring-red-500',
              variant === 'warning' && 'hover:bg-yellow-100 focus:ring-yellow-500',
              variant === 'success' && 'hover:bg-green-100 focus:ring-green-500',
              variant === 'info' && 'hover:bg-blue-100 focus:ring-blue-500',
              variant === 'conflict' && 'hover:bg-orange-100 focus:ring-orange-500'
            )}
            aria-label="Close alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Alert>
  );
}

/**
 * Helper to detect if a message is a conflict error
 */
export function isConflictError(message: string): boolean {
  const conflictKeywords = [
    'conflict',
    'already has a booking',
    'not available',
    'double booking',
    'scheduling conflict',
  ];
  const lowerMessage = message.toLowerCase();
  return conflictKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Helper to detect error type from message
 */
export function detectErrorType(message: string): AlertVariant {
  if (isConflictError(message)) {
    return 'conflict';
  }
  if (message.toLowerCase().includes('success') || message.toLowerCase().includes('created')) {
    return 'success';
  }
  if (message.toLowerCase().includes('warning') || message.toLowerCase().includes('caution')) {
    return 'warning';
  }
  if (message.toLowerCase().includes('info') || message.toLowerCase().includes('note')) {
    return 'info';
  }
  return 'error';
}

