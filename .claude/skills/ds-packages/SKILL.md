---
name: ds-packages
description: Publish, version, and consume a React design system as a private npm package on GitHub Packages. Covers the end-to-end setup (barrel export, Vite library build, TypeScript declarations, package.json exports/peerDeps, .npmrc auth, GitHub Actions release workflow), the SCSS/CSS token pipeline, asset distribution, and the consumer install flow. Use this skill whenever the user is setting up a design system as an installable npm package, debugging "package consumption errors" (missing CSS, 404s on icons/fonts, SCSS @import not found, duplicate React, peer dependency warnings), preparing a release, wiring up `publishConfig` for GitHub Packages, or troubleshooting why components work in Storybook but break in a consumer app — even if the user doesn't say "design system" or "GitHub Packages" explicitly.
---

# Design System Packaging

This skill packages a React + SCSS design system as a private npm package on GitHub Packages and ships it without the asset-distribution and SCSS-import bugs that bite almost every first-time attempt.

Read the "Pitfalls" section first. Most failures here are not novel — they're the same handful of mistakes repeating. Front-loading the gotchas saves an entire release cycle.

Throughout this skill, use these placeholders. Replace each with the value that fits the design system you're packaging — file and folder names are intentionally not prescribed here because they vary across projects.

- `@your-scope/your-design-system` — the package name (scoped to a GitHub user or org)
- `your-org/your-repo` — the GitHub repository hosting the package
- `<your-assets-source-dir>` — the folder in your repo that holds raw assets (icons, images, fonts, etc.) before bundling. Whatever you currently `staticDirs` in Storybook is usually the right value.
- `<your-token-output-dir>` — the folder your token build script emits SCSS and CSS into. Could be `build/`, `dist/tokens/`, `tokens/`, or anything else — pick one and use it consistently in your build script, `package.json` `exports`, and `files`.
- `<folder-1>`, `<folder-2>`, etc. — the top-level subfolders inside your assets dir that get referenced by absolute `url(/...)` paths in source CSS. List the ones your design system actually uses.

Apply the same replacement consistently across `package.json`, `.npmrc`, `vite.config.lib.ts`, your token build script, and the GitHub Actions workflow — a typo in any one of them is one of the most common publish failures.

---

## Pitfalls and Lessons Learned (read first)

These are the failure modes that have shipped to production and broken downstream apps. Most of them are invisible in the dev server and only surface when a teammate installs the published tarball.

### 1. Never put absolute asset paths in source

Both of these forms are traps:

```tsx
<img src="/icons/base/check.svg" />
```

```scss
.chip { mask: url('/icons/base/shopping-bag.svg'); }
```

They resolve at the dev server's origin and look fine locally. In a consumer app, the browser resolves them against the consumer's origin (`https://consumer-app.com/icons/...`) and 404s. The fix differs by surface:

- **JSX `<img src="/...">`**: replace with an inline SVG React component, or import the file via Vite's `?url` suffix so the bundler emits a fingerprinted path:
  ```ts
  import iconUrl from '../../assets/icons/check.svg?url';
  ```
- **SCSS `url('/...')`**: do not edit source modules; instead run `postcss-url` in the library build to rewrite absolute URLs to relative ones and copy the files into `dist/assets/`. See the Vite config below.

If you fix only the JSX paths, the SCSS `url()` paths still ship broken. Both must be addressed.

### 2. Storybook's `staticDirs` is a footgun

Storybook serves `assets/` as a static directory in dev. That means a component referencing `/icons/base/check.svg` renders perfectly in Storybook — and breaks the moment it's installed elsewhere. Storybook validates that the components look right, not that the package ships right.

**Always validate distribution by installing the tarball into a fresh project:**

```bash
pnpm pack                     # creates your-design-system-X.Y.Z.tgz
# in a scratch consumer project:
pnpm add /absolute/path/to/your-design-system-X.Y.Z.tgz
```

Render one component that uses an icon, one that uses a mask, one that uses a placeholder image, one that uses the loading state, and one that uses fonts. If any 404s in the browser network tab, the package is not ready to publish.

### 3. Pick one SCSS module system and stay there

Generators that emit some partials with `@use '<partial>' as *;` and others with `@import '<partial>';` will produce duplicate-variable errors in consumer projects when both forms touch the same variables. Choose `@import` *or* `@use`/`@forward` for all generated partials and verify the barrel/index file matches.

