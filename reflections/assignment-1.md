# Assignment 1

## The breakthrough

For most of this build I had nothing that ran. I had a fully enumerated fact
sheet on Odysseus's stops, a second on the other captains' returns, a third on
which episodes survive in ancient art
([`bf7c6d5`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/bf7c6d5)),
and a long design document. Around 565,000 tokens of research. Zero lines of
site code.

Then I sent one link to a site doing roughly what I wanted and said "core
interaction like this is fine, let's get a first version out." Within the hour
there was a working map, a timeline, and a green `pnpm check`
([`ef959d4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/ef959d4)).

The breakthrough was seeing *why*. My earlier prompts asked for "a detailed
design", "refine this plan", "process all the images" — none of which can be
finished, or be wrong in a way anything detects. A design document never fails a
check. And the four bugs that actually mattered — a panel covering Troy, markers
drifting off a letterboxed SVG, the whole map vanishing on phones, my own
overlap test passing while four markers sat stacked in the browser — were
invisible in every document I wrote. They existed only on screen.

I had researched the certain part exhaustively and left the uncertain part in
prose.

## What it changed

I now think the useful question about a rule or a process is not "is it right"
but "what does it cost, and what tells me when to stop". I had already watched
rules that worked get deleted for being unaffordable
([`f7eb8bb...69cf810`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/compare/f7eb8bb...69cf810)),
so I wrote the replacement to fire on signals in my own sloppy prompts rather
than depend on my discipline
([`a0e0155`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-DongyangLi6816/commit/a0e0155)).

The developer I want to be builds the rough running thing first and argues with
it, instead of writing a confident document about something nobody has seen yet.
