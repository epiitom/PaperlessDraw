

import React from 'react';

const PencilDrawingBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.7]">
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 1200 800" 
        className="absolute inset-0 scale-110"
        style={{ filter: 'blur(0.5px)' }}
      >
        <defs>
          {/* Gradient for depth */}
          <radialGradient id="pencilGradient" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </radialGradient>
          
          {/* Sketch texture pattern */}
          <pattern id="sketchTexture" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M0,2 L4,2" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            <path d="M2,0 L2,4" stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
          </pattern>
        </defs>
        
        {/* Background texture */}
        <rect width="100%" height="100%" fill="url(#sketchTexture)" />
        
        {/* Main geometric composition */}
        <g stroke="url(#pencilGradient)" strokeWidth="1.5" fill="none" strokeLinecap="round">
          
          {/* Central mindmap/flowchart structure */}
          <circle cx="600" cy="200" r="40" strokeWidth="2" />
          <text x="600" y="205" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="12" fontFamily="monospace">IDEAS</text>
          
          {/* Connecting branches */}
          <path d="M 560 180 Q 480 120 400 140" strokeDasharray="3,2" />
          <path d="M 640 180 Q 720 120 800 140" strokeDasharray="3,2" />
          <path d="M 580 240 Q 520 320 450 300" strokeDasharray="3,2" />
          <path d="M 620 240 Q 680 320 750 300" strokeDasharray="3,2" />
          
          {/* Branch nodes */}
          <circle cx="400" cy="140" r="25" strokeWidth="1.5" />
          <circle cx="800" cy="140" r="25" strokeWidth="1.5" />
          <circle cx="450" cy="300" r="25" strokeWidth="1.5" />
          <circle cx="750" cy="300" r="25" strokeWidth="1.5" />
          
          {/* Architectural sketches */}
          <g transform="translate(100,400)">
            {/* Building outline */}
            <path d="M 0 100 L 0 20 L 40 0 L 80 20 L 80 100 Z" strokeWidth="1.2" />
            <path d="M 20 40 L 60 40" strokeWidth="0.8" />
            <path d="M 20 60 L 60 60" strokeWidth="0.8" />
            <path d="M 20 80 L 60 80" strokeWidth="0.8" />
            {/* Windows */}
            <rect x="10" y="30" width="8" height="12" strokeWidth="0.6" />
            <rect x="25" y="30" width="8" height="12" strokeWidth="0.6" />
            <rect x="45" y="30" width="8" height="12" strokeWidth="0.6" />
            <rect x="62" y="30" width="8" height="12" strokeWidth="0.6" />
          </g>
          
          {/* UI wireframes */}
          <g transform="translate(950,450)">
            <rect x="0" y="0" width="120" height="80" rx="8" strokeWidth="1.2" />
            <rect x="10" y="10" width="100" height="8" strokeWidth="0.8" />
            <rect x="10" y="25" width="60" height="6" strokeWidth="0.6" />
            <rect x="10" y="35" width="80" height="6" strokeWidth="0.6" />
            <circle cx="90" cy="55" r="15" strokeWidth="1" />
            <rect x="10" y="50" width="30" height="15" strokeWidth="0.8" />
          </g>
          
          {/* Mathematical formulas */}
          <g transform="translate(200,600)">
            <path d="M 0 0 Q 20 -10 40 0 Q 60 10 80 0" strokeWidth="1" />
            <circle cx="20" cy="15" r="3" strokeWidth="0.8" />
            <path d="M 40 15 L 50 5 L 60 15" strokeWidth="0.8" />
            <text x="0" y="35" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="monospace">f(x) = ∑</text>
          </g>
          
          {/* Creative doodles */}
          <g transform="translate(850,600)">
            {/* Lightbulb */}
            <circle cx="25" cy="20" r="12" strokeWidth="1.2" />
            <path d="M 20 32 L 30 32" strokeWidth="1" />
            <path d="M 22 36 L 28 36" strokeWidth="0.8" />
            <path d="M 15 15 L 10 10" strokeWidth="0.6" />
            <path d="M 35 15 L 40 10" strokeWidth="0.6" />
            <path d="M 25 5 L 25 0" strokeWidth="0.6" />
            
            {/* Star burst */}
            <g transform="translate(60,10)">
              <path d="M 0 0 L 8 8" strokeWidth="0.8" />
              <path d="M 8 0 L 0 8" strokeWidth="0.8" />
              <path d="M 4 0 L 4 8" strokeWidth="0.8" />
              <path d="M 0 4 L 8 4" strokeWidth="0.8" />
            </g>
          </g>
          
          {/* Organic flow lines */}
          <path d="M 50 50 Q 200 100 350 80 Q 500 60 650 100 Q 800 140 950 120" 
                strokeWidth="0.8" 
                strokeDasharray="5,5" 
                opacity="0.6" />
          
          <path d="M 100 700 Q 300 650 500 680 Q 700 710 900 670" 
                strokeWidth="0.8" 
                strokeDasharray="3,7" 
                opacity="0.4" />
          
          {/* Grid system hints */}
          <g opacity="0.2">
            <path d="M 300 0 L 300 800" strokeWidth="0.3" strokeDasharray="1,4" />
            <path d="M 600 0 L 600 800" strokeWidth="0.3" strokeDasharray="1,4" />
            <path d="M 900 0 L 900 800" strokeWidth="0.3" strokeDasharray="1,4" />
            <path d="M 0 200 L 1200 200" strokeWidth="0.3" strokeDasharray="1,4" />
            <path d="M 0 400 L 1200 400" strokeWidth="0.3" strokeDasharray="1,4" />
            <path d="M 0 600 L 1200 600" strokeWidth="0.3" strokeDasharray="1,4" />
          </g>
          
          {/* Annotation arrows */}
          <g transform="translate(500,350)">
            <path d="M 0 0 L 30 -20" strokeWidth="1" markerEnd="url(#arrowhead)" />
            <path d="M 60 10 L 90 -10" strokeWidth="1" markerEnd="url(#arrowhead)" />
          </g>
          
          {/* Arrow marker */}
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" 
                    refX="6" refY="2" orient="auto" fill="rgba(255,255,255,0.4)">
              <polygon points="0,0 6,2 0,4" />
            </marker>
          </defs>
          
          {/* Scattered dots for texture */}
          <g opacity="0.3">
            <circle cx="150" cy="250" r="1" fill="rgba(255,255,255,0.4)" />
            <circle cx="320" cy="180" r="1" fill="rgba(255,255,255,0.4)" />
            <circle cx="780" cy="380" r="1" fill="rgba(255,255,255,0.4)" />
            <circle cx="420" cy="520" r="1" fill="rgba(255,255,255,0.4)" />
            <circle cx="680" cy="480" r="1" fill="rgba(255,255,255,0.4)" />
            <circle cx="920" cy="280" r="1" fill="rgba(255,255,255,0.4)" />
          </g>
        </g>
        
        {/* Subtle hand-drawn imperfections */}
        <g stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none">
          <path d="M 100 100 Q 120 105 140 100 Q 160 95 180 100" />
          <path d="M 700 500 Q 720 495 740 500 Q 760 505 780 500" />
        </g>
      </svg>
    </div>
  );
};

export default PencilDrawingBackground;