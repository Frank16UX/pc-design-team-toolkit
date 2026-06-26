---
name: storybook-css-extractor
description: Download the compiled CSS module for a specific component from a live Storybook page and save it as a .css file at a location the user chooses. The output is meant to feed into a downstream comparison skill (e.g. pc-storybook-qa) — this skill does extraction only, no reporting, no comparison, no token mapping. Use this skill whenever the user wants to "extract", "pull", "grab", "get", "download", "save", or "fetch" the CSS / SCSS / styles for a component on a Storybook URL — including phrases like "extract the accordion css from this storybook", "download the css module for the button", "I need the styles for this component so I can audit it", "grab the scss for the accordion", or any time they paste a Storybook story URL alongside a request to extract or save its styling. Strongly prefer this skill over right-clicking elements one by one or pasting JS into DevTools manually.
---

# Storybook CSS Extractor

## What this skill does

Takes a Storybook story URL, extracts every CSS rule that targets the component, writes them verbatim to a `.css` file at a path the user chooses. That's the entire deliverable.

The output file is the **input** for a downstream comparison skill (e.g. `pc-storybook-qa`) — this skill does no reporting, no comparison, no token mapping, no JSON sidecars.

## When this is the right skill

- The user gives a Storybook URL and asks to extract, download, pull, or save the CSS / SCSS for a component
- The user is preparing to QA a component against a reference implementation and needs the live page's CSS as the artifact-under-audit
- The user mentions using the output with another skill (often `pc-storybook-qa`)

If the user wants opinions, comparisons, or analysis on the extracted CSS, do the extraction here, then hand off to the downstream skill they specify.

## Required tools

This skill uses the **Claude in Chrome** MCP connector:

- `mcp__Claude_in_Chrome__navigate` — open the Storybook URL
- `mcp__Claude_in_Chrome__javascript_tool` — run the extraction script in the page

If the connector isn't available, fall back to handing the user the script for manual paste — see `references/devtools-fallback.md`.

## Workflow

### Step 1 — Identify the component

You need:

- **Storybook URL** (required)
- **Component name** (optional) — substring used to filter CSS selectors and find live instances. If not provided, infer from the URL path: `?path=/story/atomic-components-accordion--basic` → `accordion` (the segment before the last `--`). Confirm briefly to the user, but don't block.

### Step 2 — Decide where to save the file

Default: `<component>-extracted.css` in the user's outputs folder (`/sessions/lucid-happy-hypatia/mnt/outputs/` in Cowork).

If the user mentioned a path or filename in the prompt (e.g. *"save to session-04-28-2026/baseline/accordion-extracted.css"*), use that.

If they didn't specify and the default is fine, just proceed. If you're not sure where they want it (e.g. they have an existing QA session structure), ask once, briefly:

> "Where should I save this? Default is `<component>-extracted.css` in your outputs folder. If you have a QA session already going (e.g. `session-MM-DD-YYYY/baseline/`), let me know the path."

Don't pepper the user with questions — one ask, then proceed.

### Step 3 — Navigate

Use `mcp__Claude_in_Chrome__navigate` to open the Storybook URL. Storybook v6+ renders the story inside `#storybook-preview-iframe`; the extraction script handles the iframe traversal internally.

Quick sanity check after navigation:

```javascript
JSON.stringify({
  url: location.href,
  hasIframe: !!document.querySelector('iframe#storybook-preview-iframe, iframe[id*="storybook"]')
})
```

### Step 4 — Run the extraction script

The script is at `scripts/extract_component_css.js`. Read it and execute via `mcp__Claude_in_Chrome__javascript_tool`. It returns a JSON object — the only field you really need is `rulesText`, the concatenated CSS rules ready to write to disk:

```json
{
  "componentName": "accordion",
  "sourceURL": "https://...",
  "originStylesheets": ["https://.../assets/index-C63gzemM.css"],
  "ruleCount": 31,
  "rulesText": ".Accordion-module__accordion___UwVjw{ ... }\n\n.Accordion-module__section___27dGF{ ... }\n\n...",
  "warnings": []
}
```

