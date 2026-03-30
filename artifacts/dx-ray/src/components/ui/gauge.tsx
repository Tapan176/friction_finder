import React from 'react';
import { motion } from 'framer-motion';

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  size?: number;
}

export function Gauge({ value, min = 0, max = 100, label, size = 200 }: GaugeProps) {
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle
  const normalizedValue = Math.min(Math.max(value, min), max);
  const percentage = (normalizedValue - min) / (max - min);
  const offset = circumference - percentage * circumference;

  // Color determination based on DX score standard
  let strokeColor = "stroke-success";
  if (percentage < 0.6) strokeColor = "stroke-destructive";
  else if (percentage < 0.8) strokeColor = "stroke-warning";

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size / 2 + strokeWidth }}>
      <svg width={size} height={size / 2 + strokeWidth} className="overflow-visible">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background Arc */}
        <path
          d={`M ${strokeWidth/2} ${size/2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth/2} ${size/2}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="opacity-50"
        />
        
        {/* Foreground Arc */}
        <motion.path
          d={`M ${strokeWidth/2} ${size/2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth/2} ${size/2}`}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={strokeColor}
          filter="url(#glow)"
          initial={{ strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      <div className="absolute bottom-0 flex flex-col items-center transform translate-y-1/4">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-bold font-mono tracking-tighter text-foreground"
        >
          {Math.round(value)}
        </motion.span>
        {label && <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{label}</span>}
      </div>
    </div>
  );
}
