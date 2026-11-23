import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

export interface TeamBadgeProps {
  teamName?: string;
  logoUrl?: string | null;
  side?: 'red' | 'blue' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  teamName = 'Team',
  logoUrl,
  side = 'neutral',
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const sizeClasses = {
    sm: { container: 'w-7 h-7 rounded-lg', icon: 'w-3.5 h-3.5', padding: 'p-0.5' },
    md: { container: 'w-9 h-9 rounded-lg', icon: 'w-5 h-5', padding: 'p-1' },
    lg: { container: 'w-12 h-12 rounded-xl', icon: 'w-6 h-6', padding: 'p-1.5' },
    xl: { container: 'w-16 h-16 rounded-xl', icon: 'w-8 h-8', padding: 'p-2' },
  }[size];

  const sideStyle: React.CSSProperties =
    side === 'red'
      ? { backgroundColor: 'var(--drone-red-solid)', color: '#FFFFFF' }
      : side === 'blue'
      ? { backgroundColor: 'var(--drone-blue-solid)', color: '#FFFFFF' }
      : {
          backgroundColor: 'var(--court-control-bg)',
          border: '1px solid var(--court-line)',
          color: 'var(--court-ink-secondary)',
        };

  const hasValidLogo = !!logoUrl && !imgError;

  return (
    <div
      className={`relative flex items-center justify-center font-bold overflow-hidden flex-shrink-0 ${sizeClasses.container} ${className}`}
      style={sideStyle}
      title={teamName}
    >
      {hasValidLogo ? (
        <img
          src={logoUrl}
          alt={teamName}
          className={`w-full h-full object-contain ${sizeClasses.padding}`}
          onError={() => setImgError(true)}
        />
      ) : (
        <Shield className={sizeClasses.icon} />
      )}
    </div>
  );
};
