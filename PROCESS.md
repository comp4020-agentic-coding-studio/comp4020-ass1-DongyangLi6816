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

### The rule worked, and I removed it anyway

Those rules kept earning their place. Enumerating all thirteen returns Homer
narrates caught me about to write that Menelaus drifted seven years --- the
seven belongs to Aegisthus's reign; Menelaus is "in the eighth year". A
disconfirming query overturned a thesis I had already promoted to a design
pillar: I had claimed the ancients painted monsters and not waiting, and LIMC
says the opposite, Circe at 71 catalogue entries against one for the
Laestrygonians. Both would have shipped as fact on a marked page.

They also tripled the cost. Research passes went from roughly 54k tokens to
146-163k, and one image search fanned out into five agents before I killed it.
Diagnosing why was the useful part: the rule governs *the list you hand me*, and
I had been applying it to *the work* --- enumerating fourteen stops is cheap,
investigating all fourteen to equal depth is not.

The honest fix was to bound the rule. The affordable one, with a fixed token
quota and a deadline, was to remove it
([`69cf810`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/69cf810)) ---
an exact revert of the commit that added it, so the pair
([`f7eb8bb...69cf810`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/compare/f7eb8bb...69cf810))
is the whole life of the rule. I am recording it as a decision, not a lapse:
the rule was right and I could not afford it. What survives goes into tests
instead of prose, where it costs nothing to enforce --- the voyage data asserts
its own day-total, so a duration cannot drift without turning a check red.

<!-- Moments 3-4 go here. The brief asks for three or four in total, and the
     whole file for 400-600 words. -->
