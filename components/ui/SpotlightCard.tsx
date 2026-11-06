'use client';

import React, { useRef, useState, useCallback } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  borderColor?: string;
}

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(245, 158, 11, 0.12)', // Warm gold/amber light
  borderColor = 'rgba(245, 158, 11, 0.25)',
  style,
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl border border-white/10 dark:border-white/10 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 ${className}`}
      style={style}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      {/* Dynamic Border Highlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(350px circle at ${position.x}px ${position.y}px, ${borderColor}, transparent 60%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