Modern Sass prefers `@use`/`@forward`, but `@import` remains compatible. Whatever you pick, apply it consistently across every generated SCSS file and the barrel that re-exports them.

### 4. Generated barrel files must match files on disk

If you generate an SCSS barrel that `@import`s every token group, but your token generator skips empty groups (Style Dictionary does this), the barrel will reference partials that don't exist. The first dangling `@import` aborts the whole import chain in the consumer.

After generation, filter the file list to only what actually exists before writing the barrel:

```js
const existing = candidateScssFiles.filter(f =>
  fs.existsSync(path.join(scssOutputDir, f))
);
writeIndex(existing);
```

`scssOutputDir` is wherever your token build emits SCSS partials — choose it once in the build script and reference it everywhere.

### 5. Externalize peer dependencies

React, react-dom, react/jsx-runtime, and any React UI primitive library (react-aria-components, react-stately, etc.) must be listed in `external` in the Vite config *and* in `peerDependencies` in `package.json`. Bundling them in causes:

- Duplicate React instances → "Invalid hook call" errors
- Larger bundle than the consumer wants
- Version mismatches between the design system's bundled React and the consumer's React

### 6. Don't ship URL-loaded animations or external-asset loaders

If a component uses `@lottiefiles/dotlottie-react` to fetch `/icons/animated-icons/loader.lottie` by URL, fixing icon paths won't help the loader. Replace external-asset loaders with inline SVG + CSS keyframe animations themed via `currentColor`. This eliminates an entire class of asset-path bugs and typically drops hundreds of KB of dependencies.

### 7. Fonts need real `@font-face` rules, not path strings

SCSS variables that just hold a font path string (e.g. `$font-foo: '~your-alias/path/to/Font.otf'`) do nothing on their own — they're inert until a `@font-face` rule references them, and consumer bundlers won't resolve a `~`-prefixed Webpack alias they don't know about. The package must either:

- Ship a separate opt-in fonts CSS entry point (e.g. `dist/fonts.css`) with real `@font-face` rules using *relative* `url('./fonts/<your-font>.ext')` paths, plus the font files copied into a sibling folder (e.g. `dist/fonts/`), **or**
- Not ship fonts at all and document that consumers must self-host them.

The exact folder and file names are up to you — what matters is that the URLs in the published CSS are relative and point to files that actually exist in the tarball. Any bundler-specific alias (`~`, `@/`, etc.) that escapes into published CSS will fail in consumer setups that don't share that alias.

### 8. Add a regression guard for whatever class of bug just bit you

After fixing absolute-URL leaks, add `scripts/assert-no-absolute-urls.js`:

```js
import fs from 'node:fs';
const css = fs.readFileSync('dist/index.css', 'utf8');
const bad = css.match(/url\(\s*['"]?\/[^)'"]+/g);
if (bad) {
  console.error('Absolute URL(s) leaked into dist/index.css:\n' + bad.join('\n'));
  process.exit(1);
}
console.log('No absolute URLs in dist/index.css');
```

Wire it into `build:lib` so the build fails the next time someone reintroduces the bug. The same pattern applies to other regression-prone bugs: detect them in the build, fail loudly, name the offender.

### 9. Test what ships, not what builds

`pnpm pack --dry-run` lists what will be in the published tarball. Read that list. If you see your `.stories.tsx` files, your test fixtures, or your `node_modules/` (it happens), tighten the `files` array in `package.json`. If you don't see your `dist/` outputs, your build didn't run.

---

## Setup Recipe

These are the files that make a publishable package. If you're starting from scratch, create them in this order.

### 1. Barrel export — `src/index.ts`

A single entry point that re-exports every public component plus its props type. Consumers get one import path:

```typescript
export { Button } from './components/actions/Button';
export type { ButtonProps } from './components/actions/Button';
export { IconButton } from './components/actions/IconButton';
export type { IconButtonProps } from './components/actions/IconButton';
// ...one pair per component
```

This lets consumers write `import { Button } from '@your-scope/your-design-system'` instead of digging into internal paths. It also gives you a chokepoint to control the public API surface — anything not re-exported here is private.

