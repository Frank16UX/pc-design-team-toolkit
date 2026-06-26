# pc-design-team-toolkit

A bundle of custom **Agent Skills** for the design team — portable across
**Claude Code**, **Claude Desktop**, **Codex**, and **Cursor**.

Each skill is a folder with a `SKILL.md` (plus optional `scripts/`, `references/`,
`evals/`). Drop them into your agent's skills directory and they become available
automatically.

---

## What's inside

The bundle mixes **custom skills** built in-house by the design team with a few
**external skills** vendored from the community (full attribution below).

### Custom skills (built by the design team)

| Skill | What it does |
|---|---|
| **figma-to-react** | Convert Figma components to production-ready React using design tokens, React Aria, and design-system best practices. |
| **ds-packages** | Publish, version, and consume a React design system as a private npm package on GitHub Packages (build, tokens, `.npmrc` auth, release CI, consumer install). |
| **pc-storybook-qa** | Audit Storybook token implementations against baseline SCSS files; compares screenshots to tokens and generates a discrepancy report. |
| **storybook-css-extractor** | Download the compiled CSS module for a component from a live Storybook page and save it as `.css` (feeds `pc-storybook-qa`). |
| **granola-meeting-extractor** | Turn a Granola meeting into a tight briefing: TLDR, action items (with owners), your own tasks, and every deadline. |

### External skills (imported — credit to original authors)

