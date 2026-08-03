import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const mint = "#4f8d69";
const paleMint = "#98c9a6";

const nodeLayout = [
  [7, 25, 8], [17, 71, 5], [29, 34, 6], [38, 80, 8], [48, 18, 5],
  [58, 63, 7], [68, 31, 6], [77, 74, 8], [87, 22, 5], [94, 59, 7],
] as const;

const connectors = [
  [7, 25, 29, 34], [17, 71, 38, 80], [29, 34, 48, 18], [38, 80, 58, 63],
  [48, 18, 68, 31], [58, 63, 77, 74], [68, 31, 87, 22], [77, 74, 94, 59],
] as const;

function connectionStyle([x1, y1, x2, y2]: readonly number[]): CSSProperties {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return {
    position: "absolute",
    left: `${x1}%`,
    top: `${y1}%`,
    width: `${Math.hypot(dx * 12.8, dy * 4.8)}px`,
    height: 1,
    transformOrigin: "left center",
    transform: `rotate(${Math.atan2(dy * 4.8, dx * 12.8)}rad)`,
    background: "linear-gradient(90deg, rgba(79,141,105,.08), rgba(79,141,105,.34), rgba(79,141,105,.08))",
  };
}

export function CommandAmbient() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const phase = (frame / durationInFrames) * Math.PI * 2;
  const sweep = interpolate(frame, [0, durationInFrames], [-18, 116], {
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "linear-gradient(135deg, #fbfdfb 0%, #edf5ef 56%, #f4f8f4 100%)" }}>
      <AbsoluteFill style={{ opacity: 0.58, transform: `translateX(${Math.sin(phase) * 12}px)`, backgroundImage: "linear-gradient(rgba(47,109,80,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(47,109,80,.055) 1px, transparent 1px)", backgroundSize: "54px 54px" }} />
      <div style={{ position: "absolute", width: 480, height: 480, right: -50 + Math.sin(phase) * 16, top: -155, borderRadius: "50%", background: "radial-gradient(circle, rgba(111,183,133,.24), rgba(111,183,133,.07) 44%, transparent 70%)" }} />
      <div style={{ position: "absolute", width: 390, height: 390, left: 130 + Math.cos(phase) * 10, bottom: -245, borderRadius: "50%", background: "radial-gradient(circle, rgba(75,146,136,.16), transparent 70%)" }} />

      {connectors.map((line, index) => (
        <div key={index} style={{ ...connectionStyle(line), opacity: 0.45 + Math.sin(phase + index * 0.72) * 0.2 }} />
      ))}
      {nodeLayout.map(([left, top, size], index) => {
        const pulse = 1 + Math.sin(phase + index * 0.86) * 0.26;
        return (
          <div key={index} style={{ position: "absolute", left: `${left}%`, top: `${top}%`, width: size * 3.2, height: size * 3.2, transform: `translate(-50%, -50%) scale(${pulse})`, borderRadius: "50%", background: index % 3 === 0 ? paleMint : mint, border: "2px solid rgba(255,255,255,.78)", boxShadow: `0 0 ${18 + size}px rgba(79,141,105,.28)` }}>
            <span style={{ position: "absolute", inset: -9, border: "1px solid rgba(79,141,105,.16)", borderRadius: "50%" }} />
          </div>
        );
      })}

      {[0, 1, 2].map((layer) => (
        <div key={layer} style={{ position: "absolute", right: 96 + layer * 31, top: 135 + layer * 65, width: 300, height: 56, transform: `perspective(500px) rotateX(58deg) translateX(${Math.sin(phase + layer) * 7}px)`, border: "1px solid rgba(47,109,80,.23)", borderRadius: 18, background: `linear-gradient(90deg, rgba(255,255,255,.48), rgba(111,183,133,${0.08 + layer * 0.035}))`, boxShadow: "0 16px 30px rgba(25,55,42,.07)" }} />
      ))}

      <div style={{ position: "absolute", left: `${sweep}%`, top: 0, bottom: 0, width: 150, transform: "skewX(-12deg)", background: "linear-gradient(90deg, transparent, rgba(127,190,145,.13), transparent)", filter: "blur(3px)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(248,251,248,.92) 0%, rgba(248,251,248,.64) 37%, transparent 70%)" }} />
    </AbsoluteFill>
  );
}

export function CanopyReplay() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const phase = (frame / durationInFrames) * Math.PI * 2;
  const scan = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [15, 82, 15], {
    easing: Easing.inOut(Easing.cubic),
  });
  const boxes = [
    { left: 16, top: 31, width: 21, height: 19, delay: 0 },
    { left: 56, top: 25, width: 18, height: 17, delay: 22 },
    { left: 41, top: 57, width: 24, height: 21, delay: 44 },
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#102b20" }}>
      <Img
        src={staticFile("farm-layer-03.webp")}
        style={{ width: "108%", height: "108%", objectFit: "cover", transform: `translate(${Math.sin(phase) * 1.2 - 4}%, ${Math.cos(phase) * 0.8 - 4}%) scale(${1.025 + Math.sin(phase) * 0.008})`, filter: "saturate(.96) contrast(1.04) brightness(.88)" }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,20,13,.24), transparent 42%, rgba(5,20,13,.76)), linear-gradient(90deg, rgba(12,52,34,.28), transparent 60%)" }} />

      {boxes.map((box, index) => {
        const opacity = interpolate((frame + box.delay) % durationInFrames, [0, 18, 90, 150, 179], [0.18, 0.82, 0.55, 0.86, 0.18]);
        return (
          <div key={index} style={{ position: "absolute", left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%`, border: "2px solid rgba(181,241,195,.88)", borderRadius: 4, opacity, boxShadow: "inset 0 0 20px rgba(130,241,174,.08), 0 0 14px rgba(130,241,174,.09)" }}>
            <div style={{ position: "absolute", left: -2, top: -2, width: 18, height: 2, background: "#d3f7dc" }} />
            <div style={{ position: "absolute", left: -2, top: -2, width: 2, height: 18, background: "#d3f7dc" }} />
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 0, right: 0, top: `${scan}%`, height: 2, background: "linear-gradient(90deg, transparent, #b8f2c6 35%, #f2fff5 50%, #b8f2c6 65%, transparent)", boxShadow: "0 0 18px rgba(152,237,174,.85)" }} />
      <div style={{ position: "absolute", inset: `${scan}% 0 auto`, height: 90, transform: "translateY(-100%)", background: "linear-gradient(transparent, rgba(141,231,164,.08))" }} />
      <AbsoluteFill style={{ opacity: 0.17, backgroundImage: "linear-gradient(rgba(194,246,207,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(194,246,207,.2) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
    </AbsoluteFill>
  );
}