### 2. TypeScript build config — `tsconfig.build.json`

Vite handles JS bundling; TypeScript only emits `.d.ts` declarations:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist"
  },
  "include": ["src"],
  "exclude": ["src/**/*.stories.*", "src/**/*.test.*"]
}
```

`declarationMap: true` lets editors jump from a consumer's `import { Button }` to your actual source — worth it for DX.

### 3. Vite library build — `vite.config.lib.ts`

This is where most of the asset-distribution bugs are prevented or introduced. The version below includes `postcss-url` to rewrite absolute SCSS `url()` references — this is the fix for Pitfall #1.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import postcssUrl from 'postcss-url';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        postcssUrl({
          url: 'copy',
          // basePath: where absolute /... URLs in your source CSS should resolve from.
          // Point this at whichever folder holds the raw assets in your repo.
          basePath: resolve(__dirname, '<your-assets-source-dir>'),
          // assetsPath: subfolder of `dist/` to emit the copied files into.
          assetsPath: 'assets',
          useHash: true,
          // filter: which absolute URLs to rewrite. List the top-level folders
          // your design system actually uses (icons, images, illustrations, etc.).
          filter: (asset) => /^\/(<folder-1>|<folder-2>|<folder-3>)\//.test(asset.url),
        }),
      ],
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-aria-components',
        'react-stately',
      ],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
        assetFileNames: (info) =>
          info.name?.endsWith('.css')
            ? 'index.css'
            : 'assets/[name]-[hash][extname]',
      },
    },
    sourcemap: true,
    cssCodeSplit: false,
  },
});
```

