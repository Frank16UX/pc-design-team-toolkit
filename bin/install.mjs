#!/usr/bin/env node
// pc-design-team-toolkit — standalone skills installer
// Zero dependencies. Copies the bundled skills into the agent skills directory
// of your choice (Claude Code/Desktop, Codex, Cursor, or a custom path).
//
// Usage:
//   npx github:Frank16UX/pc-design-team-toolkit            # install all -> ~/.claude/skills
//   npx github:Frank16UX/pc-design-team-toolkit --codex    # -> ~/.agents/skills
//   npx github:Frank16UX/pc-design-team-toolkit --project  # -> ./.claude/skills
//   npx github:Frank16UX/pc-design-team-toolkit --list
//   npx github:Frank16UX/pc-design-team-toolkit --skill figma-to-react ds-packages
//
// Flags:
//   --list                 List bundled skills and exit
//   --skill <names...>     Install only the named skills (default: all)
//   --project              Install into ./.claude/skills (project scope)
//   --codex                Install into ~/.agents/skills (Codex global)
//   --cursor               Install into ~/.cursor/skills (Cursor global)
//   --claude               Install into ~/.claude/skills (default, Claude Code + Desktop)
//   --all-agents           Install into Claude + Codex + Cursor global dirs
//   --dir <path>           Install into a custom directory
//   --force                Overwrite existing skill folders
//   -h, --help             Show help

import { existsSync, mkdirSync, readdirSync, statSync, rmSync, cpSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = resolve(__dirname, "..", ".claude", "skills");

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", cyan: "\x1b[36m", yellow: "\x1b[33m", red: "\x1b[31m",
};
const log = (...a) => console.log(...a);

function parseArgs(argv) {
  const opts = { targets: [], skills: [], force: false, list: false, help: false, dir: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "-h": case "--help": opts.help = true; break;
      case "--list": opts.list = true; break;
      case "--force": opts.force = true; break;
      case "--project": opts.targets.push("project"); break;
      case "--codex": opts.targets.push("codex"); break;
      case "--cursor": opts.targets.push("cursor"); break;
      case "--claude": opts.targets.push("claude"); break;
      case "--all-agents": opts.targets.push("claude", "codex", "cursor"); break;
      case "--dir": opts.dir = argv[++i]; break;
      case "--skill": case "--skills":
        while (argv[i + 1] && !argv[i + 1].startsWith("-")) opts.skills.push(argv[++i]);
        break;
      default:
        if (a.startsWith("-")) { log(`${C.yellow}Unknown flag: ${a}${C.reset}`); }
        else opts.skills.push(a); // bare arg treated as a skill name
    }
  }
  return opts;
}

function resolveTargets(opts) {
  const map = {
    claude: join(homedir(), ".claude", "skills"),
    codex: join(homedir(), ".agents", "skills"),
    cursor: join(homedir(), ".cursor", "skills"),
    project: join(process.cwd(), ".claude", "skills"),
  };
  const dirs = [];
  if (opts.dir) dirs.push(resolve(opts.dir));
  for (const t of opts.targets) dirs.push(map[t]);
  if (dirs.length === 0) dirs.push(map.claude); // default
  return [...new Set(dirs)];
}

function listSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR)
    .filter((n) => !n.startsWith(".") && statSync(join(SKILLS_DIR, n)).isDirectory())
    .sort();
}

function help() {
  log(`${C.bold}pc-design-team-toolkit${C.reset} — install bundled Agent Skills

${C.bold}Usage${C.reset}
  npx github:Frank16UX/pc-design-team-toolkit [flags]

${C.bold}Targets${C.reset} (default: ~/.claude/skills)
  --claude        ~/.claude/skills   (Claude Code + Claude Desktop)
  --codex         ~/.agents/skills   (Codex)
  --cursor        ~/.cursor/skills   (Cursor)
  --project       ./.claude/skills   (current project)
  --all-agents    Claude + Codex + Cursor
  --dir <path>    custom directory

${C.bold}Selection${C.reset}
  --skill <names...>   install only these skills (default: all)
  --list               list bundled skills and exit
  --force              overwrite skills that already exist
`);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return help();

  const available = listSkills();
  if (available.length === 0) {
    log(`${C.red}No skills found in ${SKILLS_DIR}${C.reset}`);
    process.exit(1);
  }

  if (opts.list) {
    log(`${C.bold}Bundled skills (${available.length}):${C.reset}`);
    for (const s of available) log(`  ${C.cyan}•${C.reset} ${s}`);
    return;
  }

  let chosen = available;
  if (opts.skills.length) {
    const unknown = opts.skills.filter((s) => !available.includes(s));
    if (unknown.length) {
      log(`${C.red}Unknown skill(s): ${unknown.join(", ")}${C.reset}`);
      log(`${C.dim}Available: ${available.join(", ")}${C.reset}`);
      process.exit(1);
    }
    chosen = opts.skills;
  }

  const targets = resolveTargets(opts);

  for (const target of targets) {
    log(`\n${C.bold}→ Installing into${C.reset} ${C.cyan}${target}${C.reset}`);
    mkdirSync(target, { recursive: true });
    for (const skill of chosen) {
      const dest = join(target, skill);
      if (existsSync(dest)) {
        if (!opts.force) {
          log(`  ${C.yellow}skip${C.reset}  ${skill} ${C.dim}(exists — use --force to overwrite)${C.reset}`);
          continue;
        }
        rmSync(dest, { recursive: true, force: true });
      }
      cpSync(join(SKILLS_DIR, skill), dest, { recursive: true });
      log(`  ${C.green}✓${C.reset}     ${skill}`);
    }
  }

  log(`\n${C.green}${C.bold}Done.${C.reset} Restart your agent (or reopen Claude Desktop) to pick up new skills.`);
}

main();
