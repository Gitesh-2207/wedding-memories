import React from 'react';

export const RoyalDivider = ({ className = '' }) => (
  <div className={`flex items-center justify-center gap-3 my-6 ${className}`}>
    <div className="h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent w-24 sm:w-36"></div>
    <div className="text-gold flex items-center gap-1.5">
      <span className="text-xs">✦</span>
      <svg className="w-5 h-5 text-gold fill-current" viewBox="0 0 24 24">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
      </svg>
      <span className="text-xs">✦</span>
    </div>
    <div className="h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent w-24 sm:w-36"></div>
  </div>
);

export const RoyalCornerBorder = ({ children, className = '' }) => (
  <div className={`relative p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-2xl border border-gold/40 shadow-royal ${className}`}>
    {/* Top Left Corner */}
    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gold pointer-events-none" />
    {/* Top Right Corner */}
    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gold pointer-events-none" />
    {/* Bottom Left Corner */}
    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gold pointer-events-none" />
    {/* Bottom Right Corner */}
    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gold pointer-events-none" />
    {children}
  </div>
);

export const RoyalMandalaIcon = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor">
    <circle cx="50" cy="50" r="45" strokeWidth="2" className="text-maroon/80" />
    <circle cx="50" cy="50" r="38" strokeWidth="1.5" strokeDasharray="3 3" className="text-gold" />
    <circle cx="50" cy="50" r="28" strokeWidth="1.2" className="text-maroon/60" />
    <path d="M50 12 C54 25, 54 35, 50 42 C46 35, 46 25, 50 12 Z" fill="#D8B978" />
    <path d="M50 88 C54 75, 54 65, 50 58 C46 65, 46 75, 50 88 Z" fill="#D8B978" />
    <path d="M12 50 C25 54, 35 54, 42 50 C35 46, 25 46, 12 50 Z" fill="#D8B978" />
    <path d="M88 50 C75 54, 65 54, 58 50 C65 46, 75 46, 88 50 Z" fill="#D8B978" />
    <circle cx="50" cy="50" r="7" fill="#8C2436" />
    <circle cx="50" cy="50" r="3" fill="#D8B978" />
  </svg>
);
