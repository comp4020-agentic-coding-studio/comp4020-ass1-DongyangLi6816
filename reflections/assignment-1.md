# Assignment 1

## The breakthrough

I started this the way I have started everything before it: finish the research,
then build. A fact sheet covering all eighteen stops of the voyage
([`053d47b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/053d47b)),
then the other captains' returns, a sailing-speed baseline, and which episodes
survive in ancient art
([`bf7c6d5`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/bf7c6d5)).
Every number sourced. Six and a half hours between those two commits alone: at
the peak of it the agent had six research agents running at once, each of which
had opened two of its own, eighteen of them searching in parallel for a page
that did not exist yet.

Then a design document — mockups, an illustration plan, a colour treatment.
Around 565,000 tokens spent by then, a day and a half after the repo was set up,
and still nothing anyone could open. I committed those notes late and on
purpose, after the first working page rather than before it
([`1f70cf3`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/1f70cf3)),
so the history would show what they were worth: almost none of it survived
contact with a browser.

What broke the loop was giving up on getting it right first. I sent one link to
a site doing roughly what I wanted and said: core interaction like this is fine,
let's get a first version out. Within the hour there was a map, a timeline, a
day counter and a green `pnpm check`
([`ef959d4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/ef959d4)).
Everything after that went quickly — and it went quickly because there was
finally something to argue with.

The reason is not that the research was wasted. It is that research and design
have no stopping condition and a running page does. "Refine this plan" cannot be
finished, and cannot be wrong in a way anything detects. A page can be opened,
and it is immediately wrong in ways no document predicts: the bug that cost me
most was two rendering engines disagreeing about whether a dash pattern follows
an ancestor's transform
([`a267b93`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/a267b93)).
No amount of planning reaches that.

## What it changed

I wrote it into `CLAUDE.md` in the same minute I fixed it
([`a0e0155`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/a0e0155),
22:29 — the first working build is 22:30). The first deliverable is a running
version, however rough; if a document is genuinely needed first, say so in one
line and wait for me.

The other half is the part I would not have thought to write a day earlier:
bound the research. Every search pass states its stopping condition before it
starts, and "all", "complete", "detailed" and "thorough" mean the first bounded
slice — do the slice, name what was left out. I had already watched a rule that
worked get deleted because I could not afford it
([`f7eb8bb...69cf810`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/compare/f7eb8bb...69cf810)),
so this one fires on words that turn up in my own sloppy prompts instead of
depending on my discipline to hold.

It kept holding. The largest change I made after that — the page's benchmark
torn out and rebuilt as an opening the visitor sets in motion — went out as a
rough running version first and was argued with in a browser afterwards
([`9f682f4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/9f682f4)).
The developer I want to be builds the smallest thing that runs and lets it
contradict me, instead of writing a confident document about something nobody
has seen yet.
