import React from 'react';
import {
  DollarSign,
  Calendar,
  Users2,
  GitCompare,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Clock,
  Sliders,
  Check,
  X,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { SwakaryaLogo } from '../brand/SwakaryaLogo.js';
import './LandingPage.css';

export interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenRegister,
}) => {
  return (
    <div className="landing-page">
      {/* Header Landmark */}
      <header role="banner" className="landing-header">
        <div className="container">
          <div className="landing-header__inner">
            <a href="#" className="landing-brand" aria-label="Swakarya Home">
              <SwakaryaLogo size={34} showWordmark={true} showTagline={false} />
            </a>

            <nav role="navigation" aria-label="Main Navigation" className="landing-nav">
              <a href="#what-is-swakarya" className="landing-nav__link">What is Swakarya?</a>
              <a href="#features" className="landing-nav__link">Features</a>
              <a href="#how-it-works" className="landing-nav__link">How It Works</a>
              <a href="#benefits" className="landing-nav__link">Benefits</a>
            </nav>

            <div className="landing-header__actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenLogin}
                id="landing-header-login-btn"
              >
                Log In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenRegister}
                id="landing-header-register-btn"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" role="main" style={{ flex: 1 }}>
        {/* Hero Section with Luxury Birthday Celebration Visual Background */}
        <section className="landing-hero" aria-labelledby="hero-heading">
          <div className="landing-hero__bg-overlay" aria-hidden="true" />
          <div className="container landing-hero__container">
            <h2 id="hero-heading" className="landing-hero__title">
              Every Moment, <span>Beautifully Planned.</span>
            </h2>

            <p className="landing-hero__subtitle">
              Swakarya brings AI-assisted event planning, authoritative Indian Rupee budgets, timelines, tasks,
              and vendor quote tracking into one unified workspace.
            </p>

            <div className="landing-hero__cta-group">
              <Button
                variant="primary"
                size="lg"
                onClick={onOpenRegister}
                rightIcon={<ArrowRight size={18} />}
                id="hero-register-btn"
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onOpenLogin}
                id="hero-login-btn"
              >
                Log In to Workspace
              </Button>
            </div>
          </div>
        </section>

        {/* Dedicated "What is Swakarya?" Section */}
        <section id="what-is-swakarya" className="landing-what-is-section" aria-labelledby="what-is-swakarya-heading">
          <div className="container">
            <div className="landing-what-is-card">
              <div className="landing-what-is-header">
                <span className="landing-what-is-badge">
                  <Sparkles size={14} />
                  <span>The Intelligent Celebration Platform</span>
                </span>
                <h2 id="what-is-swakarya-heading" className="landing-what-is-title">
                  What is <span className="highlight-pink">Swakarya</span>?
                </h2>
                <p className="landing-what-is-lead">
                  <strong>Swakarya</strong> (meaning <em>&quot;one&apos;s own sacred craft&quot;</em>) is an all-in-one luxury celebration and event management platform. Whether planning a grand wedding, milestone gala, corporate summit, or community festival, Swakarya unifies deterministic multi-currency budgeting, Gemini AI proposal generation with isolated diff approvals, timeline milestone tracking, and vendor quote management into one elegant, stress-free workspace.
                </p>
              </div>

              <div className="landing-what-is-grid">
                <div className="landing-what-is-pillar">
                  <div className="landing-what-is-pillar__icon pink">
                    <Sparkles size={24} />
                  </div>
                  <h3>Gemini AI Proposals</h3>
                  <p>
                    Generate full event itineraries, themes, and line-item budgets with Gemini 2.5 Flash. Safe isolated drafts ensure active events are never mutated without explicit review and approval.
                  </p>
                </div>

                <div className="landing-what-is-pillar">
                  <div className="landing-what-is-pillar__icon chartreuse">
                    <Calculator size={24} />
                  </div>
                  <h3>Zero-Drift Budget Math</h3>
                  <p>
                    Authoritative integer arithmetic eliminates penny rounding errors across multi-currency budgets with automatically balanced allocations and built-in contingency buffers.
                  </p>
                </div>

                <div className="landing-what-is-pillar">
                  <div className="landing-what-is-pillar__icon pink">
                    <Calendar size={24} />
                  </div>
                  <h3>Timeline Milestones</h3>
                  <p>
                    Keep caterers, photographers, venues, and decor specialists synchronized with milestone deadlines, automated countdowns, and real-time task checklists.
                  </p>
                </div>

                <div className="landing-what-is-pillar">
                  <div className="landing-what-is-pillar__icon chartreuse">
                    <ShieldCheck size={24} />
                  </div>
                  <h3>100% Tenant Isolation</h3>
                  <p>
                    Enterprise-grade IDOR defenses and user-scoped data security guarantee that your event budgets, confidential notes, and vendor contracts remain completely private.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Preview Section */}
        <section className="landing-preview-section" aria-label="Product Preview">
          <div className="container">
            <div className="landing-preview-frame">
              <div className="landing-preview-browser-bar">
                <div className="landing-preview-dot landing-preview-dot--red" />
                <div className="landing-preview-dot landing-preview-dot--yellow" />
                <div className="landing-preview-dot landing-preview-dot--green" />
                <span className="landing-preview-url">app.swakarya.com/events/maya-liam-wedding</span>
              </div>

              <div className="landing-preview-content">
                <div className="landing-preview-header">
                  <div className="landing-preview-event-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <Badge variant="gold" size="sm">Wedding</Badge>
                      <Badge variant="emerald" size="sm">Planned</Badge>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Baseline v2</span>
                    </div>
                    <h3>Maya & Liam's Golden Wedding Celebration</h3>
                    <p>Palace Grounds & Botanical Ballroom • 150 Attendees • Oct 24, 2026</p>
                  </div>
                </div>

                {/* Dashboard Stats Preview */}
                <div className="landing-preview-stats-grid">
                  <div className="landing-preview-stat-card">
                    <div className="landing-preview-stat-card__label">Total Budget</div>
                    <div className="landing-preview-stat-card__value gold">₹35,00,000</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                      Allocated: ₹31,50,000 (90%)
                    </div>
                  </div>

                  <div className="landing-preview-stat-card">
                    <div className="landing-preview-stat-card__label">Contingency Buffer</div>
                    <div className="landing-preview-stat-card__value emerald">₹3,50,000</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                      10% Unallocated Safety Margin
                    </div>
                  </div>

                  <div className="landing-preview-stat-card">
                    <div className="landing-preview-stat-card__label">Milestone Tasks</div>
                    <div className="landing-preview-stat-card__value purple">18 Items</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                      12 Completed • 6 In Progress
                    </div>
                  </div>

                  <div className="landing-preview-stat-card">
                    <div className="landing-preview-stat-card__label">Vendor Quotes</div>
                    <div className="landing-preview-stat-card__value">4 Tracked</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                      Catering, Venue, Florals & Audio
                    </div>
                  </div>
                </div>

                {/* AI Proposal Diff Preview Card */}
                <div className="landing-preview-diff-card">
                  <div>
                    <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                      Gemini AI Proposal Diff Preview (Isolated Draft)
                    </strong>
                    <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                      &quot;Reallocate 5% from decor to live acoustics and add milestone tasks for acoustic sound checks.&quot;
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <Badge variant="rose" size="sm">Decor -₹1,75,000</Badge>
                    <Badge variant="emerald" size="sm">Acoustics +₹1,75,000</Badge>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Explicit Approval Required
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem & Solution Section */}
        <section className="landing-problem-solution" aria-labelledby="problem-heading">
          <div className="container">
            <div className="landing-section-header">
              <span className="landing-section-header__badge">Why Swakarya</span>
              <h2 id="problem-heading" className="landing-section-header__title">
                Say goodbye to scattered planning chaos
              </h2>
              <p className="landing-section-header__desc">
                Organizing unforgettable celebrations shouldn't mean drowning in disconnected
                spreadsheets, buried email quotes, and surprise budget deficits.
              </p>
            </div>

            <div className="landing-comparison-grid">
              {/* Problem Column */}
              <div className="landing-comparison-card landing-comparison-card--problem">
                <div className="landing-comparison-card__tag">
                  <X size={16} />
                  <span>The Traditional Chaos</span>
                </div>
                <h3 className="landing-comparison-card__title">Scattered Planning & Blind Spots</h3>
                <ul className="landing-comparison-card__list">
                  <li className="landing-comparison-card__item">
                    <X size={16} style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '2px' }} />
                    <span>Disjointed spreadsheets where formulas break and numbers fall out of sync.</span>
                  </li>
                  <li className="landing-comparison-card__item">
                    <X size={16} style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '2px' }} />
                    <span>Vendor quotes lost across email threads, PDF attachments, and chat screenshots.</span>
                  </li>
                  <li className="landing-comparison-card__item">
                    <X size={16} style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '2px' }} />
                    <span>Hidden budget deficits that surface days before the celebration.</span>
                  </li>
                  <li className="landing-comparison-card__item">
                    <X size={16} style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '2px' }} />
                    <span>Unvetted AI tools that blindly overwrite active plans with hallucinations.</span>
                  </li>
                </ul>
              </div>

              {/* Solution Column */}
              <div className="landing-comparison-card landing-comparison-card--solution">
                <div className="landing-comparison-card__tag">
                  <Check size={16} />
                  <span>The Swakarya Way</span>
                </div>
                <h3 className="landing-comparison-card__title">One Unified, Authoritative Workspace</h3>
                <ul className="landing-comparison-card__list">
                  <li className="landing-comparison-card__item">
                    <Check size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '2px' }} />
                    <span>Authoritative budget calculation with automatic variance balancing and penny precision.</span>
                  </li>
                  <li className="landing-comparison-card__item">
                    <Check size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '2px' }} />
                    <span>Side-by-side vendor quote tracking with transparent status tracking.</span>
                  </li>
                  <li className="landing-comparison-card__item">
                    <Check size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '2px' }} />
                    <span>Real-time contingency reserve tracking so you never overcommit funds.</span>
                  </li>
                  <li className="landing-comparison-card__item">
                    <Check size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '2px' }} />
                    <span>Isolated AI proposal drafts with side-by-side diff previews and explicit approval gates.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="landing-features" aria-labelledby="features-heading">
          <div className="container">
            <div className="landing-section-header">
              <span className="landing-section-header__badge">Core Capabilities</span>
              <h2 id="features-heading" className="landing-section-header__title">
                Everything you need to orchestrate a celebration
              </h2>
              <p className="landing-section-header__desc">
                From initial budget allocation to day-of timeline coordination, Swakarya
                gives you professional-grade tools designed specifically for event planning.
              </p>
            </div>

            <div className="landing-features-grid">
              <div className="landing-feature-card">
                <div className="landing-feature-card__icon-wrap" style={{ backgroundColor: 'rgba(245, 208, 97, 0.15)', color: 'var(--accent-gold)' }}>
                  <TrendingUp size={22} />
                </div>
                <h3 className="landing-feature-card__title">AI Planning Proposals</h3>
                <p className="landing-feature-card__desc">
                  Leverage Google Gemini to brainstorm schedules, adjust budgets, and propose
                  milestone tasks. AI drafts are generated in isolation and never alter your active plan without approval.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-card__icon-wrap" style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: 'var(--accent-emerald)' }}>
                  <DollarSign size={22} />
                </div>
                <h3 className="landing-feature-card__title">Authoritative Budget Engine</h3>
                <p className="landing-feature-card__desc">
                  Deterministic currency math with custom category breakdowns, percentage weights,
                  spent tracking, and automatic absorption of allocation residuals.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-card__icon-wrap" style={{ backgroundColor: 'rgba(167, 139, 250, 0.15)', color: 'var(--accent-purple)' }}>
                  <Calendar size={22} />
                </div>
                <h3 className="landing-feature-card__title">Event Timelines & Tasks</h3>
                <p className="landing-feature-card__desc">
                  Structured milestone roadmaps grouped by planning phase. Track due dates,
                  completion progress, and critical pre-event logistics in one interactive checklist.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-card__icon-wrap" style={{ backgroundColor: 'rgba(96, 165, 250, 0.15)', color: 'var(--accent-blue)' }}>
                  <Users2 size={22} />
                </div>
                <h3 className="landing-feature-card__title">Vendor Quote Tracking</h3>
                <p className="landing-feature-card__desc">
                  Organize vendor estimates, compare quotes side-by-side, and track booking statuses.
                  Includes clear disclaimers for unverified AI vendor recommendations.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-card__icon-wrap" style={{ backgroundColor: 'rgba(251, 113, 133, 0.15)', color: 'var(--accent-rose)' }}>
                  <GitCompare size={22} />
                </div>
                <h3 className="landing-feature-card__title">Visual Diff Inspector</h3>
                <p className="landing-feature-card__desc">
                  Inspect proposed changes with high-clarity diff badges. Compare old vs. new allocations,
                  added tasks, and removed milestones before clicking Approve or Reject.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-card__icon-wrap" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}>
                  <ShieldCheck size={22} />
                </div>
                <h3 className="landing-feature-card__title">Strict Tenant Isolation</h3>
                <p className="landing-feature-card__desc">
                  Secure JWT authentication, IDOR defenses, and optimistic concurrency version guards
                  ensure your celebration data is strictly protected and never leaked.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="landing-how-it-works" aria-labelledby="how-heading">
          <div className="container">
            <div className="landing-section-header">
              <span className="landing-section-header__badge">The Workflow</span>
              <h2 id="how-heading" className="landing-section-header__title">
                Three simple steps to celebration clarity
              </h2>
              <p className="landing-section-header__desc">
                Swakarya combines structured organization with guided AI assistance
                while keeping you completely in charge.
              </p>
            </div>

            <div className="landing-steps-grid">
              <div className="landing-step-card">
                <span className="landing-step-badge">01</span>
                <h3 className="landing-step-title">Create Your Event</h3>
                <p className="landing-step-desc">
                  Define your celebration title, date, venue, guest count, and total budget.
                  Swakarya automatically initializes a balanced starter budget and milestone schedule.
                </p>
              </div>

              <div className="landing-step-card">
                <span className="landing-step-badge">02</span>
                <h3 className="landing-step-title">Organize the Plan</h3>
                <p className="landing-step-desc">
                  Tailor budget categories, record actual vendor quotes, schedule logistics tasks,
                  and monitor your unallocated contingency reserve in real time.
                </p>
              </div>

              <div className="landing-step-card">
                <span className="landing-step-badge">03</span>
                <h3 className="landing-step-title">Review & Approve AI Suggestions</h3>
                <p className="landing-step-desc">
                  Prompt Gemini AI for revisions or schedule optimizations. Review the side-by-side
                  diff inspector and explicitly approve or reject proposals before anything changes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="landing-benefits" aria-labelledby="benefits-heading">
          <div className="container">
            <div className="landing-section-header">
              <span className="landing-section-header__badge">Measurable Value</span>
              <h2 id="benefits-heading" className="landing-section-header__title">
                Built for planners who value precision
              </h2>
              <p className="landing-section-header__desc">
                Whether you're organizing a grand royal wedding, a company gala, or an intimate
                milestone birthday, Swakarya delivers lasting benefits.
              </p>
            </div>

            <div className="landing-benefits-grid">
              <div className="landing-benefit-item">
                <div className="landing-benefit-item__icon">
                  <TrendingUp size={24} />
                </div>
                <h3 className="landing-benefit-item__title">Better Organization</h3>
                <p className="landing-benefit-item__desc">
                  Eliminate fragmented notes and misplaced contacts. Every detail stays linked
                  to the specific celebration workspace.
                </p>
              </div>

              <div className="landing-benefit-item">
                <div className="landing-benefit-item__icon">
                  <DollarSign size={24} />
                </div>
                <h3 className="landing-benefit-item__title">Budget Visibility</h3>
                <p className="landing-benefit-item__desc">
                  Real-time visibility into allocations, spending, and reserves ensures you never
                  face unexpected cost overruns.
                </p>
              </div>

              <div className="landing-benefit-item">
                <div className="landing-benefit-item__icon">
                  <Clock size={24} />
                </div>
                <h3 className="landing-benefit-item__title">Planning Clarity</h3>
                <p className="landing-benefit-item__desc">
                  Structured phase roadmaps give you a crystal-clear understanding of what's due
                  today, next week, and the morning of the event.
                </p>
              </div>

              <div className="landing-benefit-item">
                <div className="landing-benefit-item__icon">
                  <Sliders size={24} />
                </div>
                <h3 className="landing-benefit-item__title">Control Over Changes</h3>
                <p className="landing-benefit-item__desc">
                  Enjoy intelligent AI assistance without the risk of autonomous changes. You
                  inspect every diff and have the final word.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="landing-final-cta" aria-labelledby="final-cta-heading">
          <div className="container">
            <div className="landing-final-cta__inner">
              <h2 id="final-cta-heading" className="landing-final-cta__title">
                Every Moment, Beautifully Planned.
              </h2>
              <p className="landing-final-cta__desc">
                Join event planners and hosts creating memorable, stress-free weddings,
                galas, and community festivals with Swakarya.
              </p>
              <div className="landing-final-cta__buttons">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={onOpenRegister}
                  rightIcon={<ArrowRight size={18} />}
                  id="final-cta-register-btn"
                >
                  Create Your Account
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onOpenLogin}
                  id="final-cta-login-btn"
                >
                  Log In to Workspace
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Landmark */}
      <footer role="contentinfo" className="landing-footer">
        <div className="container">
          <p className="swakarya-footer-text">
            © Swakarya 2026. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
