"use client";

import { EffectComposer, HueSaturation, Noise, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export default function Effects({ isTouch }: { isTouch: boolean }) {
  return (
    <EffectComposer enableNormalPass multisampling={isTouch ? 0 : 4}>
      <HueSaturation saturation={-0.3} />
      <Vignette eskil={false} offset={0.3} darkness={0.6} />
      <Noise opacity={isTouch ? 0.15 : 0.3} blendFunction={BlendFunction.SOFT_LIGHT} />
      <ChromaticAberration offset={[0.001, 0.001]} />
    </EffectComposer>
  );
}
