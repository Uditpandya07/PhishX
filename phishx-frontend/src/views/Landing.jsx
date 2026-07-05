"use client";
import { motion } from "framer-motion";
import Orb from "../components/Orb";

export default function Landing({ onEnter }) {
  return (
    <div
      onClick={onEnter}
      style={{
        height: "100dvh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        backgroundColor: "#000000"
      }}
    >
      <Orb
        hue={280}
        hoverIntensity={0.4}
        rotateOnHover={false}
        backgroundColor="#000000"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          pointerEvents: "none"
        }}
      >
        <img
          src="/logo.png"
          alt="PhishX"
          style={{
            width: "100%",
            maxWidth: 280,
            padding: "0 30px",
            boxSizing: "border-box",
            filter: "drop-shadow(0 0 80px rgba(168,85,247,0.8))"
          }}
        />

        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          style={{
            marginTop: 40,
            fontSize: "clamp(9px, 2.5vw, 12px)",
            letterSpacing: "1.5px",
            color: "#888",
            textAlign: "center",
            padding: "0 20px"
          }}
        >
          CLICK TO CONTINUE
        </motion.p>
      </motion.div>
    </div>
  );
}
