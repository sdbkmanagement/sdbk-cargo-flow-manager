
import React from 'react';
import { cn } from '@/lib/utils';

// Skeleton loader moderne pour le chargement
export const ModernSkeleton: React.FC<{
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button';
}> = ({ className, variant = 'text' }) => {
  const variants = {
    text: "h-4 w-full",
    card: "h-32 w-full",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24"
  };

  return (
    <div
      className={cn(
        "skeleton-loader",
        variants[variant],
        className
      )}
    />
  );
};

// Loader de page optimisé
export const PageLoader: React.FC<{ message?: string }> = ({ 
  message = "Chargement..." 
}) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
        <div className="w-8 h-8 border-3 border-primary/40 border-t-transparent rounded-full animate-spin absolute top-2 left-1/2 transform -translate-x-1/2"></div>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse-soft">{message}</p>
    </div>
  </div>
);

// Indicateur de chargement inline
export const InlineLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md' 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn(
      "border-2 border-primary/20 border-t-primary rounded-full animate-spin",
      sizes[size]
    )} />
  );
};

// État vide moderne
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => (
  <div className="text-center py-12">
    {icon && (
      <div className="mx-auto w-12 h-12 mb-4 text-muted-foreground">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    {description && (
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
    )}
    {action}
  </div>
);
