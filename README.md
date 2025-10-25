This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## FPSControls configuration

`components/FPSControls.tsx` exposes a few props to tune the camera head-bob and movement feel:

- `speed` (default 3.2): walking speed in m/s
- `eyeHeight` (default 1.6): camera height from feet in meters
- `capsuleRadius`, `capsuleHeight`: player collider size
- `bobEnabled` (default true): toggle head-bob
- `minStepFrequency`/`maxStepFrequency` (defaults 1.4/2.8 Hz): step cadence range scaled by speed
- `verticalBobAmplitude` (default 0.06 m): vertical bob amount
- `lateralBobAmplitude` (default 0.02 m): lateral sway amount
- `bobSmoothing` (default 8): how quickly bob intensity blends on/off
- `speedAmplitudeInfluence` (default 0.7): how much speed scales bob amplitude (0..1)
- `onFootstep?(foot)`: optional callback fired as the bob passes right/left steps (`"right"` at 0 phase, `"left"` at π)

### Debugging the bob

Enable a small overlay that draws the vertical and lateral bob curves and shows the current phase marker:

- `debugBob` (default false): show overlay
- `debugBobWidth`, `debugBobHeight`: canvas size in pixels

```tsx
<FPSControls debugBob debugBobWidth={280} debugBobHeight={120} />
```

Example:

```tsx
<FPSControls
  speed={3.6}
  bobEnabled
  minStepFrequency={1.6}
  maxStepFrequency={3.0}
  verticalBobAmplitude={0.055}
  lateralBobAmplitude={0.018}
  speedAmplitudeInfluence={0.8}
  onFootstep={(foot) => console.log("step", foot)}
/>
```
