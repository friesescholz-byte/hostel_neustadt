import React from 'react';
import './HeroDivider.css';

const HeroDivider = () => {
  return (
    <div className="hero-divider">
      {/* Main curved wave shape */}
      <svg className="hero-divider-wave" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(15, 43, 92, 0.15)" />
            <stop offset="50%" stopColor="rgba(124, 184, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(15, 43, 92, 0.15)" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(15, 43, 92, 0.08)" />
            <stop offset="50%" stopColor="rgba(124, 184, 255, 0.06)" />
            <stop offset="100%" stopColor="rgba(15, 43, 92, 0.08)" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(124, 184, 255, 0)" />
            <stop offset="20%" stopColor="rgba(124, 184, 255, 0.4)" />
            <stop offset="50%" stopColor="rgba(124, 184, 255, 0.6)" />
            <stop offset="80%" stopColor="rgba(124, 184, 255, 0.4)" />
            <stop offset="100%" stopColor="rgba(124, 184, 255, 0)" />
          </linearGradient>
        </defs>

        {/* Background soft wave */}
        <path d="M0,100 C240,200 480,40 720,140 C960,240 1200,60 1440,160 L1440,320 L0,320 Z" fill="url(#waveGrad2)" />

        {/* Main wave fill – color matches TrustBar top */}
        <path d="M0,160 C360,60 720,280 1080,140 C1260,75 1380,110 1440,140 L1440,320 L0,320 Z" fill="#e4ecf5" />

        {/* Decorative line 1 */}
        <path d="M0,155 C360,55 720,275 1080,135 C1260,70 1380,105 1440,135" fill="none" stroke="url(#lineGrad)" strokeWidth="2" />

        {/* Decorative line 2 (offset) */}
        <path d="M0,145 C360,45 720,265 1080,125 C1260,60 1380,95 1440,125" fill="none" stroke="url(#lineGrad)" strokeWidth="1" opacity="0.5" />

        {/* Top accent wave */}
        <path d="M0,100 C240,200 480,40 720,140 C960,240 1200,60 1440,160" fill="none" stroke="url(#waveGrad1)" strokeWidth="1.5" />
      </svg>

      {/* Floating decorative dots */}
      <div className="hero-divider-dots">
        <span className="divider-dot dot-1"></span>
        <span className="divider-dot dot-2"></span>
        <span className="divider-dot dot-3"></span>
      </div>
    </div>
  );
};

export default HeroDivider;
