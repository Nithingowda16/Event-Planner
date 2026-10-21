import React from 'react';
import { useTheme } from '../../context/ThemeContext.js';
import lotusLight from '../../assets/swakarya-lotus-light.png';
import lotusDark from '../../assets/swakarya-lotus-dark.png';
import './SwakaryaLogo.css';

export interface SwakaryaLogoProps {
  size?: number | string;
  theme?: 'light' | 'dark' | 'auto';
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
  isCompact?: boolean;
}

export const SwakaryaLogo: React.FC<SwakaryaLogoProps> = ({
  size = 38,
  theme = 'auto',
  showWordmark = true,
  showTagline = true,
  className = '',
  isCompact = false,
}) => {
  // Access global theme safely (fallback to 'dark' if context unmounted)
  let activeTheme: 'light' | 'dark' = 'dark';
  try {
    const themeContext = useTheme();
    activeTheme = themeContext.theme;
  } catch {
    if (typeof document !== 'undefined') {
      const domTheme = document.documentElement.getAttribute('data-theme');
      if (domTheme === 'light' || domTheme === 'dark') {
        activeTheme = domTheme;
      }
    }
  }

  const effectiveTheme = theme === 'auto' ? activeTheme : theme;
  const logoSrc = effectiveTheme === 'light' ? lotusLight : lotusDark;

  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 38;
  // Aspect ratio is roughly 519:354 -> width ~ size * (519/354) ≈ size * 1.46
  const logoWidth = Math.round(numericSize * 1.4);
  const logoHeight = numericSize;

  return (
    <div
      className={`swakarya-brand-container ${isCompact ? 'swakarya-brand-container--compact' : ''} ${className}`}
    >
      <div
        className="swakarya-logo-wrapper"
        style={{ width: `${logoWidth}px`, height: `${logoHeight}px` }}
      >
        <img
          src={logoSrc}
          alt="Swakarya Lotus Logo"
          width={logoWidth}
          height={logoHeight}
          className="swakarya-lotus-img"
          loading="eager"
        />
      </div>

      {showWordmark && (
        <div className="swakarya-brand-text">
          <h1 className="swakarya-wordmark" style={{ margin: 0 }}>
            Swakarya
          </h1>
          {showTagline && (
            <span className="swakarya-tagline">
              Every Moment, Beautifully Planned.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
