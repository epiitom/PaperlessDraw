const PencilDrawingBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 800"
        className="absolute inset-0 scale-110"
        style={{ filter: "blur(0.3px) contrast(1.1)" }}
      >
        <defs>
          {/* High contrast gradient for dark background */}
          <radialGradient id="pencilGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </radialGradient>

          {/* Bright sketch gradient */}
          <linearGradient id="sketchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>

          {/* Subtle glow effect */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Paper texture with higher contrast */}
          <pattern id="paperTexture" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect width="20" height="20" fill="transparent" />
            <circle cx="4" cy="4" r="0.5" fill="rgba(255,255,255,0.03)" />
            <circle cx="16" cy="8" r="0.4" fill="rgba(255,255,255,0.025)" />
            <circle cx="8" cy="16" r="0.3" fill="rgba(255,255,255,0.02)" />
            <circle cx="14" cy="14" r="0.4" fill="rgba(255,255,255,0.03)" />
          </pattern>

          {/* Enhanced arrow marker */}
          <marker
            id="arrowhead"
            markerWidth="12"
            markerHeight="10"
            refX="12"
            refY="5"
            orient="auto"
            fill="rgba(255,255,255,0.2)"
          >
            <polygon points="0,0 12,5 0,10" />
          </marker>

          {/* Circuit pattern */}
          <pattern id="circuitPattern" patternUnits="userSpaceOnUse" width="40" height="40">
            <rect width="40" height="40" fill="transparent" />
            <path d="M 0 20 L 10 20 L 15 15 L 25 15 L 30 20 L 40 20" 
                  stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" fill="none" />
            <circle cx="15" cy="15" r="2" stroke="rgba(255,255,255,0.04)" strokeWidth="0.6" fill="none" />
            <circle cx="30" cy="20" r="1.5" stroke="rgba(255,255,255,0.04)" strokeWidth="0.6" fill="none" />
          </pattern>
        </defs>

        {/* Subtle paper texture base */}
        <rect width="100%" height="100%" fill="url(#paperTexture)" />
        
        {/* Circuit pattern overlay */}
        <rect width="100%" height="100%" fill="url(#circuitPattern)" opacity="0.3" />

        {/* Main sketch content - HIGH CONTRAST */}
        <g stroke="url(#sketchGradient)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)">
          
          {/* HERO: Central brain/neural network */}
          <g transform="translate(600,180)" opacity="0.6">
            {/* Main brain outline */}
            <path d="M -40 -20 Q -50 -40 -30 -50 Q 0 -55 30 -50 Q 50 -40 40 -20 Q 45 0 35 20 Q 30 35 15 40 Q 0 42 -15 40 Q -30 35 -35 20 Q -45 0 -40 -20" 
                  strokeWidth="2.5" opacity="0.8" />
            
            {/* Neural pathways inside brain */}
            <path d="M -25 -30 Q -10 -25 5 -30 Q 20 -25 25 -15" strokeWidth="1.2" opacity="0.6" strokeDasharray="3,2" />
            <path d="M -30 -5 Q -15 -10 0 -5 Q 15 -10 30 -5" strokeWidth="1.2" opacity="0.6" strokeDasharray="3,2" />
            <path d="M -20 15 Q -5 10 10 15 Q 25 10 30 20" strokeWidth="1.2" opacity="0.6" strokeDasharray="3,2" />
            
            {/* Synapses/nodes */}
            <circle cx="-20" cy="-25" r="2" strokeWidth="1" opacity="0.7" />
            <circle cx="0" cy="-30" r="2" strokeWidth="1" opacity="0.7" />
            <circle cx="20" cy="-20" r="2" strokeWidth="1" opacity="0.7" />
            <circle cx="-15" cy="0" r="2" strokeWidth="1" opacity="0.7" />
            <circle cx="15" cy="5" r="2" strokeWidth="1" opacity="0.7" />
            <circle cx="0" cy="20" r="2" strokeWidth="1" opacity="0.7" />
            
            {/* External neural connections */}
            <path d="M -40 -35 Q -60 -45 -80 -35 Q -90 -30 -100 -25" strokeWidth="1.8" opacity="0.5" strokeDasharray="4,3" />
            <path d="M 40 -35 Q 60 -45 80 -35 Q 90 -30 100 -25" strokeWidth="1.8" opacity="0.5" strokeDasharray="4,3" />
            <path d="M -35 40 Q -50 60 -70 70 Q -80 75 -90 80" strokeWidth="1.8" opacity="0.5" strokeDasharray="4,3" />
            <path d="M 35 40 Q 50 60 70 70 Q 80 75 90 80" strokeWidth="1.8" opacity="0.5" strokeDasharray="4,3" />
            
            {/* Connection nodes */}
            <circle cx="-100" cy="-25" r="15" strokeWidth="1.8" opacity="0.4" />
            <circle cx="100" cy="-25" r="15" strokeWidth="1.8" opacity="0.4" />
            <circle cx="-90" cy="80" r="15" strokeWidth="1.8" opacity="0.4" />
            <circle cx="90" cy="80" r="15" strokeWidth="1.8" opacity="0.4" />
            
            {/* Node labels */}
            <text x="-100" y="-20" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" fontWeight="600">UI</text>
            <text x="100" y="-20" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" fontWeight="600">UX</text>
            <text x="-90" y="85" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" fontWeight="600">AI</text>
            <text x="90" y="85" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace" fontWeight="600">ML</text>
          </g>

          {/* LEFT SIDE: Architectural blueprint */}
          <g transform="translate(120,420)" opacity="0.4">
            {/* Building structure */}
            <path d="M 0 100 L 0 20 L 40 0 L 80 20 L 80 100 Z" strokeWidth="2" />
            <path d="M 20 45 L 60 45 M 20 60 L 60 60 M 20 75 L 60 75 M 20 90 L 60 90" strokeWidth="1" opacity="0.8" />
            
            {/* Windows grid */}
            <rect x="8" y="30" width="12" height="12" strokeWidth="1" />
            <rect x="28" y="30" width="12" height="12" strokeWidth="1" />
            <rect x="48" y="30" width="12" height="12" strokeWidth="1" />
            <rect x="60" y="30" width="12" height="12" strokeWidth="1" />
            
            {/* Window frames */}
            <path d="M 14 36 L 14 36 M 34 36 L 34 36 M 54 36 L 54 36 M 66 36 L 66 36" strokeWidth="0.8" />
            <path d="M 14 30 L 14 42 M 34 30 L 34 42 M 54 30 L 54 42 M 66 30 L 66 42" strokeWidth="0.5" />
            
            {/* Main entrance */}
            <rect x="32" y="70" width="16" height="30" strokeWidth="1.5" />
            <circle cx="44" cy="85" r="1.5" fill="rgba(255,255,255,0.15)" />
            
            {/* Architectural details */}
            <path d="M 5 20 L 75 20" strokeWidth="0.8" opacity="0.7" strokeDasharray="2,1" />
            <path d="M 40 0 L 40 20" strokeWidth="0.8" opacity="0.7" strokeDasharray="2,1" />
            
            {/* Blueprint annotations */}
            <text x="90" y="25" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">12m</text>
            <text x="90" y="85" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace">8m</text>
          </g>

          {/* RIGHT SIDE: Modern UI mockup */}
          <g transform="translate(950,380)" opacity="0.35">
            {/* Device frame */}
            <rect x="0" y="0" width="140" height="100" rx="12" strokeWidth="2.2" />
            
            {/* Status bar */}
            <rect x="8" y="8" width="124" height="8" strokeWidth="1" />
            <circle cx="15" cy="12" r="2" strokeWidth="0.8" />
            <circle cx="25" cy="12" r="2" strokeWidth="0.8" />
            <circle cx="35" cy="12" r="2" strokeWidth="0.8" />
            <rect x="110" y="10" width="15" height="4" strokeWidth="0.6" />
            
            {/* Content sections */}
            <rect x="12" y="22" width="80" height="6" strokeWidth="1" />
            <rect x="12" y="32" width="100" height="6" strokeWidth="1" />
            <rect x="12" y="42" width="60" height="6" strokeWidth="1" />
            
            {/* Interactive elements */}
            <rect x="12" y="55" width="40" height="18" rx="4" strokeWidth="1.2" />
            <text x="32" y="66" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="monospace">START</text>
            
            {/* Avatar/profile */}
            <circle cx="105" cy="64" r="12" strokeWidth="1.2" />
            <path d="M 98 69 Q 105 66 112 69" strokeWidth="0.8" />
            <circle cx="105" cy="60" r="4" strokeWidth="0.8" />
            
            {/* Navigation dots */}
            <circle cx="60" cy="85" r="2" strokeWidth="0.8" />
            <circle cx="70" cy="85" r="2" strokeWidth="0.8" />
            <circle cx="80" cy="85" r="2" strokeWidth="0.8" />
          </g>

          {/* BOTTOM LEFT: Data visualization */}
          <g transform="translate(200,620)" opacity="0.3">
            {/* Chart frame */}
            <rect x="0" y="0" width="120" height="80" strokeWidth="1.5" />
            
            {/* Y-axis */}
            <path d="M 15 10 L 15 70" strokeWidth="1" />
            <text x="8" y="15" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">100</text>
            <text x="8" y="45" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">50</text>
            <text x="8" y="72" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">0</text>
            
            {/* Data line */}
            <path d="M 15 60 Q 30 45 45 50 Q 60 35 75 40 Q 90 25 105 30" strokeWidth="1.5" opacity="0.8" />
            
            {/* Data points */}
            <circle cx="15" cy="60" r="2" strokeWidth="1" />
            <circle cx="45" cy="50" r="2" strokeWidth="1" />
            <circle cx="75" cy="40" r="2" strokeWidth="1" />
            <circle cx="105" cy="30" r="2" strokeWidth="1" />
            
            {/* Grid lines */}
            <path d="M 15 25 L 110 25 M 15 45 L 110 45 M 15 65 L 110 65" strokeWidth="0.4" opacity="0.6" strokeDasharray="2,3" />
          </g>

          {/* TOP RIGHT: Code/terminal */}
          <g transform="translate(850,120)" opacity="0.25">
            {/* Terminal window */}
            <rect x="0" y="0" width="160" height="100" rx="8" strokeWidth="1.8" />
            
            {/* Title bar */}
            <rect x="0" y="0" width="160" height="20" rx="8" strokeWidth="1" />
            <circle cx="12" cy="10" r="3" strokeWidth="0.8" />
            <circle cx="24" cy="10" r="3" strokeWidth="0.8" />
            <circle cx="36" cy="10" r="3" strokeWidth="0.8" />
            
            {/* Code lines */}
            <rect x="10" y="30" width="4" height="6" strokeWidth="0.8" />
            <rect x="18" y="30" width="60" height="6" strokeWidth="0.6" />
            
            <rect x="10" y="42" width="8" height="6" strokeWidth="0.8" />
            <rect x="22" y="42" width="45" height="6" strokeWidth="0.6" />
            
            <rect x="18" y="54" width="12" height="6" strokeWidth="0.8" />
            <rect x="34" y="54" width="70" height="6" strokeWidth="0.6" />
            
            <rect x="10" y="66" width="6" height="6" strokeWidth="0.8" />
            <rect x="20" y="66" width="35" height="6" strokeWidth="0.6" />
            
            {/* Terminal cursor */}
            <rect x="10" y="78" width="2" height="8" fill="rgba(255,255,255,0.3)" />
            
            {/* Syntax highlighting simulation */}
            <text x="12" y="77" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">npm run dev</text>
          </g>

          {/* MATHEMATICAL FORMULAS */}
          <g transform="translate(300,520)" opacity="0.2">
            <path d="M 0 0 Q 25 -15 50 0 Q 75 15 100 0" strokeWidth="1.2" />
            <circle cx="25" cy="20" r="4" strokeWidth="1" />
            <path d="M 55 20 L 65 10 L 75 20" strokeWidth="1" />
            
            <text x="0" y="40" fill="rgba(255,255,255,0.18)" fontSize="11" fontFamily="monospace">
              f(x) = Σ aₙxⁿ
            </text>
            
            <path d="M 85 35 Q 95 25 105 35 Q 115 45 125 35" strokeWidth="0.8" />
            <text x="90" y="55" fill="rgba(255,255,255,0.12)" fontSize="9" fontFamily="monospace">∞ ∫ ∆</text>
          </g>

          {/* CREATIVE ELEMENTS CLUSTER */}
          <g transform="translate(750,500)" opacity="0.3">
            {/* Enhanced lightbulb */}
            <circle cx="30" cy="25" r="18" strokeWidth="2" />
            <rect x="22" y="43" width="16" height="6" strokeWidth="1.5" />
            <rect x="24" y="49" width="12" height="4" strokeWidth="1.2" />
            
            {/* Filament detail */}
            <path d="M 20 25 Q 30 18 40 25 Q 30 32 20 25" strokeWidth="0.8" opacity="0.7" />
            <path d="M 25 20 Q 30 15 35 20" strokeWidth="0.6" opacity="0.6" />
            
            {/* Bright rays */}
            <path d="M 18 13 L 12 7 M 42 13 L 48 7 M 30 4 L 30 -4 M 12 25 L 4 25 M 48 25 L 56 25 M 18 37 L 12 43 M 42 37 L 48 43" strokeWidth="1.2" />

            {/* Advanced gear system */}
            <g transform="translate(80,15)">
              <circle cx="0" cy="0" r="15" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="8" strokeWidth="1.2" />
              <path d="M -4 -18 L 4 -18 M 18 -4 L 18 4 M 4 18 L -4 18 M -18 4 L -18 -4" strokeWidth="1" />
              <path d="M -13 -13 L -9 -9 M 13 -13 L 9 -9 M 13 13 L 9 9 M -13 13 L -9 9" strokeWidth="1" />
            </g>

            {/* DNA helix */}
            <g transform="translate(0,70)">
              <path d="M 0 0 Q 15 -10 30 0 Q 45 10 60 0 Q 75 -10 90 0" strokeWidth="1.2" />
              <path d="M 0 15 Q 15 5 30 15 Q 45 25 60 15 Q 75 5 90 15" strokeWidth="1.2" />
              <path d="M 15 -5 L 15 10 M 45 5 L 45 20 M 75 -5 L 75 10" strokeWidth="0.8" />
            </g>
          </g>

          {/* FLOWING CONNECTIONS - More prominent */}
          <path
            d="M 100 100 Q 250 140 400 120 Q 550 100 700 130 Q 850 160 1000 140"
            strokeWidth="1.2"
            strokeDasharray="10,6"
            opacity="0.15"
          />

          <path
            d="M 150 700 Q 350 670 550 690 Q 750 710 950 680"
            strokeWidth="1"
            strokeDasharray="8,8"
            opacity="0.12"
          />

          <path
            d="M 50 400 Q 200 380 400 390 Q 600 400 800 390 Q 950 380 1100 390"
            strokeWidth="0.8"
            strokeDasharray="6,10"
            opacity="0.08"
          />

          {/* ANNOTATION ARROWS - Prominent */}
          <g opacity="0.2">
            <path d="M 480 340 L 520 310" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <path d="M 720 300 L 760 270" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <path d="M 250 520 L 200 490" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            <path d="M 850 450 L 900 420" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
          </g>
        </g>

        {/* AUTHENTIC HAND-DRAWN IMPERFECTIONS */}
        <g stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" opacity="0.4">
          <path d="M 140 140 Q 148 136 156 140 Q 164 144 172 140" />
          <path d="M 700 500 Q 708 496 716 500 Q 724 504 732 500" />
          <path d="M 350 350 Q 356 346 362 350 Q 368 354 374 350" />
          <path d="M 820 220 Q 826 224 832 220 Q 838 216 844 220" />
          <path d="M 480 580 Q 484 576 488 580" />
          <path d="M 980 380 Q 984 384 988 380" />
        </g>

        {/* PROMINENT TEXTURE DOTS */}
        <g opacity="0.12">
          <circle cx="200" cy="300" r="1.5" fill="rgba(255,255,255,0.2)" />
          <circle cx="380" cy="220" r="1.2" fill="rgba(255,255,255,0.15)" />
          <circle cx="780" cy="380" r="1.5" fill="rgba(255,255,255,0.2)" />
          <circle cx="480" cy="520" r="1.2" fill="rgba(255,255,255,0.15)" />
          <circle cx="680" cy="470" r="1.5" fill="rgba(255,255,255,0.2)" />
          <circle cx="920" cy="280" r="1.2" fill="rgba(255,255,255,0.15)" />
          <circle cx="250" cy="450" r="1" fill="rgba(255,255,255,0.12)" />
          <circle cx="580" cy="180" r="1.2" fill="rgba(255,255,255,0.15)" />
          <circle cx="820" cy="620" r="1.5" fill="rgba(255,255,255,0.2)" />
          <circle cx="150" cy="380" r="1" fill="rgba(255,255,255,0.12)" />
        </g>

        {/* SUBTLE GRID FOR STRUCTURE */}
        <g opacity="0.03" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5">
          <path d="M 400 0 L 400 800 M 800 0 L 800 800" strokeDasharray="4,20" />
          <path d="M 0 200 L 1200 200 M 0 600 L 1200 600" strokeDasharray="4,20" />
        </g>
      </svg>
    </div>
  )
}

export default PencilDrawingBackground