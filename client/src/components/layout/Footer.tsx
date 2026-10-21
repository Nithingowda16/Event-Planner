import React from 'react';
import { ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge.js';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer role="contentinfo" className="celebrate-footer">
      <div className="container">
        <div className="celebrate-footer__inner">
          <div className="celebrate-footer__content">
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>
                CelebrateOS — Event & Celebration Operating System
              </p>
              <p style={{ fontSize: 'var(--font-size-xs)', margin: 'var(--space-1) 0 0 0' }}>
                PromptWars Challenge 5 Foundation • Built with TypeScript, React, Express, MongoDB & Gemini
              </p>
            </div>

            <div className="celebrate-footer__badges">
              <Badge variant="emerald" size="sm" icon={<ShieldCheck size={14} />}>
                WCAG 2.1 AA Compliant
              </Badge>
              <Badge variant="gold" size="sm" icon={<Sparkles size={14} />}>
                Gemini 2.5 Flash Verified
              </Badge>
              <Badge variant="purple" size="sm" icon={<CheckCircle2 size={14} />}>
                Authoritative Deterministic Budget
              </Badge>
            </div>
          </div>

          <hr className="celebrate-footer__divider" />

          <div className="celebrate-footer__bottom">
            <span>© 2026 CelebrateOS. All rights reserved. Zero API key leakage guarantee.</span>
            <span>Keyboard Accessible • Reduced-Motion Enabled • Responsive</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
