import { Composition } from "remotion";
import { CanopyReplay, CommandAmbient } from "./VisualAssets";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="CommandAmbient"
        component={CommandAmbient}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={480}
      />
      <Composition
        id="CanopyReplay"
        component={CanopyReplay}
        durationInFrames={180}
        fps={30}
        width={720}
        height={540}
      />
    </>
  );
}
