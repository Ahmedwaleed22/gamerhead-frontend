'use client';

import React from 'react';

type BadgeLevel = 1 | 5 | 15 | 30 | 50 | 100;

interface FriendsBadgeProps {
  level: BadgeLevel;
  size?: number;
  className?: string;
}

/**
 * FriendsBadge Component
 * Renders a premium SVG badge based on the user's friend count milestones.
 * Align with the Gamerhead design system.
 */
export const FriendsBadge: React.FC<FriendsBadgeProps> = ({ level, size = 64, className = '' }) => {
  const renderBadge = () => {
    switch (level) {
      case 1:
        return (
          <svg width="100%" height="100%" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M64 8L112 36V92L64 120L16 92V36L64 8Z" fill="#111114" stroke="#2A2A2E" strokeWidth="2"/>
            <path d="M64 14L106 38.5V89.5L64 114L22 89.5V38.5L64 14Z" stroke="#e8000d" strokeOpacity="0.3" strokeWidth="1"/>
            <circle cx="64" cy="48" r="12" fill="#88888C" opacity="0.8"/>
            <path d="M40 88C40 74.7452 50.7452 64 64 64C77.2548 64 88 74.7452 88 88" stroke="#88888C" strokeWidth="8" strokeLinecap="round" opacity="0.8"/>
            <text x="64" y="105" textAnchor="middle" fill="#88888C" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '12px' }}>1</text>
          </svg>
        );
      case 5:
        return (
          <svg width="100%" height="100%" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="silver_grad_comp" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#A0A0A0"/>
                <stop offset="100%" stopColor="#505050"/>
              </linearGradient>
            </defs>
            <path d="M64 8L112 36V92L64 120L16 92V36L64 8Z" fill="#111114" stroke="url(#silver_grad_comp)" strokeWidth="3"/>
            <g transform="translate(10, 0)">
              <circle cx="44" cy="52" r="10" fill="#f0f0f0" fillOpacity="0.6"/>
              <path d="M28 84C28 75.1634 35.1634 68 44 68C52.8366 68 60 75.1634 60 84" stroke="#f0f0f0" strokeOpacity="0.6" strokeWidth="6" strokeLinecap="round"/>
            </g>
            <g transform="translate(-10, 0)">
              <circle cx="84" cy="52" r="10" fill="#f0f0f0"/>
              <path d="M68 84C68 75.1634 75.1634 68 84 68C92.8366 68 100 75.1634 100 84" stroke="#f0f0f0" strokeWidth="6" strokeLinecap="round"/>
            </g>
            <text x="64" y="105" textAnchor="middle" fill="#f0f0f0" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '14px' }}>5</text>
          </svg>
        );
      case 15:
        return (
          <svg width="100%" height="100%" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow_15_comp">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>
            <path d="M64 8L112 36V92L64 120L16 92V36L64 8Z" fill="#111114" stroke="#e8000d" strokeWidth="3" filter="url(#glow_15_comp)"/>
            <circle cx="64" cy="45" r="11" fill="#e8000d"/>
            <path d="M42 82C42 70.9543 50.9543 62 64 62C77.0457 62 86 70.9543 86 82" stroke="#e8000d" strokeWidth="7" strokeLinecap="round"/>
            <text x="64" y="105" textAnchor="middle" fill="#fff" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '16px' }}>15</text>
          </svg>
        );
      case 30:
        return (
          <svg width="100%" height="100%" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M64 8L112 36V92L64 120L16 92V36L64 8Z" fill="#111114" stroke="#e8000d" strokeWidth="4"/>
            <path d="M64 8L74 15H54L64 8Z" fill="#e8000d"/>
            <path d="M112 36L112 48L102 42L112 36Z" fill="#e8000d"/>
            <path d="M112 92L112 80L102 86L112 92Z" fill="#e8000d"/>
            <path d="M16 36L16 48L26 42L16 36Z" fill="#e8000d"/>
            <path d="M16 92L16 80L26 86L16 92Z" fill="#e8000d"/>
            <circle cx="64" cy="48" r="10" fill="#fff"/>
            <path d="M44 80C44 70 52 62 64 62C76 62 84 70 84 80" stroke="#fff" strokeWidth="6"/>
            <text x="64" y="108" textAnchor="middle" fill="#e8000d" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: '18px' }}>30</text>
          </svg>
        );
      case 50:
        return (
          <svg width="100%" height="100%" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="elite_glow_comp" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
              </filter>
            </defs>
            <path d="M64 8L112 36V92L64 120L16 92V36L64 8Z" stroke="#e8000d" strokeWidth="6" opacity="0.4" filter="url(#elite_glow_comp)"/>
            <path d="M64 8L112 36V92L64 120L16 92V36L64 8Z" fill="#111114" stroke="#e8000d" strokeWidth="3"/>
            <path d="M64 18L102 40V84L64 106L26 84V40L64 18Z" stroke="#e8000d" strokeOpacity="0.5" strokeWidth="1"/>
            <path d="M64 35L67 44H77L69 50L72 59L64 53L56 59L59 50L51 44H61L64 35Z" fill="#e8000d"/>
            <path d="M40 85C40 75 48 68 64 68C80 68 88 75 88 85" stroke="#fff" strokeWidth="8" strokeLinecap="round"/>
            <text x="64" y="112" textAnchor="middle" fill="#fff" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: '22px' }}>50</text>
          </svg>
        );
      case 100:
        return (
          <svg width="100%" height="100%" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="legion_rad_comp" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#e8000d" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#e8000d" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="64" cy="64" r="50" fill="url(#legion_rad_comp)"/>
            <path d="M64 8L112 36V92L64 120L16 92V36L64 8Z" fill="#0D121B" stroke="#e8000d" strokeWidth="4"/>
            <path d="M50 8L54 18L64 12L74 18L78 8H50Z" fill="#e8000d"/>
            <g>
              <circle cx="64" cy="50" r="12" fill="#fff"/>
              <circle cx="44" cy="55" r="8" fill="#e8000d"/>
              <circle cx="84" cy="55" r="8" fill="#e8000d"/>
              <path d="M30 88C30 75 40 65 64 65C88 65 98 75 98 88" stroke="#fff" strokeWidth="10" strokeLinecap="round"/>
            </g>
            <text x="64" y="115" textAnchor="middle" fill="#fff" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: '26px' }}>100</text>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`} 
      style={{ width: size, height: size }}
    >
      {renderBadge()}
    </div>
  );
};

export default FriendsBadge;
