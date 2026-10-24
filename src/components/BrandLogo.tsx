import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  lightMode?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  lightMode = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* High-quality oceanic cargo vessel & wave mark icon */}
      <div
        className={`${iconSizes[size]} shrink-0 rounded-xl bg-gradient-to-br from-cyan-600 via-teal-700 to-blue-900 flex items-center justify-center p-1.5 shadow-md shadow-cyan-900/20 text-white`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Waves */}
          <path
            d="M4 36C9 34 13 38 18 36C23 34 27 38 32 36C37 34 41 37 44 36"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M6 42C11 40 15 43 20 41C25 39 29 43 34 41C39 39 42 42 44 41"
            stroke="#14B8A6"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
          {/* Cargo Vessel Hull */}
          <path
            d="M8 28L12 33H38L42 28L40 24H10L8 28Z"
            fill="#FFFFFF"
          />
          {/* Deck & Containers */}
          <rect x="14" y="16" width="6" height="8" rx="1" fill="#F59E0B" />
          <rect x="22" y="13" width="6" height="11" rx="1" fill="#38BDF8" />
          <rect x="30" y="18" width="6" height="6" rx="1" fill="#10B981" />
          {/* Bridge */}
          <path d="M37 20H40V24H37V20Z" fill="#CBD5E1" />
          {/* Speed Lines */}
          <path
            d="M4 22H7M2 17H8"
            stroke="#38BDF8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <div className={`font-extrabold tracking-tight ${titleSizes[size]} ${lightMode ? 'text-white' : 'text-slate-900'}`}>
          <span className="text-teal-600">PT LAUTAN INDAH</span>{' '}
          <span className={lightMode ? 'text-amber-400' : 'text-blue-900 font-black'}>Express</span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[10px] tracking-wider uppercase font-semibold ${
              lightMode ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Monitoring Armada &amp; Logistik
          </span>
        )}
      </div>
    </div>
  );
};
