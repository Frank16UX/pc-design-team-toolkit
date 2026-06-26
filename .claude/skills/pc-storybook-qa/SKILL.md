---
name: pc-storybook-qa
description: Audit Storybook token implementations against baseline SCSS files. Creates QA sessions, compares screenshots to baseline tokens, and generates detailed markdown reports of discrepancies.
---

# PC Storybook QA Skill

## Overview

This skill audits Storybook token implementations by comparing visual screenshots against baseline SCSS token files. It systematically identifies missing tokens and incorrect values, generating comprehensive markdown reports for QA tracking.

**Use this skill when:**
- Starting a new token QA audit session
- Continuing work on an existing audit session
- Comparing Storybook screenshots to baseline SCSS files
- Generating structured reports of token discrepancies

**What it produces:**
- Organized session folders with baseline files and screenshots
- Detailed markdown reports documenting:
  - Missing tokens (in SCSS but not in Storybook)
  - Wrong values (displayed value ≠ SCSS value)
  - Summary tables by category
  - Pages with no issues

---

## Commands

### `/new-qa-session` - Create New Session

Creates a new QA session folder with the proper directory structure.

**Behavior:**
- Generates session name as `session-[mm]-[dd]-[yyyy]` using current date
- Creates folder structure:
  ```
  session-mm-dd-yyyy/
  ├── baseline/
  │   └── scss/
  ├── screenshots/
  └── findings-claude/
  ```
- Informs user to populate baseline and screenshots folders

### `/continue-session` - Continue Existing Session

Continues working on an existing QA session.

**Behavior:**
- Auto-detects the most recent session folder or prompts user to specify
- Verifies session folder exists and has proper structure
- Proceeds to audit workflow (prompts for token group, baseline file, screenshots folder)

### `pc-storybook-qa` - Perform Audit

Executes the audit workflow for a specific token group.

**Arguments:**
- `group` - Token group name (e.g., "color", "spacing", "typography")
- `baseline` - Path to baseline SCSS file (e.g., `session-*/baseline/scss/_tokens.scss`)
- `screenshots` - Path to screenshots folder (e.g., `session-*/screenshots/color/`)

---

## Session Structure

All QA work is organized in session folders with a standardized structure:

```
session-mm-dd-yyyy/
├── baseline/scss/          # Baseline SCSS token files
│   ├── _tokens.scss
│   ├── _numeric-tokens.scss
│   └── ...
├── screenshots/            # Organized by token group
│   ├── color/
│   │   ├── tokens-text.jpg
│   │   ├── tokens-button.jpg
│   │   └── ...
│   ├── spacing/
│   └── typography/
└── findings-claude/        # Generated QA reports
    ├── color-qa.md
    ├── spacing-qa.md
    └── ...
```

**Key conventions:**
- Session names use format: `session-[mm]-[dd]-[yyyy]` (e.g., `session-02-16-2026`)
- Screenshots are organized by token group in subfolders
- Reports are named: `[group]-qa.md`
- Baseline SCSS files live in `baseline/scss/`

---

## Workflow Steps

### For `/new-qa-session`

1. Get current date and format as `mm-dd-yyyy`
2. Create session folder: `session-[mm]-[dd]-[yyyy]/`
3. Create subdirectories:
   - `baseline/scss/`
   - `screenshots/`
   - `findings-claude/`
4. Confirm structure created
5. Instruct user to:
   - Copy baseline SCSS files to `baseline/scss/`
   - Organize screenshots into `screenshots/[group]/` folders

### For `/continue-session`

1. List available session folders in current directory (matching `session-*`)
2. Auto-detect latest session or prompt user to confirm/specify session name
3. Verify session folder exists and contains required subdirectories
4. Proceed to audit workflow (prompt for token group if not specified)

### For Audit Execution

When user invokes `pc-storybook-qa` with or without arguments, follow this workflow:

#### Step 1: Gather Required Inputs

Prompt only if not provided in arguments:

- **Token group name**: What token type to audit (e.g., "color", "spacing", "radius", "typography")
- **Baseline SCSS file path**: Path to the source of truth SCSS file (e.g., `session-02-16-2026/baseline/scss/_tokens.scss`)
- **Screenshots folder path**: Path to folder containing screenshots for this group (e.g., `session-02-16-2026/screenshots/color/`)

#### Step 2: Read Baseline SCSS File

1. Use Read tool to load the baseline SCSS file
2. Parse all token variables and their values:
   - Variable format: `$color-text-primary: #1a1a1a;`
   - Extract: variable name (`$color-text-primary`) and value (`#1a1a1a`)
