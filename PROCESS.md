# Process overview

A reading-guide to how this prototype came together. Follow the citations ---
they point at the commits where each decision landed.

## What I built

<!-- One paragraph: the thing, and the idea behind it. Write this once the
     prototype exists. -->

## The moments that mattered

### The agent's list looked complete, and was not

A voyage table the agent produced covered 7 of the poem's 18 stops --- missing
exactly where the fleet dies (Cyclops, Laestrygonians, Scylla, the Cattle of the
Sun). Re-prompting would have fixed that one table. Instead I had it diagnose
why: it had picked beats for slider-appeal, presented the selection as an
enumeration, and searched only to confirm what it had already chosen. So the
fix went into `CLAUDE.md`
([`f7eb8bb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/f7eb8bb)):
enumerate before selecting, run a disconfirming search, state coverage or admit
it's a selection, leave gaps unfilled.

Verified by reuse: asking "what do Odyssey summaries omit" caught a real gap in
my own "complete" list --- Elpenor's burial, folded into the Circe stop
([source](https://en.wikipedia.org/wiki/Elpenor)). The rule worked first try,
though it also showed "18" wasn't a settled count.

<!-- Moments 2-4 go here. The brief asks for three or four in total, and the
     whole file for 400-600 words. -->
