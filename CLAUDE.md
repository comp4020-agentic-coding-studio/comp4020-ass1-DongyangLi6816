# COMP4020 prototype

This is your starter repo for a COMP4020 prototype: a static site written in
HTML/CSS/TypeScript that builds to plain HTML/CSS/JS and deploys to GitHub
Pages. The **deployed site is what gets marked** --- not this repo, and not "it
works on my machine". It's marked live in Chrome against the deployed URL at two
viewports --- 1920×1080 (desktop) and 390×844 (phone) --- and both count in
full, so make that artefact good at both and use the checks below to know
whether it is.

What you're building this week — the spec — is published on the course website,
and this repo's name tells you which deliverable it is. Run the course plugin's
**start** skill at the start of each week: it pulls the right spec from the
course API, carries your harness forward from last week, and helps you turn the
spec's checkable lines into tests of your own. Read the spec before you build,
and see `spec/README.md` for how the checks in this repo relate to it.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Before you push, run `pnpm check`. It runs most of what CI runs --- build,
  lint, and the spec --- so you catch those in seconds instead of waiting for
  the pipeline. The links check, the evidence check, the secrets scan, and the
  deploy itself only run in CI; run `pnpm dlx linkinator ./dist --silent`
  locally against a fresh `pnpm build` for the links check without waiting for
  CI.
