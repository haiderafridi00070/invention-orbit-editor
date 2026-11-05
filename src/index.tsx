import React from "react";
import { Composition, registerRoot } from "remotion";
import { KineticNumber } from "./KineticNumber";

/**
 * Entry point. One composition for the proof of concept:
 * "KineticNumber" — 1920x1080, 30 fps, 4 seconds (120 frames),
 * transparent background, rendered to a ProRes 4444 MOV by the
 * GitHub Actions workflow (see .github/workflows/render-test.yml).
 */
const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="KineticNumber"
      component={KineticNumber}
      durationInFrames={120}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        mainText: "$ 10,800",
        unitText: "PER TON",
      }}
    />
  );
};

registerRoot(RemotionRoot);
