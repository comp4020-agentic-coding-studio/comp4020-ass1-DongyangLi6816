/// <reference types="astro/client" />

/**
 * Vite fingerprints an imported asset and hands back its URL, already carrying
 * the deploy base. That is why the audio is imported rather than dropped in
 * `public/` and referenced by a hard-coded path --- the same reason the fonts
 * live in `src/`. Astro ships declarations for the file types it knows about;
 * audio is not one of them.
 */
declare module "*.m4a" {
  const src: string;
  export default src;
}
