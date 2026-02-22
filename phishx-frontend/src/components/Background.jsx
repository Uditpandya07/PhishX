import DotGrid from "./DotGrid";

export default function Background() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,        // behind everything
        backgroundColor: "#000000"
      }}
    >
      <DotGrid
        dotSize={4}
        gap={18}
        baseColor="#2a2a3f"
        activeColor="#7B61FF"      // brighter purple
        proximity={140}
        shockRadius={250}
        shockStrength={5}
        resistance={750}
        returnDuration={1.5}
      />
    </div>
  );
}