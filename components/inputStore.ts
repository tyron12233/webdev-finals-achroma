// Simple global input store for cross-tree communication (R3F + DOM)
// No external deps; MobileControls writes here, FPSControls reads here.

export type InputSnapshot = {
  // movement axes: x = strafe (-1 left .. 1 right), y = forward (-1 back .. 1 forward)
  moveX: number;
  moveY: number;
  // look deltas accumulated since last consumption (pixels)
  lookDX: number;
  lookDY: number;
  // whether touch/mobile controls are active
  touchMode: boolean;
};

const state: InputSnapshot = {
  moveX: 0,
  moveY: 0,
  lookDX: 0,
  lookDY: 0,
  touchMode: false,
};

export function setTouchMode(on: boolean) {
  state.touchMode = on;
}

export function setMoveAxes(x: number, y: number) {
  // clamp to [-1, 1]
  state.moveX = Math.max(-1, Math.min(1, x));
  state.moveY = Math.max(-1, Math.min(1, y));
}

export function addLookDelta(dx: number, dy: number) {
  state.lookDX += dx;
  state.lookDY += dy;
}

export function consumeLookDelta() {
  const dx = state.lookDX;
  const dy = state.lookDY;
  state.lookDX = 0;
  state.lookDY = 0;
  return { dx, dy };
}

export function getMoveAxes() {
  return { x: state.moveX, y: state.moveY };
}

export function isTouchMode() {
  return state.touchMode;
}
