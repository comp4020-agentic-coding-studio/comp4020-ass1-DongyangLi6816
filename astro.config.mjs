// @ts-check
import { defineConfig } from "astro/config";

// The deployed site lives under the repo path, not the domain root:
// https://comp4020-agentic-coding-studio.github.io/comp4020-ass1-DongyangLi6816/
//
// Astro always writes root-absolute asset URLs (a relative `base: "./"` is
// normalised to "/./" and breaks), so `base` has to be set explicitly or every
// asset 404s live while looking perfectly fine on localhost. Renaming the repo
// means changing this, BASE in spec/assignment-1.test.ts, and linkinator.config.json.
export default defineConfig({
  site: "https://comp4020-agentic-coding-studio.github.io",
  base: "/comp4020-ass1-DongyangLi6816/",
  build: {
    // Emit dist/about.html rather than dist/about/index.html, so the built
    // tree is the flat set of pages spec/invariants.test.ts reads.
    format: "file",
  },
});
