# Process overview

A reading-guide. Follow the citations --- they point at the commits where each
decision landed.

## What I built

*Ten Years Late* is a map of the Odyssey drawn to the poem's own arithmetic.
It opens with two dots and one control: send a ship from Troy and it moors at
Ithaca on day seven. Only then does the real voyage draw itself across the
Mediterranean underneath it. Of the 3,034 days the poem counts, 2,576 are
Calypso's island — the part nobody retells — and eight stops carry none. The
rail draws it twice, as told and as counted, so the two come apart.

## The moments that mattered

### A rule I added, proved, and could not afford

A voyage table the agent produced covered 7 of the poem's 18 stops --- missing
exactly where the fleet dies. Re-prompting would have fixed that one table.
Instead I had it diagnose why: it had picked beats for slider-appeal, presented
a selection as an enumeration, and searched only to confirm it. The fix went
into `CLAUDE.md`
([`f7eb8bb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/f7eb8bb)):
enumerate before selecting, run a disconfirming search, state coverage or admit
it is a selection.

It kept earning its place. Enumerating the thirteen returns Homer narrates
caught me about to write that Menelaus drifted seven years --- the seven
belongs to Aegisthus's reign. A disconfirming query overturned a thesis I had
promoted to a design pillar. Both would have shipped as fact.

It also tripled the cost: research went from roughly 54k tokens a pass to
146-163k. The rule governs *the list you hand me*, and I had applied it to *the
work*. The honest fix was to bound it; the affordable one was to remove it
([`69cf810`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/69cf810))
--- an exact revert, so the pair
([`f7eb8bb...69cf810`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/compare/f7eb8bb...69cf810))
is the whole life of the rule. A decision, not a lapse.

### The check was green and it was about nothing

Eighty-one tests, and none of them can tell that a page feels wrong. Every
fault of that kind --- the pacing, the teleport, a frame of reversed motion ---
I found by using it. The worst came *after* the agent measured it: clicking the
rail teleported the ship, it timed the fix at 988ms and called it done. `element.click()` on the label column runs the animation;
a press on the rail itself ran `scrubTo` and set the position outright, so the
pacing function was never called for that gesture at all
([`de743a8`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/de743a8)).
The verification existed, was green, and was about a code path nobody uses.

An agent that picks its own test picks one that passes: the knowledge without
the independence. So the rule is about the gesture, not the handler, and it
hands taste back to me rather than letting a measurement settle it
([`abedd71`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/abedd71)).
It paid at once: the next fault was traced frame by frame to a
`requestAnimationFrame` timestamp preceding its own start, and fixed across all
five clocks rather than the one that showed
([`bd760e5`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/bd760e5)).

### Every sentence I wrote was patching a design

Three strings came out of the page in twenty minutes
([`2cfbb9c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/2cfbb9c)).
Each had been added to explain something the design was failing to say; the
colour note's real fix was to stop using two colours
([`f011dfa`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/f011dfa)).
It has a name --- *distributional convergence* --- and Anthropic ship rules for
it. I wrote my own, found theirs, and swapped mine out
([`d6ae9a9...fdb474a`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/compare/d6ae9a9...fdb474a)).
Theirs catches more, and is looser about explanatory copy than the reading that
deleted the strings. I wrote the loosening into the commit rather than pretend
the swap was free.
