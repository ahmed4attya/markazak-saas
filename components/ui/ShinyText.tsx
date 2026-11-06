'use client';

import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  shimmerColor?: string;
}

export default function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.95)',
}: ShinyTextProps) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`relative inline-block overflow-hidden font-bold transition-colors ${className}`}
      style={{
        backgroundImage: disabled
          ? 'none'
          : `linear-gradient(120deg, currentColor 0%, currentColor 40%, ${shimmerColor} 50%, currentColor 60%, currentColor 100%)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: disabled ? 'currentColor' : 'transparent',
        animation: disabled ? 'none' : `shine ${animationDuration} linear infinite`,
      }}
    >
      {text}
      <style jsx>{`
        @keyframes shine {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
      `}</style>
    </span>
  );
}
