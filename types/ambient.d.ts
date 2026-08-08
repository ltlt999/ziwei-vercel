// Global ambient declarations for libraries without bundled .d.ts
// This avoids repeating `// @ts-expect-error` in every consumer

declare module 'lunar-javascript' {
  const m: any;
  export default m;
  export const Solar: any;
  export const Lunar: any;
}

declare module 'iztro' {
  const m: any;
  export default m;
  // astro.bySolar() returns a functional astrolabe. Inside `.palaces.map((p) => ...)`
  // callers treat each palace as a plain object with majorStars/minorStars/adjectiveStars.
  // We deliberately use any here so callbacks infer `any` and TypeScript stays quiet
  // without every `.map((p) => ...)` needing an explicit type annotation.
  export const astro: any;
}