Key points:
- `external` keeps React and friends out of the bundle (Pitfall #5).
- `postcss-url` rewrites `/icons/foo.svg` → `./assets/foo-<hash>.svg` and emits the file (Pitfalls #1 and #2).
- `cssCodeSplit: false` produces a single `dist/index.css` consumers can import in one line.

### 4. `package.json`

```json
{
  "name": "@your-scope/your-design-system",
  "version": "1.0.0",
  "description": "Your design system — React components and design tokens",
  "license": "UNLICENSED",

  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",

  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.ts", "default": "./dist/index.cjs" }
    },
    "./dist/index.css": "./dist/index.css",
    "./fonts.css": "./dist/fonts.css",

    "// Optional token sub-paths — point each one at wherever your token build emits files.": "",
    "./tokens": "./<your-token-output-dir>/scss/index.scss",
    "./tokens/css": "./<your-token-output-dir>/css/tokens.css",
    "./tokens/scss/*": "./<your-token-output-dir>/scss/*",
    "./tokens/css/*": "./<your-token-output-dir>/css/*"
  },

  "files": [
    "dist",
    "<your-token-output-dir>",
    "<your-assets-source-dir>"
  ],

  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "restricted"
  },

  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "react-aria-components": "^1.0.0",
    "react-stately": "^3.0.0"
  },

  "scripts": {
    "build:tokens": "node build-tokens.js",
    "build:lib": "vite build --config vite.config.lib.ts && tsc --project tsconfig.build.json && node scripts/assert-no-absolute-urls.js",
    "build": "pnpm build:tokens && pnpm build:lib",
    "prepublishOnly": "pnpm build"
  }
}
```

Why each piece matters:
- `files` controls what's in the tarball. Without it, npm publishes nearly everything; with it, the package stays small and predictable. Run `pnpm pack --dry-run` to verify.
- `exports` is the modern way to declare entry points. Sub-paths like `./tokens` let consumers import SCSS partials directly without `node_modules/...` paths.
- `publishConfig.registry` routes the publish to GitHub Packages without a global config change.
- `peerDependencies` documents what the consumer must provide (Pitfall #5).
- `prepublishOnly` rebuilds before every publish, so a stale `dist/` can never ship.

If the repo enforces a specific package manager, also add `"packageManager": "pnpm@X.Y.Z"` and a `"preinstall": "npx only-allow pnpm"` script.

### 5. `.npmrc`

```
@your-scope:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

The first line routes the scope to GitHub Packages; the second authenticates via an env var. In CI, `NODE_AUTH_TOKEN` comes from `secrets.GITHUB_TOKEN`. Locally and for consumers, it's a Personal Access Token with `read:packages` (consumer) or `write:packages` (maintainer publishing manually).

Do not commit a real token. Either rely on `${NODE_AUTH_TOKEN}` substitution or document that developers paste their PAT into a gitignored `.npmrc`.

### 6. GitHub Actions publish workflow — `.github/workflows/publish.yml`

```yaml
name: Publish to GitHub Packages

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://npm.pkg.github.com
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The workflow triggers on `vX.Y.Z` tags. `GITHUB_TOKEN` is auto-injected and has `packages: write` because we requested it in `permissions`. Consider adding a guard step that fails the build if the tag does not match `package.json`'s version, and a CHANGELOG presence check before `pnpm publish`.

### 7. Regression guard — `scripts/assert-no-absolute-urls.js`

The script from Pitfall #8. Wire it into `build:lib`. Add similar guards as you encounter new failure modes — a small script that fails loudly is worth more than a doc comment that says "remember to check this."

---

## Versioning and Publishing

Use semver:
- **PATCH** (1.0.0 → 1.0.1) — bug fixes only, no API change
- **MINOR** (1.0.0 → 1.1.0) — additive (new component, new prop)
- **MAJOR** (1.0.0 → 2.0.0) — breaking change (removed prop, renamed component, changed default behavior, asset distribution overhaul)

Release flow:

```bash
# on main, after PR merged
pnpm version patch        # bumps package.json, commits, tags vX.Y.Z
git push origin main --follow-tags
```

The tag push triggers the workflow. Within a minute or two, the new version is on GitHub Packages.

Before the very first publish to a new scope, the GitHub user/org may need to grant the repository write access to the package — check `Settings → Packages` after the first failed publish if you see a 403.

---

## Consuming the Package

### Authenticate

Consumer creates a Personal Access Token with `read:packages` scope. Then in their project root, a `.npmrc`:

```
@your-scope:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=THE_PAT_VALUE
```

Or paste the token into the user-level `~/.npmrc` to avoid putting it in any project file. CI environments typically expose a token via environment variable; reference it with `${VAR_NAME}` instead of a literal value.

### Install

```bash
pnpm add @your-scope/your-design-system
# or npm install / yarn add — pnpm enforcement only applies inside the publishing repo
```

### Import

```tsx
import { Button } from '@your-scope/your-design-system';
import '@your-scope/your-design-system/dist/index.css';
// optional:
import '@your-scope/your-design-system/fonts.css';
```

The CSS import is not optional for styling — without it, components render unstyled. If the package ships a separate `fonts.css`, that one is optional and only needed when the consumer wants the bundled fonts.

### Update

```bash
pnpm update @your-scope/your-design-system   # latest within semver range
pnpm add @your-scope/your-design-system@1.2.3   # pin to a specific version
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `404 Not Found` on install | Bad `.npmrc` registry mapping or expired PAT | Verify the scope line and that the PAT has `read:packages` |
| `401 Unauthorized` on install | PAT missing or wrong scope | Regenerate PAT with `read:packages`; update `.npmrc` |
| `404` on `/icons/foo.svg` in consumer | Absolute asset path in source (Pitfall #1) | Inline SVGs, use `?url` imports, or add `postcss-url` |
| Component works in Storybook, fails in consumer | `staticDirs` is masking absolute paths (Pitfall #2) | Test with `pnpm pack` + install into scratch project |
| "Invalid hook call" / two Reacts | React not externalized (Pitfall #5) | Add `external: ['react', ...]` to Vite + `peerDependencies` |
| `Module not found: ~design-system/...` | Webpack-style alias leaked into published CSS | Remove the alias; ship real `@font-face` with relative URLs |
| SCSS duplicate variable error | Mixed `@use` and `@import` (Pitfall #3) | Pick one across all partials |
| SCSS `Can't find stylesheet to import` | Barrel references missing partial (Pitfall #4) | Filter file list against disk before writing index |
| Loader/animation broken in consumer only | External-asset loader fetching by URL (Pitfall #6) | Replace with inline SVG + CSS keyframes |
| Fonts don't load | No real `@font-face` rules shipped (Pitfall #7) | Emit `dist/fonts.css` with relative URLs |

When in doubt: `pnpm pack`, install the tarball into a brand-new Vite or Next project, and look at the browser network tab. That's where the real bugs live.
