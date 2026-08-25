"use client";
import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { usePathname } from "next/navigation";

export default function CustomCursor() {
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  // Determine cursor color based on route
  const isPhyloc = pathname?.startsWith('/phyloc');
  const mainColor = isPhyloc ? "#0ea5e9" : "#4ade80";
  const rgbaColor = isPhyloc ? "14, 165, 233" : "74, 222, 128";

  // Mouse position values
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Balanced spring for a smooth, responsive feel
  const springConfig = { damping: 25, stiffness: 300, mass: 0.4 };
  const cursorXSpring = useSpring(mouseX, springConfig);
  const cursorYSpring = useSpring(mouseY, springConfig);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile or touch-enabled
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 768 || window.matchMedia("(pointer: coarse)").matches
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const moveCursor = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    // Detect if hovering over clickable elements
    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button") ||
        window.getComputedStyle(target).cursor === "pointer"
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [mouseX, mouseY, isVisible, isMounted]);

  if (!isMounted || isMobile) return null;

  return (
    <>
      {/* Center dot (visible, instant follow) */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          backgroundColor: mainColor,
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 99999,
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 1 : 0,
          boxShadow: `0 0 10px rgba(${rgbaColor}, 0.6)`
        }}
      />
      {/* Outer crosshair ring (smooth follow + minimal click effect) */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 25,
          height: 25,
          border: `1.5px solid rgba(${rgbaColor}, 0.6)`,
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 99998,
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 1 : 0,
          backgroundColor: isClicking ? `rgba(${rgbaColor}, 0.15)` : "transparent",
        }}
        animate={{
          scale: isClicking ? 0.8 : isHovering ? 1.2 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Subtle Radar crosshairs */}
        <div style={{ position: "absolute", top: "-4px", left: "50%", width: "1.5px", height: "6px", background: mainColor, transform: "translateX(-50%)", opacity: 0.8 }} />
        <div style={{ position: "absolute", bottom: "-4px", left: "50%", width: "1.5px", height: "6px", background: mainColor, transform: "translateX(-50%)", opacity: 0.8 }} />
        <div style={{ position: "absolute", top: "50%", left: "-4px", width: "6px", height: "1.5px", background: mainColor, transform: "translateY(-50%)", opacity: 0.8 }} />
        <div style={{ position: "absolute", top: "50%", right: "-4px", width: "6px", height: "1.5px", background: mainColor, transform: "translateY(-50%)", opacity: 0.8 }} />
      </motion.div>
    </>
  );
}
