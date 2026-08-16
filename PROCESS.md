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

### The agent's list looked complete, and was not

A voyage table the agent produced covered 7 of the poem's 18 stops --- missing
exactly where the fleet dies (Cyclops, Laestrygonians, Scylla, the Cattle of the
Sun). Re-prompting would have fixed that one table. Instead I had it diagnose
why: it had picked beats for slider-appeal, presented a selection as an
enumeration, and searched only to confirm it. The fix went into `CLAUDE.md`
([`f7eb8bb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/f7eb8bb)):
enumerate before selecting, run a disconfirming search, state coverage or admit
it's a selection, leave gaps unfilled.

Verified by reuse: asking "what do Odyssey summaries omit" caught a gap in my
own "complete" list --- Elpenor's burial, folded into the Circe stop
([source](https://en.wikipedia.org/wiki/Elpenor)).

### The rule worked, and I removed it anyway

Those rules kept earning their place. Enumerating all thirteen returns Homer
narrates caught me about to write that Menelaus drifted seven years --- the
seven belongs to Aegisthus's reign. A disconfirming query overturned a thesis I
had already promoted to a design pillar: I had claimed the ancients painted
monsters and not waiting, and LIMC says the opposite, Circe at 71 catalogue
entries against one for the Laestrygonians. Both would have shipped as fact.

They also tripled the cost: research passes went from roughly 54k tokens to
146-163k. Diagnosing why was the useful part. The rule governs *the list you
hand me*, and I applied it to *the work* --- enumerating fourteen stops is
cheap, investigating all fourteen equally is not.

The honest fix was to bound the rule. The affordable one, on a fixed quota, was
to remove it
([`69cf810`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/69cf810)) ---
an exact revert of the commit that added it, so the pair
([`f7eb8bb...69cf810`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/compare/f7eb8bb...69cf810))
is the whole life of the rule. A decision, not a lapse: it was right and I
could not afford it. What survives goes into tests instead of prose, where it
costs nothing --- the voyage data asserts its own day-total, so a duration
cannot drift without turning a check red.

### Every sentence I wrote was patching a design

Three strings came out of the page in twenty minutes: a note explaining the two
colours in the calendar
([`dad271c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/dad271c)),
a hint telling the visitor to drag the timeline, and the statistic under it
([`2cfbb9c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/2cfbb9c)).
Every one had been added to explain something the design was failing to say.
The colour note's real fix was to stop using two colours
([`f011dfa`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/f011dfa));
the drag hint repeated the control's own label.

It has a name — *distributional convergence* — and Anthropic ship rules for it
in their `frontend-design` skill. I wrote my own rule, found theirs, and
swapped mine out
([`d6ae9a9...fdb474a`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/compare/d6ae9a9...fdb474a)).
Theirs catches more --- "let each element do exactly one job" is what that note
failed, doing three at once --- and is looser about explanatory copy than the
reading that got the strings deleted. I wrote the loosening into the commit
rather than pretend the swap was free.