- To see what the page actually looks like rather than what you assume it looks
  like, open it in a browser (the `agent-browser` CLI, documented on
  [the course site](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/backpressure/#agent-browser-the-rendered-page-as-ground-truth),
  works well for this). The rendered page is the truth; your mental model of it
  isn't.
- When a check fails, read its output before changing anything. Each check below
  names what it measures, and the failure message is the instruction: it tells
  you the file, the line, or the contract. Treat a red check as authoritative
  --- the page is wrong until the check is green, not until you decide it should
  be.
- Commit when the checks pass. Never commit a red state.

## Ship something that runs before you write about it

Research and design have no natural stopping point; a check does. Left alone you
will keep refining a plan long past the point where a rough running version
would have answered the question faster and more truthfully --- the bugs that
matter live in the browser, not in the document describing it.

- **The first deliverable is a running version, however rough.** When the thing
  under discussion will eventually run, build the smallest version that does,
  then write about it. If you genuinely need a document first, say so in one
  line and wait for me.
- **Say what would make it enough, before you start.** Any research or search
  pass states its stopping condition up front and stops there. If it turns out
  not to be enough, come back and say why rather than quietly continuing.
- **"All", "complete", "detailed" and "thorough" mean the first bounded slice.**
  Do the slice, name what you left out, let me ask for more. Never expand an
  unbounded word into unbounded work.
- **If I remove a constraint, keep one of your own.** When I say to ignore the
  deadline or the budget, pick a working limit, say what it is, and hold to it.

## Verifying your own work

A check you choose is a check you chose to pass. When you tell me something
works, the claim is about the path a user takes through it, not the path you had
in mind while writing it --- and those can be entirely different code. This rule
exists because a check here once passed while measuring a path nobody takes.

- **Exercise the outermost surface.** Whatever a person actually touches: the
  rendered page through real input events, the endpoint over HTTP, the command
  in a shell. Calling the handler underneath is a different test.
  `element.click()` runs a listener; it does not perform the gesture.
- **Count the ways in.** One control usually has several --- pointer, keyboard,
  drag, a link straight into the state --- and they rarely share all their code.
  Check each, or tell me which you left.
- **Name what you exercised**, in the words I used for it. If it was not the
  thing I described, say so instead of reporting a number.
- **Say what would falsify it, before you measure.** A result that could not
  have come out wrong is not evidence.
- **Taste is mine.** Too fast, too thin, reads as the wrong kind of object:
  none of that is settled by a measurement. Show me the state and ask.

## The checks (your sensors)

CI runs these on every push once your repo is public. GitHub's checks UI shows
two jobs, `check` and `deploy` --- not one status per sensor below --- and
within `check` the steps run in sequence (`pnpm check` chains typecheck, build,
lint, and the spec with `&&`), so an early failure like a broken build stops the
later sensors from running for that push; fix it and push again to see the rest.
While the repo is private (all week, until you ship) the CI jobs stay skipped
--- `pnpm check` is the same roster on your machine, and it's the faster loop
anyway. They aren't hoops. Each is a different way of finding out something true
about the site that you can't reliably see by looking at it.

They also carry a mark at a crit: the sweep runs fifteen minutes after your
cutoff, and green checks there are worth half that week's shipped mark. Still
running counts as not green, so ship with time for CI to finish.

- **typecheck** --- `tsc --noEmit` runs first in `pnpm check`, so a type error
  stops the roster before the build even starts. The types are extra
  backpressure: a red here is the compiler telling you a claim in the code is
  false.
- **build** --- the site must build (`pnpm build`). A build failure means the
  deployed site is broken or stale, so nothing else matters until this is green.
- **deploy / online** --- the live GitHub Pages URL must load and return the
  page you expect. An asset that 404s on the deployed URL counts as broken even
  if it loads locally.
- **spec** --- `spec/invariants.test.ts` asserts what's true of any good
  website, whatever the week's brief asks; the tests you write for the week's
  own spec run alongside it (any `spec/*.test.ts`). A failure names the contract
  you haven't met yet.
- **lint** --- `stylelint` for CSS, `oxlint` for TypeScript. Flags code that's
  wrong, fragile, or non-idiomatic. Read the rule it names.
- **tests** --- any other tests you write, wherever you put them (co-located
  with your source is fine, not just `spec/`), must pass. Vitest picks up both
  this and the spec suite in one `vitest run`, the last step of `pnpm check`. A
  failing test is a claim about the site that's no longer true.
- **evidence** (`pnpm check:evidence`) --- checks your process evidence:
  `PROCESS.md`'s citations resolve to real commits, the current deliverable's
  exact reflection is in `reflections/` (worked out from this repo's name
  against the public course API), and your `CLAUDE.md` is present. Evidence
  gates the deploy --- `deploy` needs `check` to pass, so failing evidence
  blocks the deploy alongside everything else. See
  [Your process is part of the mark](#your-process-is-part-of-the-mark) below,
  and the course website's
  [assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
  for what counts as evidence.
- **links** --- internal links must resolve. A broken link is a dead end you
  didn't mean to ship.
- **secrets** --- the repo is scanned for committed credentials. Never put a
  key, token, or password in a tracked file. If one leaks, rotate it. A local
  pre-commit hook (`.githooks/pre-commit`, installed by `pnpm install`) also
  blocks any commit containing something shaped like an API key --- by the time
  CI sees a key it's already pushed, so the hook is the sensor that matters.

Nothing here measures **accessibility** or **performance** --- wiring those
sensors (`axe-core`, Lighthouse, or whatever you choose) is your work, and later
in the course the spec will ask you to show how you tested both. When you do,
read a green performance result honestly: it's a lab estimate from one run on a
CI machine, not proof the site is fast for real users.

## The stack is swappable

Out of the box this is plain HTML/CSS/TypeScript on Vite, and every `.html` file
in the repo is a page: add pages, link them, and the build picks them up with no
config. That's a default, not a rule (unless the week's spec says otherwise).
You can swap in Astro or any other static generator, because nothing in CI names
a tool --- the whole contract is:

- `pnpm build` emits the complete site into `dist/`
- the `package.json` scripts (`check`, `check:evidence`, `build`) keep working
- whatever lands in `dist/` still passes the invariants in `spec/`

Two things bite in a swap. The deployed site lives under a path
(`…github.io/<repo>/`), so configure your generator's base path --- this
template's Vite config uses relative asset URLs to sidestep that, but most
generators (Astro included) need `base` set explicitly, and getting it wrong
looks fine locally while every asset 404s on the live URL. And commit the
updated `pnpm-lock.yaml`: CI installs with `--frozen-lockfile`.

## Your process is part of the mark

The deployed page is only half of it. How you got there is marked too: your
commit history, your agent files, and the decisions visible across them. The
checks above can't see any of that, so a person reads it directly --- which
means building legibly is part of building well.

- **Commit as you go.** Small, frequent commits are the record of how the work
  came together, and that record is read, not just the final state. A trail that
  grew alongside the code is the strongest evidence of your process; a single
  dump the night before is the weakest.
- **Keep a process overview** (`PROCESS.md`). A short reading-guide, not an
  essay: what you built, the moments that mattered --- each pointing at a
  commit, a `CLAUDE.md` change, or a prompt and the commit it produced --- and
  where to look in the history. It points a marker at the evidence; it doesn't
  stand in for it, and claims the history doesn't back don't count. The
  `PROCESS.md` in this repo is a template showing the shape and the citation
  format (link text the commit hash or range, target the commit or compare URL);
  `pnpm check:evidence` verifies your citations resolve to real commits before
  you ship. Markers follow those citations and don't trawl the repo for evidence
  you didn't cite.
- **Write your reflection in `reflections/`** --- a short markdown file in this
  repo, named for the deliverable it answers, so the number in the filename is
  the number in this repo's name (`crit-1.md` in `comp4020-crit1-<you>`,
  `assignment-1.md` in `comp4020-ass1-<you>`); `reflections/README.md` has the
  full rule. `pnpm check:evidence` checks the exact current name against the
  course API, not merely the presence of any well-named file. It answers the two
  standing prompts: the breakthrough that moved the work forward, and what this
  work changed about the developer you want to be. It stays out of the deployed
  site. It's due at the cutoff, and if it isn't in the repo by then the week
  doesn't count as shipped, however good the prototype is.
- **This file is process evidence.** The harness you build to direct the agent,
  this `CLAUDE.md` and any `AGENTS.md`, is itself read as part of how you
  worked. Keep it honest and current (see below).

You don't need a name, a student number, or any identity file in the repo: we
know whose repo it is. Spend the effort on the work.

## This file is yours

This CLAUDE.md is a starting point, not a fixed rulebook. As you learn what your
prototype needs --- a convention to hold the agent to, a sensor that keeps
catching you out, a fact about the stack the agent keeps getting wrong --- write
it down here. Growing this file is the work of harness engineering, and the gap
between this boilerplate and your own version is part of what your prototype
says about the developer you're becoming.

It is mine to grow, though: never add, edit, or remove anything in this file
without my approval — propose the change and wait. Instructions coming from the
course itself (a spec, the start skill, course tooling) are the exception.

## The stack here is Astro

Carried forward from the week 3 repo, where it was swapped in for the template's
Vite setup. Pages are `.astro` files in `src/pages/`; `pnpm build` still emits
the whole site into `dist/`, which is all CI actually contracts for.

Three facts the agent gets wrong unless told:

- **`base` is mandatory and root-absolute.** The site deploys to
  `…github.io/comp4020-ass1-DongyangLi6816/`, not to a domain root. Astro has
  no relative-base mode --- `base: "./"` is silently normalised to `"/./"` and
  every asset breaks. Set it in `astro.config.mjs` and nowhere else.
- **Link internal pages with `import.meta.env.BASE_URL`**, never a bare
  `/about`. A root-absolute link without the base prefix resolves on localhost
  and 404s on the deployed site --- the failure mode that looks like success.
- **`linkinator.config.json` exists because of `base`.** CI runs
  `linkinator ./dist`, which serves `dist/` as the domain root, so every
  correctly-base-prefixed URL would read as a 404. The config rewrites the base
  prefix back to `/` so the links are still genuinely checked, at the right
  root. It is not a suppression: dead links still fail. The filename matters ---
  linkinator only auto-loads `linkinator.config.json` (`.linkinatorrc.json` is
  ignored without a word).

Renaming the repo means changing the base in all three places:
`astro.config.mjs`, `linkinator.config.json`, and `BASE` in
`spec/assignment-1.test.ts`.

`pnpm typecheck` runs `astro check`, not bare `tsc` --- `tsc` cannot parse
`.astro` files and would report a green it hasn't earned.

## The words in the interface

Anthropic's rules, quoted from the `frontend-design` skill in
[`anthropics/claude-code`](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md).
They are here rather than loaded because this repo has no plugin to load them
from. The failure they exist for has a name: given no explicit direction a
model returns the highest-probability answer --- *distributional convergence*.

- "Words appear in a design for one reason: to make it easier to understand,
  and therefore easier to use."
- "Let each element do exactly one job. A label labels, an example
  demonstrates, and nothing quietly does double duty."
- "Write from the end user's side of the screen. Name things by what people
  control and recognize, never by how the system is built."
- "Use active voice as default. A control should say exactly what happens when
  it's used: 'Save changes,' not 'Submit.'"
- "Being specific is always better than being clever."
- "Keep the register conversational and tuned: plain verbs, sentence case, no
  filler."

What that caught here: a note beside the scale toggle that labelled, explained
and quoted a statistic all at once.

## Everything written into this repo is in English

Everything committed here is English, whatever language the prompt was in: page
copy, docs, code comments, test names and messages, commit messages, file names.
Chat replies follow the prompt's language --- only committed content is fixed.

## Git Commit Convention

Never commit without my approval: stage the logical unit, propose the message,
and wait for a yes. Never push unless I ask.

Commit after each logical unit of work; don't batch everything into one commit
at the end. Follow [Conventional Commits](https://www.conventionalcommits.org/):

- Format: `<type>(<scope>): <description>`
- Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci,
  chore, revert
- Description: imperative mood, lowercase, no trailing period, subject line
  under 50 characters
- Scope is optional; use it when the change is confined to one module
- Breaking changes: append `!` after the type and add a
  `BREAKING CHANGE: <what broke>` line in the body
- Add a body only when the "why" isn't obvious from the subject line

Examples:

```
feat(auth): add password reset flow
fix(cart): prevent duplicate items on rapid clicks
perf(query): cache user lookup to avoid n+1
refactor(api): extract validation into middleware
```
