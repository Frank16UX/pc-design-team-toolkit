# DevTools fallback (when the Chrome connector isn't available)

If `mcp__Claude_in_Chrome__navigate` errors out or the connector isn't installed, you can still help the user by handing them the extraction script and walking them through running it in their browser's DevTools. They paste the JSON output back; you write the markdown report on your end.

## What to give the user

1. The contents of `scripts/extract_component_css.js` (read the file, present it in a code block).
2. After the function definition, append an invocation for their component:

```javascript
extractStorybookComponentCSS('accordion').then(r => {
  console.log(JSON.stringify(r, null, 2));
  copy(JSON.stringify(r));  // also copies to clipboard
});
```

3. Tell them to copy the result that prints in the console (or paste from clipboard) and send it back.

## Step-by-step instructions

The friction point most people hit is that Storybook renders inside an iframe, so the DevTools console runs in the wrong context by default. Lead with that.

> 1. **Open the Storybook story page** in Chrome, Edge, or Firefox.
> 2. **Right-click directly on the rendered component** (not the surrounding chrome) and choose **Inspect**. Right-clicking the component itself is the trick — it opens DevTools already inside the iframe context, so you skip the dropdown-switching dance.
> 3. **Switch to the Console tab.**
> 4. **Verify you're inside the iframe** — paste this and press Enter:
>    ```javascript
>    document.querySelectorAll('[class*="accordion" i]').length
>    ```
>    A number greater than 0 means you're in the right context. If you get 0, look for a context dropdown at the top of the Console (usually labeled `top`) and switch it to `storybook-preview-iframe`.
> 5. **Paste the full extraction script** (I'll give it to you below).
> 6. **Press Enter.** The result is logged as JSON and copied to your clipboard.
> 7. **Paste the JSON back to me** — I'll write the report on my end.

## Edge case: Edge DevTools sidebar

In Edge, the Console panel sometimes opens with a "No messages / No errors" sidebar that hides the command prompt. Tell them: *"If you see a 'No messages' panel and no place to type, look for a `>>` toggle at the top to collapse the sidebar — the prompt should appear."*

## Edge case: cross-origin iframe

If the user reports that `document.querySelectorAll(...)` returns 0 even after switching context, the Storybook iframe may be cross-origin. In that case, they need to open the iframe URL directly: right-click the iframe → "Open frame in new tab", and run the script there.

## Edge case: hashed class names

Some build tools hash class names in non-standard patterns (vanilla-extract uses `_5be51bcf1`, styled-components uses `sc-...`). The script's logical→hashed mapping logic only knows the common CSS-Modules pattern. If the user's classes don't fit that pattern, the script will still extract rules and computed styles correctly, but the `classMap` may be empty or partial. Mention this when you write the report — the rules section is still the source of truth.

## Why we still write the report on our end

Even in the fallback flow, you write the markdown report. Reasons:
- Report consistency across runs (template in `references/report-template.md`).
- The user gets the same artifact they would have gotten via the automated path.
- The downstream QA skill expects the markdown shape, not raw JSON.

The only difference between automated and fallback is *who runs the script*. Everything else stays the same.
