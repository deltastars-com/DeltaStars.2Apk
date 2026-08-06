import React from 'react';

interface SaudiFlagProps {
  className?: string;
  width?: number;
  height?: number;
}

export const SaudiFlag: React.FC<SaudiFlagProps> = ({ 
  className = "w-7 h-5 rounded shadow-sm inline-block object-cover border border-emerald-700/30",
  width = 600,
  height = 400
}) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 600 400" 
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="علم المملكة العربية السعودية"
      role="img"
    >
      {/* Saudi Flag Field - Official Green Color #007A3D */}
      <rect width="600" height="400" fill="#007A3D" rx="12" />
      
      {/* White Sword & Arabic Calligraphy (La ilaha illa Allah, Muhammad rasul Allah) */}
      <g fill="#FFFFFF">
        {/* Curved Saudi Sword */}
        <path d="M 170 290 L 410 290 Q 425 290 435 282 Q 425 274 410 274 L 170 274 Z" />
        {/* Sword Handle and Guard */}
        <path d="M 170 265 L 170 299 L 152 299 L 148 303 L 138 299 L 138 265 L 148 261 L 152 265 Z" />
        <circle cx="126" cy="282" r="7" />
        <path d="M 185 274 L 185 290 M 205 274 L 205 290" stroke="#007A3D" strokeWidth="2" />
        
        {/* Stylized Shahada Calligraphy Art Vector */}
        <g transform="translate(140, 110) scale(1.1)">
          {/* Vertical Arabic Text Stems */}
          <rect x="20" y="20" width="8" height="90" rx="3" />
          <rect x="40" y="10" width="8" height="100" rx="3" />
          <rect x="55" y="15" width="8" height="95" rx="3" />
          <rect x="85" y="5" width="8" height="105" rx="3" />
          <rect x="105" y="15" width="8" height="95" rx="3" />
          <rect x="120" y="20" width="8" height="90" rx="3" />
          <rect x="150" y="10" width="8" height="100" rx="3" />
          <rect x="170" y="5" width="8" height="105" rx="3" />
          <rect x="190" y="15" width="8" height="95" rx="3" />
          <rect x="220" y="10" width="8" height="100" rx="3" />
          <rect x="240" y="20" width="8" height="90" rx="3" />
          <rect x="270" y="15" width="8" height="95" rx="3" />

          {/* Horizontal Calligraphy Connecting Loops & Diacritics */}
          <path d="M 10 95 Q 150 125 300 95 Q 150 105 10 95 Z" />
          <path d="M 20 60 Q 150 40 280 60 Q 150 50 20 60 Z" />
          <circle cx="35" cy="10" r="4" />
          <circle cx="95" cy="2" r="4" />
          <circle cx="160" cy="5" r="4" />
          <circle cx="230" cy="5" r="4" />
        </g>
      </g>
    </svg>
  );
};

export default SaudiFlag;
