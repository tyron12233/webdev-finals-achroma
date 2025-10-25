"use client";

import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Vector3 } from "three";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { getMoveAxes, consumeLookDelta, isTouchMode } from "./inputStore";

function useWASD() {
  const [state, set] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
  });
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "KeyW") set((s) => ({ ...s, w: true }));
      if (e.code === "KeyA") set((s) => ({ ...s, a: true }));
      if (e.code === "KeyS") set((s) => ({ ...s, s: true }));
      if (e.code === "KeyD") set((s) => ({ ...s, d: true }));
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "KeyW") set((s) => ({ ...s, w: false }));
      if (e.code === "KeyA") set((s) => ({ ...s, a: false }));
      if (e.code === "KeyS") set((s) => ({ ...s, s: false }));
      if (e.code === "KeyD") set((s) => ({ ...s, d: false }));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  return state;
}

export default function FPSControls({
  // Movement
  speed = 2,
  eyeHeight = 1.6,
  capsuleRadius = 0.3,
  capsuleHeight = 1.0,

  // Bobbing config
  bobEnabled = true,
  minStepFrequency = 0.1, // Hz at slow walk
  maxStepFrequency = 0.8, // Hz at fast walk/jog
  verticalBobAmplitude = 0.015, // meters
  lateralBobAmplitude = 0.01, // meters (side sway)
  bobSmoothing = 8, // how quickly intensity blends (higher = snappier)
  speedAmplitudeInfluence = 1, // 0..1, how much speed scales amplitude
  onFootstep,

  // Movement interpolation
  acceleration = 18, // m/s^2
  deceleration = 22, // m/s^2

  // Cadence interpolation and shaping
  stepSmoothing = 6, // how quickly cadence follows speed
  verticalHarmonic = 0.15, // adds subtle 4th harmonic to vertical for realism
  strafeLateralFactor = 0.6, // lateral sway weight when strafing vs forward

  // Debug
  debugBob = false,
  debugBobWidth = 260,
  debugBobHeight = 120,
  debugToggleKey = "KeyB",
  onLockChange,
}: {
  speed?: number;
  eyeHeight?: number;
  capsuleRadius?: number;
  capsuleHeight?: number;

  // Bobbing config
  bobEnabled?: boolean;
  minStepFrequency?: number;
  maxStepFrequency?: number;
  verticalBobAmplitude?: number;
  lateralBobAmplitude?: number;
  bobSmoothing?: number;
  speedAmplitudeInfluence?: number; // 0..1
  onFootstep?: (foot: "left" | "right") => void; // optional step callback

  // Debug
  debugBob?: boolean;
  debugBobWidth?: number;
  debugBobHeight?: number;
  debugToggleKey?: string; // e.g., "KeyB"

  // Movement interpolation
  acceleration?: number;
  deceleration?: number;

  // Cadence interpolation and shaping
  stepSmoothing?: number;
  verticalHarmonic?: number;
  strafeLateralFactor?: number;
  onLockChange?: (locked: boolean) => void;
}) {
  const { camera } = useThree();
  const keys = useWASD();
  const right = useMemo(() => new Vector3(), []);
  const dir = useMemo(() => new Vector3(), []);
  const worldDir = useMemo(() => new Vector3(), []);
  const upVec = useMemo(() => new Vector3(0, 1, 0), []);
  const bobRef = useRef({
    phase: 0,
    intensity: 0,
    lastPhase: 0,
    smoothedHz: 0,
  });
  const bodyRef = useRef<RapierRigidBody>(null);
  // Debug overlay data stream
  // Defer import type to avoid client/server mismatch
  type BobDebugData = {
    phase: number;
    intensity: number;
    stepHz: number;
    verticalBobAmplitude: number;
    lateralBobAmplitude: number;
  };
  const debugDataRef = useRef<BobDebugData>({
    phase: 0,
    intensity: 0,
    stepHz: 0,
    verticalBobAmplitude,
    lateralBobAmplitude,
  });
  const [debugOn, setDebugOn] = useState<boolean>(!!debugBob);
  const [isTouch, setIsTouch] = useState(false);

  // Detect touch devices to disable pointer lock and use touch look instead
  useEffect(() => {
    const touch =
      "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
    setIsTouch(touch);
  }, []);

  // Keep internal toggle in sync with prop if it changes
  useEffect(() => {
    setDebugOn(!!debugBob);
  }, [debugBob]);

  // Toggle debug overlay with a key press (default: B)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === debugToggleKey) {
        setDebugOn((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [debugToggleKey]);

  // Derived offsets
  const halfHeight = capsuleHeight / 2;
  const baseOffset = halfHeight + capsuleRadius; // center->feet offset

  // Follow player without touching camera roll/yaw/pitch (managed by PLC)
  useFrame((_, delta) => {
    const body = bodyRef.current;
    if (!body) return;

    // Read mobile movement axes (if any)
    const axes = getMoveAxes();
    const hasMobileMove = Math.abs(axes.x) > 0.001 || Math.abs(axes.y) > 0.001;
    const usingTouch = isTouchMode();

    const isMoving = keys.w || keys.a || keys.s || keys.d || hasMobileMove;

    // Get forward direction from camera (flattened Y)
    camera.getWorldDirection(worldDir);
    worldDir.y = 0;
    worldDir.normalize();

    // Right vector = forward x global up (avoid using camera.up to prevent tilt issues)
    right.crossVectors(worldDir, upVec).normalize();

    // Movement direction from WASD or mobile axes
    dir.set(0, 0, 0);
    if (usingTouch && hasMobileMove) {
      // mobile: y => forward, x => strafe
      dir.add(worldDir.clone().multiplyScalar(axes.y));
      dir.add(right.clone().multiplyScalar(axes.x));
    } else {
      if (keys.w) dir.add(worldDir);
      if (keys.s) dir.add(worldDir.clone().multiplyScalar(-1));
      if (keys.a) dir.add(right.clone().multiplyScalar(-1));
      if (keys.d) dir.add(right);
    }

    // Desired horizontal velocity (m/s)
    let desiredX = 0;
    let desiredZ = 0;
    if (isMoving && dir.lengthSq() > 0) {
      dir.normalize();
      desiredX = dir.x * speed;
      desiredZ = dir.z * speed;
    }

    // Smooth acceleration/deceleration towards desired velocity
    const lin = body.linvel();
    const moveTowards = (current: number, target: number) => {
      const increasing = Math.abs(target) > Math.abs(current);
      const rate = increasing ? acceleration : deceleration; // m/s^2
      const maxDelta = rate * delta;
      const deltaV = target - current;
      if (Math.abs(deltaV) <= maxDelta) return target;
      return current + Math.sign(deltaV) * maxDelta;
    };
    const newVX = moveTowards(lin.x, desiredX);
    const newVZ = moveTowards(lin.z, desiredZ);
    body.setLinvel({ x: newVX, y: lin.y, z: newVZ }, true);

    // Head/camera bobbing (natural, speed-aligned and configurable)
    let vertical = 0;
    let lateral = 0;
    let stepHz = 0;
    let ampScale = 1;
    if (bobEnabled) {
      // Use actual current velocity (post smoothing) for realism
      const speed2D = Math.hypot(newVX, newVZ); // m/s
      const normalizedSpeed = Math.min(1, speed2D / Math.max(0.001, speed));
      // Intensity follows normalized speed rather than just on/off
      const targetIntensity = normalizedSpeed;
      bobRef.current.intensity +=
        (targetIntensity - bobRef.current.intensity) *
        Math.min(1, bobSmoothing * delta);

      // Cadence scales between min..max based on speed
      const targetHz =
        minStepFrequency +
        (maxStepFrequency - minStepFrequency) * normalizedSpeed;
      // Smooth cadence to avoid sudden jumps
      bobRef.current.smoothedHz +=
        (targetHz - bobRef.current.smoothedHz) *
        Math.min(1, stepSmoothing * delta);
      stepHz = bobRef.current.smoothedHz;
      if (bobRef.current.intensity > 0.001 && stepHz > 0.0001) {
        bobRef.current.lastPhase = bobRef.current.phase;
        bobRef.current.phase =
          (bobRef.current.phase + stepHz * 2 * Math.PI * delta) % (Math.PI * 2);

        // Optional footstep callback at phase crossings (0 => right, pi => left by convention)
        if (onFootstep) {
          const from = bobRef.current.lastPhase;
          const to = bobRef.current.phase;
          const crossed = (thr: number) =>
            (from < thr && to >= thr) ||
            (from > to && (from < thr || to >= thr)); // handle wrap-around
          if (crossed(0)) onFootstep("right");
          if (crossed(Math.PI)) onFootstep("left");
        }
      }

      ampScale =
        1 - speedAmplitudeInfluence + speedAmplitudeInfluence * normalizedSpeed;
      // Two vertical peaks per cycle + subtle 4th harmonic for a quick-drop feel
      const phi = bobRef.current.phase;
      const sin2 = Math.sin(phi * 2);
      const shapedVertical = sin2 + verticalHarmonic * Math.sin(phi * 4);
      vertical =
        shapedVertical *
        verticalBobAmplitude *
        bobRef.current.intensity *
        ampScale;

      // Lateral sway stronger when moving forward/back, lighter on pure strafe
      // Compute forward alignment of velocity
      let forwardAlign = 0;
      if (speed2D > 0.0001) {
        const velDirX = newVX / speed2D;
        const velDirZ = newVZ / speed2D;
        // worldDir is normalized forward
        forwardAlign = Math.abs(velDirX * worldDir.x + velDirZ * worldDir.z); // 0..1
      }
      const lateralWeight =
        strafeLateralFactor + (1 - strafeLateralFactor) * forwardAlign;
      lateral =
        Math.sin(phi) *
        lateralBobAmplitude *
        lateralWeight *
        bobRef.current.intensity *
        ampScale;
    }

    // Apply mobile look deltas to camera
    if (usingTouch) {
      const { dx, dy } = consumeLookDelta();
      if (dx !== 0 || dy !== 0) {
        const sens = 0.0025; // radians per pixel
        // Yaw then pitch; limit pitch
        camera.rotation.order = "YXZ";
        camera.rotation.y -= dx * sens;
        camera.rotation.x -= dy * sens;
        const lim = Math.PI / 2 - 0.01;
        camera.rotation.x = Math.max(-lim, Math.min(lim, camera.rotation.x));
      }
    }

    // Place camera at eye height above feet + bob; feetY = centerY - baseOffset
    const t = body.translation();
    camera.position.set(t.x, t.y - baseOffset + eyeHeight + vertical, t.z);
    if (bobEnabled && lateral !== 0) {
      // Add subtle lateral sway along camera's right vector
      camera.position.addScaledVector(right, lateral);
    }

    // Update debug overlay data
    if (debugOn) {
      debugDataRef.current.phase = bobRef.current.phase;
      debugDataRef.current.intensity = bobRef.current.intensity;
      debugDataRef.current.stepHz = stepHz;
      debugDataRef.current.verticalBobAmplitude = verticalBobAmplitude;
      debugDataRef.current.lateralBobAmplitude = lateralBobAmplitude;
    }
  });

  // Ensure initial body position above ground
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const startY = baseOffset + 0.01;
    body.setTranslation({ x: 0, y: startY, z: 5 }, true);
  }, [baseOffset]);

  return (
    <>
      {/* Pointer lock for mouse look (disabled on touch devices)
          Use built-in PointerLockControls events rather than document listeners. */}
      {!isTouch && (
        <PointerLockControls
          selector="#r3f-canvas"
          onLock={() => onLockChange?.(true)}
          onUnlock={() => onLockChange?.(false)}
        />
      )}

      {/* Debug overlay (top-left fixed) */}
      {debugOn &&
        // Lazy import to avoid circular dep in SSR paths; kept simple here
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        (() => {
          const { BobDebugOverlay } = require("./BobDebugOverlay");
          return (
            <BobDebugOverlay
              show={debugOn}
              width={debugBobWidth}
              height={debugBobHeight}
              dataRef={debugDataRef}
            />
          );
        })()}

      {/* Capsule-based player body */}
      <RigidBody
        ref={bodyRef}
        colliders={false}
        canSleep={false}
        linearDamping={4}
        angularDamping={1}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider
          args={[halfHeight, capsuleRadius]}
          position={[0, baseOffset, 0]}
        />
      </RigidBody>
    </>
  );
}
