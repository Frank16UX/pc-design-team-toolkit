# pc-design-team-toolkit

A bundle of custom **Agent Skills** for the design team — portable across
**Claude Code**, **Claude Desktop**, **Codex**, and **Cursor**.

Each skill is a folder with a `SKILL.md` (plus optional `scripts/`, `references/`,
`evals/`). Drop them into your agent's skills directory and they become available
automatically.

---

## What's inside

| Skill | What it does |
|---|---|
| **figma-to-react** | Convert Figma components to production-ready React using design tokens, React Aria, and design-system best practices. |
| **ds-packages** | Publish, version, and consume a React design system as a private npm package on GitHub Packages (build, tokens, `.npmrc` auth, release CI, consumer install). |
| **pc-storybook-qa** | Audit Storybook token implementations against baseline SCSS files; compares screenshots to tokens and generates a discrepancy report. |
| **storybook-css-extractor** | Download the compiled CSS module for a component from a live Storybook page and save it as `.css` (feeds `pc-storybook-qa`). |
| **design-taste-frontend** | Senior UI/UX engineering rules — metric-based layout, strict component architecture, CSS hardware acceleration. |
| **emil-design-eng** | Emil Kowalski's philosophy on UI polish, component design, and animation decisions. |
| **high-end-visual-design** | Design like a high-end agency — fonts, spacing, shadows, card structures, and animations that feel expensive. |
| **granola-meeting-extractor** | Turn a Granola meeting into a tight briefing: TLDR, action items (with owners), your own tasks, and every deadline. |

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
│       ├── design-taste-frontend/
│       ├── emil-design-eng/
│       ├── high-end-visual-design/
│       └── granola-meeting-extractor/
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

## License

MIT
