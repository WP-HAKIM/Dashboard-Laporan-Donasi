# Usability Improvements Implementation Guide

## Overview

Dokumen ini berisi panduan implementasi untuk perbaikan usability yang diidentifikasi dalam Usability Testing Report. Implementasi dibagi menjadi 3 fase berdasarkan prioritas.

## Phase 1: Critical Fixes (1-2 weeks)

### 1.1 Accessibility Improvements

#### A. ARIA Labels Implementation

**File: `frontend/src/components/Common/AccessibleButton.tsx`**
```tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  ariaLabel?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export default function AccessibleButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  ariaLabel,
  disabled = false,
  type = 'button'
}: AccessibleButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {Icon && <Icon className="w-5 h-5 mr-2" aria-hidden="true" />}
      {children}
    </button>
  );
}
```

#### B. Keyboard Navigation Hook

**File: `frontend/src/hooks/useKeyboardNavigation.ts`**
```tsx
import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        options.onEscape?.();
        break;
      case 'Enter':
        if (event.target instanceof HTMLButtonElement || 
            event.target instanceof HTMLAnchorElement) {
          options.onEnter?.();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        options.onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        options.onArrowDown?.();
        break;
      case 'ArrowLeft':
        options.onArrowLeft?.();
        break;
      case 'ArrowRight':
        options.onArrowRight?.();
        break;
      case 'Tab':
        options.onTab?.();
        break;
    }
  }, [options]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

#### C. Screen Reader Support

**File: `frontend/src/components/Common/ScreenReaderOnly.tsx`**
```tsx
import React from 'react';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

export default function ScreenReaderOnly({ children }: ScreenReaderOnlyProps) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}
```

**Add to `frontend/src/index.css`:**
```css
/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus visible for better keyboard navigation */
.focus\:ring-2:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .bg-blue-600 {
    background-color: #0000ff;
  }
  .text-gray-600 {
    color: #000000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .transition-colors {
    transition: none;
  }
  .animate-spin {
    animation: none;
  }
}
```

### 1.2 Mobile Touch Targets

#### A. Touch-Friendly Button Component

**Update: `frontend/src/components/Common/TouchButton.tsx`**
```tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: LucideIcon;
  fullWidth?: boolean;
  disabled?: boolean;
}

