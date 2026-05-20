import React from 'react';
import './HeroDivider.css';

const HeroDivider = () => {
  return (
    <div className="hero-divider">
      {/* Main curved wave shape */}
      <svg className="hero-divider-wave" viewBox="0 0 1440 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
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
        <path d="M0,80 C240,160 480,20 720,100 C960,180 1200,40 1440,120 L1440,220 L0,220 Z" fill="url(#waveGrad2)" />

        {/* Main wave fill */}
        <path d="M0,120 C360,40 720,200 1080,100 C1260,55 1380,80 1440,100 L1440,220 L0,220 Z" fill="#f7f9fa" />

        {/* Decorative line 1 */}
        <path d="M0,115 C360,35 720,195 1080,95 C1260,50 1380,75 1440,95" fill="none" stroke="url(#lineGrad)" strokeWidth="2" />

        {/* Decorative line 2 (offset) */}
        <path d="M0,105 C360,25 720,185 1080,85 C1260,40 1380,65 1440,85" fill="none" stroke="url(#lineGrad)" strokeWidth="1" opacity="0.5" />

        {/* Top accent wave */}
        <path d="M0,80 C240,160 480,20 720,100 C960,180 1200,40 1440,120" fill="none" stroke="url(#waveGrad1)" strokeWidth="1.5" />
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
