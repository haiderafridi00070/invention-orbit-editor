import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_STACK } from "./style";

/**
 * LogoBug — the constant channel bug: a circular badge reading
 * INVENTION ORBIT, rendered once as a transparent PNG (176x176) and
 * overlaid top-right for the whole video by assemble.sh (dropped only
 * during beat 49, whose source already carries its own top-right
 * title bug — see edit-spec/text-events.md).
 */
export const LogoBug: React.FC = () => {
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", background: "transparent" }}
    >
      <div
        style={{
          width: 166,
          height: 166,
          borderRadius: "50%",
          background: "rgba(5,9,16,0.78)",
          border: "3px solid rgba(255,255,255,0.92)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: FONT_STACK,
          fontWeight: 800,
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 19, letterSpacing: "0.16em", marginLeft: "0.16em" }}>
          INVENTION
        </div>
        <div style={{ fontSize: 41, letterSpacing: "0.08em", marginLeft: "0.08em", lineHeight: 1.1 }}>
          ORBIT
        </div>
      </div>
    </AbsoluteFill>
  );
};
