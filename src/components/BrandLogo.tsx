import React from 'react';
import { TypographyLogo } from './TypographyLogo';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  lightMode?: boolean;
}

/**
 * BrandLogo - Pure Typography Wordmark for PT Lautan Indah Express / LIE Cargo
 * 100% Icon-Free, utilizing high-aesthetic typography design tokens.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  lightMode = false,
}) => {
  return (
    <TypographyLogo
      className={className}
      size={size}
      showSubtitle={showSubtitle}
      theme={lightMode ? 'dark' : 'light'}
      variant="cargo"
      style="velocity"
    />
  );
};

export default BrandLogo;
