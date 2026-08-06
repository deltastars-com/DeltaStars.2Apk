import React, { useState, useEffect } from 'react';

interface DeltaStarsLogoProps {
  className?: string;
  theme?: 'green' | 'gold' | 'white';
  onlyEmblem?: boolean;
  logoUrl?: string;
  noFrame?: boolean;
  fitMode?: 'cover' | 'contain';
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const DeltaStarsLogo: React.FC<DeltaStarsLogoProps> = ({ 
  className = "w-full h-full", 
  theme = "green", 
  onlyEmblem = false,
  logoUrl,
  fitMode = "contain",
}) => {
  const primaryUrl = logoUrl || "/icon-512.png?v=2026";
  const [currentSrc, setCurrentSrc] = useState<string>(primaryUrl);
  const [logoFailed, setLogoFailed] = useState<boolean>(false);

  useEffect(() => {
    const url = logoUrl || "/icon-512.png?v=2026";
    setCurrentSrc(url);
    setLogoFailed(false);
  }, [logoUrl]);

  const handleImageError = () => {
    if (currentSrc.includes("/icon-512.png")) {
      setCurrentSrc("/icon-192.png?v=2026");
    } else if (currentSrc.includes("/icon-192.png")) {
      setCurrentSrc("/official_logo.png?v=2026");
    } else if (currentSrc.includes("/official_logo.png")) {
      setCurrentSrc("/logo.png?v=2026");
    } else {
      setLogoFailed(true);
    }
  };

  const isWhite = theme === 'white';
  const isGold = theme === 'gold';

  // Brand colors
  const mainGreen = "#0e5e26";
  const lightGreen = "#1fa247";

  const primaryColor = isWhite ? "#ffffff" : (isGold ? "#eab308" : mainGreen);
  const secondaryColor = isWhite ? "#f0fdf4" : (isGold ? "#fef08a" : lightGreen);
  const textColor = isWhite ? "#ffffff" : (isGold ? "#facc15" : mainGreen);

  // Reusable pristine vector SVG logo representation (only used if image fails to load)
  const renderSvg = (extraClass = "") => (
    <svg viewBox="0 0 200 200" className={`${className} ${extraClass}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`leafGrad-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isGold ? "#fef08a" : secondaryColor} />
          <stop offset="50%" stopColor={isGold ? "#facc15" : (isWhite ? "#ffffff" : "#16a34a")} />
          <stop offset="100%" stopColor={isGold ? "#ca8a04" : primaryColor} />
        </linearGradient>
        <filter id={`softGlow-${theme}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Shopping Bag Top Handle Arc */}
      <path 
        d="M 75 75 C 75 50, 125 50, 125 75" 
        stroke={`url(#leafGrad-${theme})`} 
        strokeWidth="6.5" 
        strokeLinecap="round"
        fill="none"
      />
      {/* Sprout leaves on handle */}
      <path 
        d="M 100 53 C 94 48, 93 42, 100 40 C 107 42, 106 48, 100 53 Z" 
        fill={`url(#leafGrad-${theme})`}
      />
      <path 
        d="M 100 53 C 106 48, 107 42, 100 40 C 93 42, 94 48, 100 53 Z" 
        fill={`url(#leafGrad-${theme})`}
        opacity="0.9"
      />
      <circle cx="100" cy="53" r="2.5" fill={isGold ? "#fef08a" : primaryColor} />

      {/* 2. Stylized Letter "D" */}
      <g>
        <path 
          d="M 78 80 L 78 120 C 78 126, 88 128, 96 123 C 104 118, 107 106, 107 98 C 107 88, 100 78, 86 78 Z" 
          stroke={`url(#leafGrad-${theme})`} 
          strokeWidth="7" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        <path 
          d="M 83 115 C 83 95, 100 90, 101 100 C 101 110, 88 118, 83 115 Z" 
          fill={`url(#leafGrad-${theme})`}
        />
        <path 
          d="M 83 115 L 95 103" 
          stroke={isWhite ? primaryColor : "#ffffff"} 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        <path 
          d="M 75 98 C 65 98, 62 108, 70 114 C 78 120, 78 106, 75 98 Z" 
          fill={`url(#leafGrad-${theme})`}
        />
      </g>

      {/* 3. Stylized Letter "S" */}
      <g transform="translate(10, 0)">
        <path 
          d="M 118 82 C 108 82, 106 94, 114 98 C 122 102, 122 112, 114 116 C 106 120, 104 110, 104 110" 
          stroke={`url(#leafGrad-${theme})`} 
          strokeWidth="7" 
          strokeLinecap="round" 
          fill="none"
        />
        <path 
          d="M 118 82 C 126 80, 131 87, 126 94 C 121 101, 115 90, 118 82 Z" 
          fill={`url(#leafGrad-${theme})`}
        />
        <path 
          d="M 104 110 C 96 112, 91 119, 100 123 C 109 127, 108 116, 104 110 Z" 
          fill={`url(#leafGrad-${theme})`}
        />
      </g>

      {/* 4. Stars Arc */}
      <path 
        d="M 45 136 Q 100 128 155 136" 
        stroke={`url(#leafGrad-${theme})`} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none"
      />
      <polygon 
        points="100,123 102,127 107,127 103,130 105,135 100,132 95,135 97,130 93,127 98,127" 
        fill={isWhite ? "#ffffff" : "#facc15"} 
        filter={`url(#softGlow-${theme})`}
      />
      <polygon 
        points="46,131 47.5,134.5 51.5,134.5 48.5,137 50,141 46,138.5 42,141 43.5,137 40.5,134.5 44.5,134.5" 
        fill={isWhite ? "#ffffff" : "#facc15"} 
      />
      <polygon 
        points="154,131 155.5,134.5 159.5,134.5 156.5,137 158,141 154,138.5 150,141 151.5,137 148.5,134.5 152.5,134.5" 
        fill={isWhite ? "#ffffff" : "#facc15"} 
      />

      {/* 5. Brand Text */}
      {!onlyEmblem && (
        <>
          <text 
            x="100" 
            y="158" 
            textAnchor="middle" 
            fill={textColor} 
            fontSize="16" 
            fontWeight="900" 
            fontFamily="'Tajawal', 'Inter', sans-serif" 
            letterSpacing="0.06em"
          >
            DELTA STARS
          </text>
          
          <text 
            x="100" 
            y="178" 
            textAnchor="middle" 
            fill={isWhite ? "#ffffff" : "#475569"} 
            fontSize="11" 
            fontWeight="bold" 
            fontFamily="'Tajawal', 'Inter', sans-serif" 
            letterSpacing="0.02em"
          >
            شركة نجوم دلتا للتجارة
          </text>
        </>
      )}
    </svg>
  );

  if (logoFailed) {
    return renderSvg();
  }

  return (
    <div className={`relative flex items-center justify-center select-none overflow-hidden ${className}`}>
      <img 
        src={currentSrc} 
        alt="Delta Stars Logo" 
        onError={handleImageError}
        referrerPolicy="no-referrer"
        className={`w-full h-full ${fitMode === 'cover' ? 'object-cover' : 'object-contain'} transition-transform duration-300`}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};



