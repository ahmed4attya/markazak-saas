'use client';

import React from 'react';
import NumberFlow from '@number-flow/react';

interface AnimatedProgressRingProps {
  pct: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  color?: string;
  glow?: boolean;
  className?: string;
}

export default function AnimatedProgressRing({
  pct,
  size = 72,
  strokeWidth = 6,
  showText = true,
  color,
  glow = true,
  className = '',
}: AnimatedProgressRingProps) {
  const normalizedPct = Math.max(0, Math.min(100, Math.round(pct)));
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * normalizedPct) / 100;

  // Adaptive palette based on score / completion
  const ringColor =
    color ||
    (normalizedPct >= 80
      ? '#10b981' // Success Emerald
      : normalizedPct >= 50
        ? '#f59e0b' // Warning Gold/Amber
        : '#3b82f6'); // Info Blue

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="w-full h-full -rotate-90 transform"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-200 dark:text-slate-800/80"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={
            glow
              ? {
                  filter: `drop-shadow(0 0 6px ${ringColor}66)`,
                }
              : undefined
          }
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-center font-black text-xs leading-none">
            <NumberFlow value={normalizedPct} />
            <span className="text-[9px] font-bold text-slate-400">%</span>
          </div>
        </div>
      )}
    </div>
  );
}