3. Organize tokens by logical categories based on variable naming:
   - For colors: Text, Button, Border, Links, Surface, Background, Icon, Graphics, Themes
   - For spacing: Padding, Margin, Gap, etc.
   - For radius: Corner radii
   - For typography: Font sizes, weights, line heights
4. Store in structured format for comparison (e.g., dictionary/hash by category)

#### Step 3: Read All Screenshots

1. Use Glob to find all image files in screenshots folder (e.g., `*.jpg`, `*.png`)
2. For each screenshot:
   - Use Read tool to load the image
   - Extract visible token information:
     - Token labels/names (e.g., "text-primary", "button-solid")
     - Displayed values (e.g., `#1a1a1a`, `16px`, `50%`)
   - Account for JPEG compression artifacts when comparing colors (±1-2 difference in RGB channels is acceptable)
3. Build a mapping of screenshot tokens to their displayed values

**Important visual parsing guidelines:**
- Token names in screenshots may be shortened (e.g., "primary" instead of "$color-text-primary")
- Map shortened names to full SCSS variable names using pattern matching
- Screenshots are organized by page (e.g., `tokens-text.jpg`, `tokens-button.jpg`)
- Each page contains a category or subcategory of tokens

#### Step 4: Compare Screenshots vs Baseline

For each token in the baseline SCSS file:

**Identify missing tokens:**
- Token exists in SCSS but is not visible in any screenshot
- Group by category and page
- Note if entire groups/subsections are missing

**Identify wrong values:**
- Token exists in both SCSS and screenshot but values don't match
- Account for unit types:
  - **Hex colors**: `#xxxxxx` - allow ±1-2 in RGB channels for JPEG compression
  - **Pixels**: `Npx` - exact match required
  - **Percentages**: `N%` - exact match required
  - **Unitless numbers**: exact match required
  - **Other units**: `rem`, `em` - exact match required
- Map shortened token names from screenshots to full SCSS variable names
- Note if wrong value belongs to a different token (copy-paste errors)

**Track pages with no issues:**
- Pages where all tokens match perfectly
- Include count of correct tokens for verification

#### Step 5: Generate Markdown Report

Create report at `session-*/findings-claude/[group]-qa.md` following this exact format:

