import './LiquidBackground.css';

export default function LiquidBackground() {
  return (
    <div className="liquid-bg-container">
      {/* SVG Filter for deep liquid distortion */}
      <svg style={{ display: 'none' }}>
        <defs>
          <filter id="fluid">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.005" 
              numOctaves="4" 
              result="noise" 
            />
            <feColorMatrix 
              type="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" 
              in="noise" 
              result="coloredNoise" 
            />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="coloredNoise" 
              scale="100" 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
          </filter>
        </defs>
      </svg>

      {/* The fluid mesh layers */}
      <div className="liquid-mesh">
        <div className="liquid-orb orb-mint" />
        <div className="liquid-orb orb-pink" />
        <div className="liquid-orb orb-purple" />
        <div className="liquid-orb orb-deep" />
      </div>

      {/* Grain texture overlay for a premium matte finish */}
      <div className="liquid-grain" />
    </div>
  );
}