If `ruleCount` is 0, the component name probably doesn't match. Try alternates (singular/plural, with/without prefixes, the bare story slug) before asking the user.

### Step 5 — Write the .css file

Prepend a short comment block with the extraction metadata, then write the rules. The comment is for the user's future self and downstream tooling — it makes the file self-describing without breaking CSS parseability.

```css
/* ─────────────────────────────────────────────────────────
 * Component: accordion
 * Source:    https://sandbox.pamperedchef.com/.../?path=/story/atomic-components-accordion--basic
 * Origin:    https://sandbox.pamperedchef.com/.../assets/index-C63gzemM.css
 * Extracted: 2026-04-29
 * Rules:     31
 * ─────────────────────────────────────────────────────────
 */

.Accordion-module__accordion___UwVjw{
  ...
}

.Accordion-module__section___27dGF{
  ...
}

...
```

Write `rulesText` verbatim — no reformatting, no minification changes. The file is the artifact of record; downstream skills depend on completeness.

### Step 6 — Tell the user where it landed

Use a `computer://` link. Lead with the headline: how many rules were extracted, file path, any warnings.

> "Saved 31 CSS rules to [`accordion-extracted.css`](computer://...). You can now run `/pc-storybook-qa` on it against your reference implementation."

That's the entire response. No summary of the rules. No paraphrase. No table of contents. The user opens the file themselves if they want to inspect it.

## Important nuances

**The browser sees compiled CSS, not SCSS.** The script reads `document.styleSheets` — post-build output. Variables, mixins, nesting from the original SCSS source are not recoverable from the live page. If the user explicitly asks for "SCSS", confirm that "the styles as the browser sees them" is what they need (it usually is, since downstream comparison skills are working with the same compiled view).

**Capture every state, not just the rendered one.** The stylesheet contains rules for `:hover`, `:focus-visible`, `.open`, surface variants, etc., even when the current DOM doesn't activate them. The script extracts all of them — completeness matters because downstream QA work needs to see hover/focus rules too. The previous iteration of this skill missed hover state mismatches because it only sampled `getComputedStyle` (which only reflects the current state); the current script also walks the raw stylesheet text, which captures everything.

**Two-pass extraction.** The script walks `cssRules` (parsed but normalized) and also `fetch()`-es the stylesheet directly to get verbatim text. Both passes are merged, deduped by selector. The raw-text pass also catches `@media` and `@supports` blocks more reliably and works for CORS-blocked sheets (most are same-origin in Storybook builds).

**Do not embed token values, do not run comparisons.** A previous version of this skill tried to flag off-token values inline and got the token set wrong. That work belongs in the downstream skill, where the user supplies the real token source.

## Examples

### Example 1 — Default save location

```
User: extract the accordion css from
https://sandbox.pamperedchef.com/design-system/v4/index.html?path=/story/atomic-components-accordion--basic
```

Steps:
1. Infer `accordion`
2. Default path: `/sessions/lucid-happy-hypatia/mnt/outputs/accordion-extracted.css`
3. Navigate, extract
4. Write file
5. Reply: "Saved 31 CSS rules → [`accordion-extracted.css`](computer:///sessions/lucid-happy-hypatia/mnt/outputs/accordion-extracted.css)"

### Example 2 — User specifies a QA session path

```
User: pull the button css from {URL} and save it to session-04-29-2026/baseline/button-extracted.css
```

Use the exact path the user named. Don't second-guess the directory structure — they have a workflow.

### Example 3 — Hand-off to pc-storybook-qa

```
User: grab the accordion css so I can run pc-storybook-qa on it
```

Extract, save, then nudge:

> "Saved to {link}. You can now run `/pc-storybook-qa` against your reference implementation. If you want me to invoke it, I'll need the reference path."

### Example 4 — Chrome connector unavailable

If `mcp__Claude_in_Chrome__navigate` errors or isn't installed, fall back per `references/devtools-fallback.md`: hand the user the script, have them paste the JSON output back, and write the file from there.

## Reference files

- `scripts/extract_component_css.js` — the extraction script. Self-contained, returns JSON with `rulesText` ready to write.
- `references/devtools-fallback.md` — instructions when the Chrome connector isn't available.