```markdown
# [Token Group] Tokens QA Report

**Date:** YYYY-MM-DD
**Baseline:** `path/to/baseline.scss`
**Screenshots reviewed:** `path/to/screenshots/*.jpg`

---

## Summary

| Category | Missing Tokens | Wrong [Unit] Values |
|----------|---------------|---------------------|
| [Category 1] | N | N |
| [Category 2] | N | N |
| ...
| **Total** | **N** | **N** |

---

## Missing Tokens

### [Category/Page Name] (`screenshot-file.jpg`)

[Explanatory text about the issue, if applicable]

| SCSS Variable | Expected Value |
|---|---|
| `$variable-name-1` | `value1` |
| `$variable-name-2` | `value2` |

[Repeat for each category with missing tokens]

---

## Wrong [Unit] Values

### N. [Category] > [Subcategory] > [Token Name]

| | Value |
|---|---|
| **Storybook shows** | `displayed-value` |
| **SCSS expected** | `correct-value` |
| **SCSS variable** | `$variable-name` |

[Explanatory text about why this might be wrong, especially if it's a copy-paste error]

[Repeat for each wrong value, numbered sequentially]

---

## Pages with No Issues

The following storybook pages matched the SCSS token values with no discrepancies:

- **[Page Name]** (`screenshot-file.jpg`) — all N tokens correct
- **[Page Name]** (`screenshot-file.jpg`) — all N tokens correct [with explanatory note if needed]

```

**Report format notes:**
- Use exact heading levels and separators as shown
- Number wrong values sequentially (1, 2, 3...)
- Include explanatory text for systematic issues (e.g., missing entire groups, copy-paste patterns)
- Use backticks for code: `$variable-name`, `#hexcolor`, `16px`
- Use bold for emphasis: **Storybook shows**, **Total**
- Include file references in parentheses: (`tokens-text.jpg`)

#### Step 6: Present Summary to User

After generating the report:

1. Display summary statistics:
   - Total missing tokens count
   - Total wrong values count
   - Number of pages with no issues
2. Provide full path to generated report file
3. Optionally highlight major findings (e.g., "Entire Semantic group missing")

---

## Token Type Support

This skill supports any token type with automatic unit detection:

### Colors
- **Format**: Hex values (`#xxxxxx`, `#xxxxxxxx` with alpha)
- **Comparison**: Exact match, allowing ±1-2 in RGB channels for JPEG compression artifacts
- **Example**: `$color-text-primary: #1a1a1a;`

### Spacing
- **Format**: Pixel values (`Npx`)
- **Comparison**: Exact match required
- **Example**: `$spacing-medium: 16px;`

### Radius
- **Format**: Pixel values (`Npx`) or percentages (`N%`)
- **Comparison**: Exact match required
- **Example**: `$radius-button: 8px;` or `$radius-circle: 50%;`

### Typography
- **Format**: Various units (`px`, `rem`, `em`) or unitless numbers
- **Comparison**: Exact match required
- **Examples**:
  - `$font-size-body: 16px;`
  - `$line-height-normal: 1.5;`
  - `$font-weight-bold: 700;`

**Unit detection:**
- Automatically detect unit type from baseline SCSS file values
- Use appropriate comparison logic based on detected unit type
- Include unit type in report headers (e.g., "Wrong Hex Values", "Wrong Pixel Values")

---

## Best Practices

### Before Starting Audit
- ✅ Verify session folder exists and has proper structure
- ✅ Confirm baseline SCSS file path is correct and file exists
- ✅ Confirm screenshots folder contains relevant images
- ✅ Check that screenshots are organized by token group

### During Comparison
- ✅ Account for JPEG compression when comparing colors (±1-2 RGB tolerance)
- ✅ Map partial token names from screenshots to full SCSS variable names
  - Example: "primary" in screenshot → `$color-text-primary` in SCSS
- ✅ Look for systematic patterns (entire groups missing, copy-paste errors)
- ✅ Note when wrong values belong to different tokens (helps identify root cause)

### Report Generation
- ✅ Follow exact markdown format from reference template
- ✅ Group findings by logical categories (Text, Button, Border, etc.)
- ✅ Include explanatory text for systematic issues
- ✅ Number wrong values sequentially for easy reference
- ✅ List pages with no issues for completeness

### Error Handling
- ❌ If baseline SCSS file not found: Prompt user for correct path
- ❌ If screenshots folder empty: Inform user and ask for correct path
- ❌ If session folder doesn't exist: Offer to create with `/new-qa-session`
- ❌ If malformed SCSS: Report parsing errors with line numbers

---

## Examples

### Example 1: Creating a New Session

```
User: /new-qa-session

Claude: Created new QA session folder structure:

session-02-16-2026/
├── baseline/scss/
├── screenshots/
└── findings-claude/

Next steps:
1. Copy your baseline SCSS files to `session-02-16-2026/baseline/scss/`
2. Organize screenshots into `session-02-16-2026/screenshots/[group]/` folders
   (e.g., `screenshots/color/`, `screenshots/spacing/`)
3. Run an audit with `pc-storybook-qa` when ready
```

### Example 2: Continuing an Existing Session

```
User: /continue-session

Claude: Found existing sessions:
- session-02-16-2026 (most recent)
- session-02-10-2026

Which session would you like to continue? [session-02-16-2026]

User: session-02-16-2026

Claude: Verified session structure. What token group would you like to audit?
Available folders: color/, spacing/

User: spacing

Claude: Please provide:
1. Baseline SCSS file: [session-02-16-2026/baseline/scss/_numeric-tokens.scss]
2. Screenshots folder: [session-02-16-2026/screenshots/spacing/]

[Proceeds to audit workflow...]
```

### Example 3: Running an Audit with Arguments

```
User: pc-storybook-qa group=color baseline=session-02-16-2026/baseline/scss/_tokens.scss screenshots=session-02-16-2026/screenshots/color

Claude: Starting Color tokens audit...

✓ Read baseline SCSS: 98 tokens found
✓ Analyzed 8 screenshot pages
✓ Comparison complete

Summary:
- Missing tokens: 18
- Wrong values: 4
- Pages with no issues: 4

Report generated: session-02-16-2026/findings-claude/color-qa.md

Key findings:
- Entire Semantic group missing from Border and Background pages (16 tokens)
- Several copy-paste errors detected (wrong token values mapped)
```

### Example 4: Audit Without Arguments (Interactive)

```
User: pc-storybook-qa

Claude: What token group would you like to audit?
(e.g., color, spacing, radius, typography)

User: typography

Claude: Please provide the baseline SCSS file path:

User: session-02-16-2026/baseline/scss/_typography-tokens.scss

Claude: Please provide the screenshots folder path:

User: session-02-16-2026/screenshots/typography

Claude: Starting Typography tokens audit...
[Proceeds with audit workflow...]
```

---

## Troubleshooting

### Issue: Screenshots not loading properly

**Symptoms:** Read tool fails to load image files or returns corrupted data

**Solutions:**
- Verify file paths are correct (use Glob to list files first)
- Ensure images are in supported formats (JPG, PNG)
- Check file permissions
- Try converting screenshots to PNG if JPEG compression is too aggressive

### Issue: SCSS parsing errors

**Symptoms:** Cannot extract token values from baseline file

**Solutions:**
- Verify SCSS syntax is correct (variables should be `$name: value;`)
- Check for comments or non-token lines (ignore those)
- Look for multi-line values (may need special handling)
- Report specific line numbers where parsing fails

### Issue: Token name mapping failures

**Symptoms:** Cannot match screenshot tokens to SCSS variables

**Solutions:**
- Check naming conventions (screenshots may use shortened names)
- Look for patterns: `text-primary` → `$color-text-primary`
- Account for category prefixes: `primary` in Text section → `$color-text-primary`
- Log unmatched tokens for manual review

### Issue: Too many false positives for color comparisons

**Symptoms:** Colors flagged as wrong but visually match

**Solutions:**
- Increase RGB tolerance for JPEG artifacts (±2 or ±3)
- Convert screenshots to PNG to avoid compression
- Use color picker to verify actual displayed values
- Document tolerance level in report

---

## Technical Notes

### SCSS Parsing Pattern

Token variables follow this pattern:
```scss
$[category]-[subcategory]-[modifier]: [value];
```

Examples:
- `$color-text-primary: #1a1a1a;`
- `$spacing-padding-medium: 16px;`
- `$radius-button-large: 8px;`

**Parsing logic:**
1. Match lines with `$` followed by `: ` and ending with `;`
2. Extract variable name (everything between `$` and `:`)
3. Extract value (everything between `: ` and `;`)
4. Trim whitespace
5. Store in structured format with category grouping

### Color Comparison Algorithm

For hex colors, convert to RGB and compare channels:

```
hex1 = "#1a1a1a" → RGB(26, 26, 26)
hex2 = "#1b1b1b" → RGB(27, 27, 27)

For each channel (R, G, B):
  diff = abs(hex1[channel] - hex2[channel])
  if diff <= 2:  # JPEG tolerance
    channels_match = true
  else:
    channels_match = false
```

Only flag as mismatch if ANY channel exceeds tolerance.

### Screenshot Token Extraction

Screenshots typically show tokens in a table or list format:
- **Token name** (often shortened, e.g., "primary", "solid", "error")
- **Token value** (e.g., "#1a1a1a", "16px", "50%")

**Extraction strategy:**
1. Use vision capabilities to identify token rows/entries
2. Extract name-value pairs
3. Build full variable name from context:
   - Page name (e.g., "tokens-text.jpg" → "text")
   - Section headers (e.g., "Error" subsection)
   - Token name (e.g., "high-contrast-inverted")
   - Result: `$color-text-error-high-contrast-inverted`

---

## Integration with Existing Workflows

### Git Integration

Consider tracking QA sessions in version control:

```bash
# Initialize git in session folder (optional)
cd session-02-16-2026
git init
git add .
git commit -m "Initial QA session setup"

# After generating reports
git add findings-claude/
git commit -m "Add color tokens QA report - 18 missing, 4 wrong"
```

### Reporting to Team

Generated markdown reports can be:
- Copied to project documentation
- Shared in PRs or issues
- Converted to other formats (PDF, HTML)
- Used as checklists for fixes

### Iterative Audits

After fixes are made to Storybook:
1. Take new screenshots
2. Re-run audit with same baseline
3. Compare report counts to verify improvements
4. Archive old reports with version numbers: `color-qa-v1.md`, `color-qa-v2.md`

---

## Future Enhancements

Potential improvements to this skill:

- **Automated screenshot capture**: Integrate with Puppeteer or Playwright to capture screenshots directly from Storybook
- **Diff reports**: Compare two audit runs to show progress
- **HTML report generation**: Convert markdown to styled HTML with syntax highlighting
- **Batch processing**: Audit all token groups in one command
- **Token coverage metrics**: Calculate percentage of tokens correctly implemented
- **Visual diff overlays**: Generate images showing expected vs actual colors side-by-side

---

## References

- **Template report**: `session-2-16-2026/findings-claude/color-qa.md`
- **SCSS token files**: `session-*/baseline/scss/*.scss`
- **Screenshot examples**: `session-*/screenshots/*/`

---

**Last updated:** 2026-02-16
**Version:** 1.0.0
**Maintainer:** Claude Code