| Skill | What it does | Author | Source |
|---|---|---|---|
| **design-taste-frontend** | Senior UI/UX engineering rules — metric-based layout, strict component architecture, CSS hardware acceleration. | [@Leonxlnx](https://github.com/Leonxlnx) | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) |
| **high-end-visual-design** | Design like a high-end agency — fonts, spacing, shadows, card structures, and animations that feel expensive. | [@Leonxlnx](https://github.com/Leonxlnx) | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) ([skills.sh](https://www.skills.sh/leonxlnx/taste-skill/high-end-visual-design)) |
| **emil-design-eng** | Emil Kowalski's philosophy on UI polish, component design, and animation decisions. | [@emilkowalski](https://github.com/emilkowalski) | [emilkowalski/skills](https://github.com/emilkowalski/skills) |
| **frontend-design** | Guidance for distinctive, intentional visual design — typography, aesthetic direction, and avoiding templated defaults. | [@anthropics](https://github.com/anthropics) | [anthropics/skills](https://github.com/anthropics/skills) |

> External skills retain their original authors' licensing and credit. They are
> bundled here for the team's convenience; please refer to each source repo for
> the canonical version and updates.

---

## Quick start

### Option A — `npx skills` (recommended, like skills.sh)

This repo is compatible with the [`vercel-labs/skills`](https://github.com/vercel-labs/skills)
CLI, which discovers every skill under `.claude/skills/`.

```bash
# Install ALL skills globally (~/.claude/skills) and pick agents interactively
npx skills add Frank16UX/pc-design-team-toolkit -g

# Install into the current project instead of globally
npx skills add Frank16UX/pc-design-team-toolkit

# Install just one or two skills
npx skills add Frank16UX/pc-design-team-toolkit -s figma-to-react ds-packages

# Target specific agents (claude, codex, cursor, …)
npx skills add Frank16UX/pc-design-team-toolkit -g -a claude codex
```

### Option B — bundled installer (zero-config, no external CLI)

This repo ships its own installer, so you can run it straight from GitHub:

```bash
# All skills -> ~/.claude/skills  (Claude Code + Claude Desktop)
npx github:Frank16UX/pc-design-team-toolkit

# Codex  -> ~/.agents/skills
npx github:Frank16UX/pc-design-team-toolkit --codex

# Cursor -> ~/.cursor/skills
npx github:Frank16UX/pc-design-team-toolkit --cursor

# Every agent at once
npx github:Frank16UX/pc-design-team-toolkit --all-agents

# Into the current project (./.claude/skills)
npx github:Frank16UX/pc-design-team-toolkit --project

# Pick specific skills / overwrite existing / list what's bundled
npx github:Frank16UX/pc-design-team-toolkit --skill figma-to-react emil-design-eng
npx github:Frank16UX/pc-design-team-toolkit --all-agents --force
npx github:Frank16UX/pc-design-team-toolkit --list
```

Run with `--help` to see all flags.

---

## Manual install (clone the repo)

```bash
git clone https://github.com/Frank16UX/pc-design-team-toolkit.git
cd pc-design-team-toolkit
node bin/install.mjs --all-agents   # or any flags from Option B
```

If you'd rather wire it up by hand, copy (or symlink) skill folders into the
right directory for your tool. Each skill **must** sit one level deep:
`…/skills/<skill-name>/SKILL.md` — never nested deeper.

### Per-tool skill locations

| Tool | Global (all projects) | Project-scoped |
|---|---|---|
| **Claude Code** | `~/.claude/skills/` | `<project>/.claude/skills/` |
| **Claude Desktop** | `~/.claude/skills/` (same as Claude Code) | — |
| **Codex** | `~/.agents/skills/` | `<project>/.agents/skills/` |
| **Cursor** | `~/.cursor/skills/` (also reads `~/.claude/skills/`) | `<project>/.cursor/skills/` |

Example — copy everything globally for Claude:

```bash
cp -R .claude/skills/* ~/.claude/skills/
```

Example — symlink instead (edit once, update everywhere):

```bash
for d in .claude/skills/*/; do
  ln -snf "$(pwd)/$d" ~/.claude/skills/"$(basename "$d")"
done
```

---

## Importing into each app

### Claude Code (CLI)
1. Install via any option above (global `~/.claude/skills/` or per-project `.claude/skills/`).
2. Restart the session (or start a new one). Skills load automatically — confirm with `/skills`.

### Claude Desktop
1. Claude Desktop reads the **same** `~/.claude/skills/` directory as Claude Code, so
   `npx github:Frank16UX/pc-design-team-toolkit` (Option B, default target) is all you need.
2. **Quit and reopen** Claude Desktop so it re-scans the skills folder.
3. Skills appear in the skills/capabilities menu and trigger by description.

> Mac path: `~/.claude/skills/` · Windows: `%USERPROFILE%\.claude\skills\`

### Codex (App / CLI)
1. Codex looks in `~/.agents/skills/` (global) or `.agents/skills/` (project).
2. Install with `npx github:Frank16UX/pc-design-team-toolkit --codex`
   (or `--project` from inside a repo, which also creates `.claude/skills` — Codex
   projects commonly symlink `.agents/skills → .claude/skills`).
3. Restart Codex so it picks up the new skills.

### Cursor
1. `npx github:Frank16UX/pc-design-team-toolkit --cursor` → `~/.cursor/skills/`.
2. Cursor also honors `~/.claude/skills/`, so a Claude install is picked up too.

---

## Updating

> [!IMPORTANT]
> **Updates require `--force`.** The installer *copies* skills, so a plain re-run
> prints `skip (exists)` and changes nothing. Add `--force` to overwrite your
> installed skills with the latest versions.

```bash
# Update -> ~/.claude/skills (Claude Code + Claude Desktop)
npx github:Frank16UX/pc-design-team-toolkit --force

# Update everywhere you installed (match your original targets)
npx github:Frank16UX/pc-design-team-toolkit --all-agents --force
```

`npx github:…` resolves the repo's latest commit on each run, so once a new
version is pushed, the next `--force` run pulls it in. After updating, **restart
your agent** (or quit + reopen Claude Desktop) so it reloads the skills.

**npx cache gotcha:** if a run returns a stale copy, bust the cache with `--yes`:

```bash
npx --yes github:Frank16UX/pc-design-team-toolkit --force
```

**`vercel-labs/skills` equivalent** (if you installed via Option A):

```bash
npx skills update
```

### Auto-updating installs (symlink)

For anyone comfortable with git, clone once and **symlink** the skills — then a
single `git pull` updates every agent at once, no reinstall and no `--force`:

```bash
git clone https://github.com/Frank16UX/pc-design-team-toolkit.git
cd pc-design-team-toolkit
for d in .claude/skills/*/; do
  ln -snf "$(pwd)/$d" ~/.claude/skills/"$(basename "$d")"
done

# later, to update everyone's skills:
git pull
```

---

## Repo structure

```
pc-design-team-toolkit/
├── .claude/
│   └── skills/                 # the actual skills (source of truth)
│       ├── figma-to-react/
│       ├── ds-packages/
│       ├── pc-storybook-qa/
│       ├── storybook-css-extractor/
│       ├── granola-meeting-extractor/
│       ├── design-taste-frontend/      # external — Leonxlnx/taste-skill
│       ├── high-end-visual-design/     # external — Leonxlnx/taste-skill
│       ├── emil-design-eng/            # external — emilkowalski/skills
│       └── frontend-design/            # external — anthropics/skills
├── .agents/
│   └── skills -> ../.claude/skills   # symlink (Codex/agent-agnostic discovery)
├── bin/
│   └── install.mjs             # zero-dependency installer
├── package.json
└── README.md
```

`.agents/skills` is a symlink to `.claude/skills`, so a single set of files is
discoverable by Claude (`.claude/`), Codex/agent-agnostic tooling (`.agents/`),
and the `vercel-labs/skills` CLI alike.

---

## Contributing

We welcome new skills and improvements from the design team. To keep `main`
stable, the branch is **protected** — nobody (not even the owner by default)
pushes straight to it. All changes land through a reviewed pull request.

### Who can do what

| Action | Anyone (public) | Collaborator |
|---|---|---|
| Read / clone the repo | ✅ | ✅ |
| Fork & open a PR | ✅ | ✅ |
| Open issues | ✅ | ✅ |
| Push a branch to this repo | ❌ | ✅ |
| **Merge a PR into `main`** | ❌ | ✅ |

> [!NOTE]
> Being public only grants **read** access. Pushing branches and merging are
> restricted to **collaborators** (added under **Settings → Collaborators**).
> If you need write access, ping Frank to be added.

### Branch protection rules on `main`

- ✅ A pull request is **required** before merging — no direct pushes.
- ✅ At least **1 approving review** is required.
- ✅ Stale approvals are **dismissed** when new commits are pushed.
- ✅ All PR **conversations must be resolved** before merge.
- 🚫 **Force-pushes** and branch **deletion** are blocked.

### Workflow

```bash
# 1. Collaborators: branch off main.  Non-collaborators: fork first, then branch.
git checkout -b add-my-new-skill

# 2. Create or edit a skill ONLY under .claude/skills/ (see "Where skills live").

# 3. Commit and push your branch (never commit to main directly).
git add .claude/skills/my-new-skill
git commit -m "feat: add my-new-skill"
git push -u origin add-my-new-skill

# 4. Open a PR against main and request a review.
gh pr create --base main --fill
```

A collaborator reviews, conversations get resolved, and once it has an approval
they merge it. Then everyone updates with `npx github:Frank16UX/pc-design-team-toolkit --force`
(see [Updating](#updating)).

### Where skills live — edit one folder, both harnesses get it

> [!IMPORTANT]
> The **single source of truth** is `.claude/skills/<skill-name>/`.
> `.agents/skills` is a **symlink** to `.claude/skills` (see [Repo structure](#repo-structure)),
> so any skill you add under `.claude/skills/` is **automatically** discoverable by
> Codex (`.agents/`) and Cursor too. You do **not** maintain two copies.

This matters because some teammates have **Claude Code but not Codex**, and others
have **Codex but not Claude** — yet everyone edits the same files:

- ✅ **Do** create/modify your skill in `.claude/skills/<skill-name>/`.
- 🚫 **Don't** create a real `.agents/skills/<skill-name>/` folder — that would
  break the symlink's single-source-of-truth and give Codex a stale duplicate.
- If you cloned fresh and the symlink is missing, recreate it:
  `ln -snf ../.claude/skills .agents/skills`

Because every skill follows the open **[Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)**
standard (a `SKILL.md` with `name` + `description`, plus optional `scripts/`,
`references/`, `evals/`), a skill authored in either tool runs in both.

### How to author a skill — use each platform's `skill-creator`

Don't hand-write `SKILL.md` from scratch. Each platform ships a dedicated
**skill-creator** that scaffolds the folder, writes the frontmatter, and tunes
the description for reliable triggering. Use whichever you have:

| Platform | How to invoke | Docs |
|---|---|---|
| **Claude Code / Desktop** | Run the `skill-creator` skill (e.g. `/skill-creator`) and describe your skill | <https://claude.com/plugins/skill-creator> |
| **Codex** | Run the built-in skill creator (or `Record & Replay` an existing workflow) | <https://developers.openai.com/codex/skills> |

When the creator finishes, **move/point the generated folder into
`.claude/skills/<skill-name>/`** so it's picked up by the symlink, then open a PR.

### What a good skill contains (applies to both harnesses)

A skill is a *playbook* for the agent, not user-facing docs. Keep it tight:

1. **`SKILL.md` frontmatter** — a `name` (kebab-case) and a **trigger-focused
   `description`**. The description is how the agent decides to load the skill, so
   pack it with the phrases a user would actually say ("extract the css", "audit
   storybook tokens", "convert this Figma component"). This is the single most
   important field.
2. **Concise instructions** — the exact steps/decision rules the agent should
   follow. Write for the agent, not a human reader. Omit setup history, meeting
   notes, and "why we built this" prose — it just adds noise.
3. **Optional bundled resources** — `scripts/` (runnable helpers), `references/`
   (specs/examples the agent reads on demand), `evals/` (test prompts). Reference
   them from `SKILL.md` so they load only when needed.
4. **Keep it focused** — one skill = one job. If it sprawls, split it.

**Prompting the creator** — describe the *outcome* and the *trigger*, e.g.:

> "Create a skill that audits a component's Storybook CSS against our baseline
> SCSS tokens and outputs a discrepancy report. It should trigger when I say
> things like 'QA the button tokens' or 'check storybook against the baseline'.
> Bundle a script that screenshots the story and a reference of our token names."

### Further reading & tutorials

**Official docs**
- [Agent Skills overview (Claude)](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Extend Claude with skills (Claude Code docs)](https://code.claude.com/docs/en/skills)
- [Equipping agents for the real world with Agent Skills (Anthropic eng blog)](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Agent Skills (Codex / OpenAI)](https://developers.openai.com/codex/skills)
- [Save workflows as reusable Codex skills](https://developers.openai.com/codex/use-cases/reusable-codex-skills)
- [`openai/skills` catalog + `skill-creator` source](https://github.com/openai/skills)

**Video walkthroughs** *(community-made; pick the most recent — the platforms move fast)*
- [Complete Claude Code Skills Tutorial — Skills Explained](https://www.youtube.com/watch?v=HZKlk1nUUSY)
- [Claude Code Skills — The Only Tutorial You Need](https://www.youtube.com/watch?v=vIUJ4Hd7be0)
- [Create Claude Skills Better than 99% of Users](https://www.youtube.com/watch?v=-2AI5nt-lzI)
- [Claude Skills Tutorial — Build, Run, and Share](https://www.youtube.com/watch?v=O_z9vDLgvoY)

---

## License

MIT
