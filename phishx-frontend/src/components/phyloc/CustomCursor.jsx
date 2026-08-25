import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [clicks, setClicks] = useState([]);

  // Smooth orbiting trailing for the rays
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 400, mass: 0.15 }; // Lighter mass for faster, tighter tracking
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const manageMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      
      const target = e.target;
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName.toLowerCase() === 'input'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const manageMouseDown = (e) => {
      // Spawn a small electric shockwave on click
      setClicks((prev) => [...prev, { id: Date.now(), x: e.clientX, y: e.clientY }]);
    };

    window.addEventListener('mousemove', manageMouseMove);
    window.addEventListener('mousedown', manageMouseDown);

    return () => {
      window.removeEventListener('mousemove', manageMouseMove);
      window.removeEventListener('mousedown', manageMouseDown);
    };
  }, [mouseX, mouseY]);

  // 16 perpendicular rays
  const rays = Array.from({ length: 16 });

  return (
    <>
      {/* 1. Small Explosive Click Shockwaves */}
      {clicks.map(click => (
         <motion.div
           key={click.id}
           style={{
             position: 'fixed',
             left: click.x,
             top: click.y,
             width: '10px',
             height: '10px',
             borderRadius: '50%',
             border: '1.5px solid var(--cyan)',
             pointerEvents: 'none',
             zIndex: 999998,
             marginLeft: '-5px',
             marginTop: '-5px',
           }}
           initial={{ scale: 1, opacity: 1 }}
           // Substantially reduced click scale per user request
           animate={{ scale: [1, 4], opacity: [1, 0], borderWidth: ['2px', '0px'] }}
           transition={{ duration: 0.4, ease: "easeOut" }}
           onAnimationComplete={() => setClicks(prev => prev.filter(c => c.id !== click.id))}
         />
      ))}

      {/* 2. Compact Ray Ring & Center Circle */}
      <motion.div
        style={{
          position: 'fixed', left: 0, top: 0,
          x: smoothX, y: smoothY,
          pointerEvents: 'none', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          // Much smaller total footprint (24x24)
          width: '24px', height: '24px', marginLeft: '-12px', marginTop: '-12px',
        }}
        animate={{ scale: isHovering ? 1.4 : 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" style={{ overflow: 'visible', filter: 'drop-shadow(0 0 3px var(--cyan))' }}>
          
          {/* Wall of the Center Circle */}
          <circle 
             cx="12" cy="12" r="4" 
             fill="none" stroke="var(--cyan)" strokeWidth="1.5" 
          />
          
          {/* Rotate the entire ray system slowly */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            style={{ originX: '12px', originY: '12px' }}
          >
            {/* The Perpendicular Rays */}
            {rays.map((_, i) => (
              <motion.line 
                key={i}
                // x=12 is center. y=8 starts exactly at r=4 (12-4). y=2 extends outwards.
                x1="12" y1="8" x2="12" y2="2"
                stroke={isHovering ? "var(--accent)" : "var(--cyan)"} 
                strokeWidth="1" 
                strokeLinecap="round"
                // Creates the flowing electric dash effect
                strokeDasharray="2 3"
                initial={{ strokeDashoffset: 5 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                // Rotate each ray perfectly around the center circle
                style={{ originX: '12px', originY: '12px', rotate: i * (360 / 16) }}
              />
            ))}
          </motion.g>
        </svg>
      </motion.div>
    </>
  );
}
