import React from 'react';

export type LogoVariant = 'cargo' | 'driver' | 'express' | 'corporate';
export type LogoTheme = 'light' | 'dark' | 'auto';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type LogoStyle = 'velocity' | 'architectural' | 'clean';

export interface TypographyLogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  style?: LogoStyle;
  size?: LogoSize;
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
}

export const TypographyLogo: React.FC<TypographyLogoProps> = ({
  variant = 'cargo',
  theme = 'light',
  style = 'velocity',
  size = 'md',
  showSubtitle = true,
  subtitle,
  className = '',
}) => {
  const isDark = theme === 'dark';

  // Typography sizing scale
  const sizeConfig = {
    xs: {
      lie: 'text-base',
      word: 'text-sm',
      slash: 'text-xs',
      sub: 'text-[8px] tracking-[0.2em]',
      gap: 'gap-1',
      subMargin: 'mt-0.5',
    },
    sm: {
      lie: 'text-lg',
      word: 'text-base',
      slash: 'text-sm',
      sub: 'text-[9px] tracking-[0.22em]',
      gap: 'gap-1.5',
      subMargin: 'mt-0.5',
    },
    md: {
      lie: 'text-2xl',
      word: 'text-xl',
      slash: 'text-lg',
      sub: 'text-[10px] tracking-[0.24em]',
      gap: 'gap-2',
      subMargin: 'mt-1',
    },
    lg: {
      lie: 'text-3xl',
      word: 'text-2xl',
      slash: 'text-xl',
      sub: 'text-xs tracking-[0.25em]',
      gap: 'gap-2.5',
      subMargin: 'mt-1.5',
    },
    xl: {
      lie: 'text-4xl',
      word: 'text-3xl',
      slash: 'text-2xl',
      sub: 'text-xs tracking-[0.26em]',
      gap: 'gap-3',
      subMargin: 'mt-1.5',
    },
    '2xl': {
      lie: 'text-5xl',
      word: 'text-4xl',
      slash: 'text-3xl',
      sub: 'text-sm tracking-[0.28em]',
      gap: 'gap-3.5',
      subMargin: 'mt-2',
    },
  }[size];

  // Secondary word based on variant
  const secondaryWord = {
    cargo: 'CARGO',
    driver: 'DRIVER',
    express: 'EXPRESS',
    corporate: 'LOGISTICS',
  }[variant];

  // Default subtitle per variant
  const defaultSubtitle = {
    cargo: 'PT LAUTAN INDAH EXPRESS',
    driver: 'APLIKASI TUGAS PENGEMUDI',
    express: 'SMART B2B LOGISTICS',
    corporate: 'PT LAUTAN INDAH EXPRESS',
  }[variant];

  const resolvedSubtitle = subtitle ?? defaultSubtitle;

  return (
    <div
      className={`inline-flex flex-col select-none leading-none ${className}`}
      aria-label={`LIE ${secondaryWord} Logo`}
    >
      {style === 'velocity' ? (
        /* Velocity Style: Dynamic italics with cyan-blue gradient and forward slash */
        <div className={`flex items-baseline ${sizeConfig.gap}`}>
          <span
            className={`font-black italic tracking-tighter ${sizeConfig.lie} ${
              isDark
                ? 'bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent drop-shadow-sm'
                : 'bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-700 bg-clip-text text-transparent'
            }`}
          >
            LIE
          </span>

          <span
            className={`font-black italic select-none ${sizeConfig.slash} ${
              isDark ? 'text-cyan-400/60' : 'text-cyan-600/60'
            }`}
          >
            //
          </span>

          <span
            className={`font-black italic tracking-tight ${sizeConfig.word} ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {secondaryWord}
          </span>
        </div>
      ) : style === 'architectural' ? (
        /* Architectural Style: Geometric, crisp vertical divider, high tracking */
        <div className={`flex items-center ${sizeConfig.gap}`}>
          <span
            className={`font-black tracking-wider ${sizeConfig.lie} ${
              isDark ? 'text-sky-400' : 'text-blue-700'
            }`}
          >
            LIE
          </span>

          <span
            className={`w-[2px] self-stretch rounded-full my-0.5 ${
              isDark ? 'bg-slate-700' : 'bg-slate-300'
            }`}
          />

          <span
            className={`font-extrabold tracking-widest ${sizeConfig.word} ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {secondaryWord}
          </span>
        </div>
      ) : (
        /* Clean Minimal Style: Seamless wordmark */
        <div className={`flex items-baseline ${sizeConfig.gap}`}>
          <span
            className={`font-black tracking-tight ${sizeConfig.lie} ${
              isDark ? 'text-sky-400' : 'text-blue-600'
            }`}
          >
            LIE
          </span>
          <span
            className={`font-bold tracking-normal ${sizeConfig.word} ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            {secondaryWord}
          </span>
        </div>
      )}

      {showSubtitle && (
        <span
          className={`font-bold uppercase ${sizeConfig.sub} ${sizeConfig.subMargin} ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {resolvedSubtitle}
        </span>
      )}
    </div>
  );
};

export default TypographyLogo;