export default function TouchButton({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  fullWidth = false,
  disabled = false
}: TouchButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center
    min-h-[44px] min-w-[44px]
    px-4 py-3
    font-medium rounded-lg
    transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2
    touch-manipulation
    ${fullWidth ? 'w-full' : ''}
  `;
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
}
```

#### B. Mobile Navigation Improvements

**Update: `frontend/src/components/Layout/Sidebar.tsx`**
```tsx
// Add mobile-specific improvements
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [touchStart, setTouchStart] = useState(0);
const [touchEnd, setTouchEnd] = useState(0);

// Swipe gesture handling
const handleTouchStart = (e: React.TouchEvent) => {
  setTouchStart(e.targetTouches[0].clientX);
};

const handleTouchMove = (e: React.TouchEvent) => {
  setTouchEnd(e.targetTouches[0].clientX);
};

const handleTouchEnd = () => {
  if (!touchStart || !touchEnd) return;
  
  const distance = touchStart - touchEnd;
  const isLeftSwipe = distance > 50;
  const isRightSwipe = distance < -50;
  
  if (isLeftSwipe && isMobileMenuOpen) {
    setIsMobileMenuOpen(false);
  }
  if (isRightSwipe && !isMobileMenuOpen) {
    setIsMobileMenuOpen(true);
  }
};

// Add to JSX
<div
  className="lg:hidden"
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {/* Mobile menu content */}
</div>
```

## Phase 2: UX Enhancements (2-3 weeks)

### 2.1 Breadcrumb Navigation

**File: `frontend/src/components/Common/Breadcrumb.tsx`**
```tsx
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex mb-4">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
            aria-label="Go to dashboard"
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </button>
        </li>
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {item.active ? (
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={() => item.href && onNavigate?.(item.href)}
                  className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                >
                  {item.label}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

### 2.2 Form Progress Indicator

**File: `frontend/src/components/Common/FormProgress.tsx`**
```tsx
import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface FormProgressProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export default function FormProgress({ steps, currentStep, completedSteps }: FormProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${isCompleted ? 'bg-green-600 text-white' : ''}
                    ${isCurrent ? 'bg-blue-600 text-white' : ''}
                    ${isUpcoming ? 'bg-gray-200 text-gray-600' : ''}
                  `}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    isCurrent ? 'text-blue-600' : 
                    isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 2.3 Auto-save Hook

**File: `frontend/src/hooks/useAutoSave.ts`**
```tsx
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface AutoSaveOptions {
  delay?: number;
  onSave: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
}

export function useAutoSave<T>(data: T, options: AutoSaveOptions) {
  const { delay = 30000, onSave, onError } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only auto-save if data has changed
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await onSave(data);
        setLastSaved(new Date());
        previousDataRef.current = data;
        toast.success('Draft saved automatically', {
          duration: 2000,
          position: 'bottom-right'
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
        onError?.(error as Error);
        toast.error('Failed to save draft');
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, onSave, onError]);

  const saveNow = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    try {
      setIsSaving(true);
      await onSave(data);
      setLastSaved(new Date());
      previousDataRef.current = data;
      toast.success('Saved successfully');
    } catch (error) {
      console.error('Manual save failed:', error);
      onError?.(error as Error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    lastSaved,
    saveNow
  };
}
```

## Phase 3: Performance & Polish (1-2 weeks)

### 3.1 Skeleton Loading Components

**File: `frontend/src/components/Common/SkeletonLoader.tsx`**
```tsx
import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function SkeletonLine({ className = '', width = '100%', height = '1rem' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ width, height }}
      aria-label="Loading..."
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
      <SkeletonLine height="1.5rem" className="mb-3" />
      <SkeletonLine width="80%" className="mb-2" />
      <SkeletonLine width="60%" className="mb-4" />
      <div className="flex space-x-2">
        <SkeletonLine width="80px" height="2rem" />
        <SkeletonLine width="80px" height="2rem" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonLine key={i} height="1.25rem" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 border-b border-gray-200 last:border-b-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <SkeletonLine key={colIndex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3.2 Enhanced Empty States

**File: `frontend/src/components/Common/EmptyState.tsx`**
```tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          <button
            onClick={action.onClick}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${action.variant === 'secondary' 
                ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {action.label}
          </button>
        )}
        
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
```

### 3.3 Pull-to-Refresh Hook

**File: `frontend/src/hooks/usePullToRefresh.ts`**
```tsx
import { useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5
}: PullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, (currentY.current - startY.current) / resistance);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, isRefreshing]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isPulling
  };
}
```

## Implementation Checklist

### Phase 1 (Critical)
- [ ] Implement AccessibleButton component
- [ ] Add keyboard navigation hook
- [ ] Create screen reader support
- [ ] Update CSS for accessibility
- [ ] Implement TouchButton component
- [ ] Add mobile swipe gestures
- [ ] Test with screen readers
- [ ] Test keyboard navigation
- [ ] Test on mobile devices

### Phase 2 (UX Enhancements)
- [ ] Create Breadcrumb component
- [ ] Implement FormProgress component
- [ ] Add auto-save functionality
- [ ] Update forms to use new components
- [ ] Test form workflows
- [ ] Test auto-save functionality

### Phase 3 (Performance)
- [ ] Create skeleton loading components
- [ ] Implement enhanced empty states
- [ ] Add pull-to-refresh functionality
- [ ] Update all loading states
- [ ] Test performance improvements
- [ ] Optimize bundle size

## Testing Guidelines

### Accessibility Testing
1. **Screen Reader Testing**:
   - Test with NVDA (Windows)
   - Test with VoiceOver (Mac)
   - Verify all interactive elements are announced

2. **Keyboard Navigation**:
   - Tab through all interactive elements
   - Test arrow key navigation in lists
   - Verify focus indicators are visible

3. **Color Contrast**:
   - Use WebAIM Contrast Checker
   - Ensure 4.5:1 ratio for normal text
   - Ensure 3:1 ratio for large text

### Mobile Testing
1. **Touch Targets**:
   - Verify minimum 44px touch targets
   - Test with finger navigation
   - Check spacing between elements

2. **Gestures**:
   - Test swipe navigation
   - Test pull-to-refresh
   - Verify gesture conflicts

### Performance Testing
1. **Loading States**:
   - Test skeleton loading
   - Verify loading indicators
   - Check perceived performance

2. **Bundle Size**:
   - Monitor bundle size changes
   - Use webpack-bundle-analyzer
   - Optimize imports

## Deployment Notes

1. **CSS Updates**: Ensure new CSS classes are included in build
2. **Bundle Size**: Monitor impact on bundle size
3. **Browser Support**: Test on target browsers
4. **Performance**: Monitor Core Web Vitals
5. **Accessibility**: Run automated accessibility tests

---

**Implementation Timeline**: 4-5 weeks  
**Priority**: High (Accessibility), Medium (UX), Low (Polish)  
**Testing Required**: Comprehensive accessibility and mobile testing