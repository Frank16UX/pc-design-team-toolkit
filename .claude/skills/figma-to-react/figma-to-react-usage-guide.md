# Figma to React Component Skill - Usage Guide

## Overview

This skill enables Claude to convert Figma component designs into production-ready React implementations with:

- ✅ Full design token integration with your existing token system
- ✅ React Aria for accessibility (WCAG AA compliance)
- ✅ TypeScript with complete type safety
- ✅ SCSS using BEM methodology
- ✅ Comprehensive props documentation
- ✅ Storybook stories for all variants
- ✅ Focus on pixel-perfect implementation matching Figma designs

## What This Skill Does

The skill automates the entire design-to-development handoff workflow:

1. **Extracts design context from Figma** using Figma MCP tools
2. **Maps Figma variables to your design tokens** (from tokens-from-ts.json)
3. **Generates component documentation** following your props-template.md format
4. **Creates React component code** with React Aria hooks
5. **Generates SCSS stylesheets** using your token system
6. **Creates Storybook stories** demonstrating all variants

## Installation

Upload the `figma-to-react.skill` file to Claude Code or claude.ai via the Skills menu.

## How to Use

### Basic Usage

Simply provide a Figma component URL and ask Claude to convert it:

```
Please convert this Figma button component to React:
https://figma.com/design/abc123/DesignSystem?node-id=123-456
```

Claude will:
1. Extract the design from Figma
2. Map all tokens to your design system
3. Generate all four artifacts (props docs, React component, SCSS, Storybook story)

### Advanced Usage

#### Specify Output Preferences

```
Convert this component to React with these requirements:
- Use the Secondary variant as the default
- Include loading state
- Add icon support with left/right positioning
- Figma URL: https://figma.com/design/abc123/DesignSystem?node-id=123-456
```

#### Request Specific Artifacts

```
I already have the component code, just generate:
1. Props documentation
2. Storybook story

For this Figma component: [URL]
```

#### Token Mapping Assistance

```
I'm seeing hard-coded values in my Figma component. Can you help me identify 
which design tokens should be applied for:
- This spacing value (16px)
- This color (#2b7a87)
- This text style (Lexend Medium 16px)
```

## What Gets Generated

### 1. Props Documentation (`ComponentName-props.md`)

Follows your exact template structure with:
- Overview (200 char max)
- Component Properties tables (Props + React Aria Properties)
- Size/Hierarchy/State/Surface variants
- Typography using token names (e.g., `$typography-text-md-regular`)
- Icon sizes using variables (e.g., `$size-height-icon-sm`)
- Complete accessibility documentation
- Usage guidelines

### 2. React Component (`ComponentName.tsx`)

Production-ready TypeScript component with:
- React Aria hook integration
- Proper TypeScript interfaces extending Aria props
- BEM-style class names
- All variant prop types
- Focus management
- Disabled state handling
- Ref forwarding

### 3. SCSS Stylesheet (`ComponentName.scss`)

Token-based styles including:
- Import from `~build/scss/tokens`
- BEM modifier syntax
- All state variants (default, hover, active, disabled, focus-visible)
- Size variants using token values
- Proper focus-visible styling (never just `:focus`)

### 4. Storybook Story (`ComponentName.stories.tsx`)

Interactive documentation with:
- Default story
- Size variants demo
- Hierarchy variants demo
- State variants demo
- Proper TypeScript typing
- Controls for all props

## Key Features

### Design Token Integration

The skill automatically maps Figma variables to your token system:

**Color Tokens:**
- `$color-buttons-primary-default`
- `$color-text-default-primary`
- `$color-border-input-hover`

**Spacing Tokens:**
- `$spacing-md` (16px)
- `$spacing-lg` (24px)

**Typography Tokens:**
- `$typography-text-md-regular` (Lexend Regular, 16px, weight 400, line height 1.5)
- `$typography-other-cta-md` (Lexend Medium, 16px, weight 500, line height 1)

**Size Tokens:**
- `$size-height-md` (40px)
- `$size-height-icon-sm` (20x20px)

**Other Tokens:**
- `$radius-md` (8px)
- `$elevation-sharp-md` (card shadow)
- `$focus-accent` (teal focus ring)

### React Aria Integration

Every interactive component uses proper React Aria hooks:

```tsx
const { buttonProps } = useButton({ ...ariaProps, isDisabled }, ref);
const { inputProps } = useTextField(ariaProps, ref);
const { checkboxProps } = useCheckbox(ariaProps, state, ref);
```

This ensures:
- Keyboard navigation works correctly
- Screen readers announce everything properly
- Focus management follows best practices
- ARIA attributes are applied correctly

### Accessibility-First Approach

All components include:
- ✅ Keyboard navigation (Tab, Enter, Space, Arrow keys, Escape)
- ✅ Focus-visible indicators (using `$focus-*` tokens)
- ✅ Screen reader support (proper ARIA attributes)
- ✅ Color contrast compliance (WCAG AA minimum 4.5:1)
- ✅ Disabled state announcements
- ✅ Error state handling

### BEM Methodology

Clean, maintainable CSS class naming:

```scss
.button { } // Block
.button--primary { } // Block modifier
.button--sm { } // Block modifier
.button__icon { } // Element
.button__icon--left { } // Element modifier
```

## Customization

### Modify Token Mappings

If you need to update token mappings, edit:
`references/token-mapping.md`

### Add New Component Patterns

To add new patterns (e.g., Tabs, Accordion), edit:
`references/component-patterns.md`

### Update Props Template

If your documentation format changes, update:
`references/props-template.md`

## Troubleshooting

### "Token not found in Figma"

**Problem:** Component uses hard-coded values instead of variables.

**Solution:** Ask Claude to identify which tokens should be applied:
```
This Figma component has hard-coded values. Which tokens should replace:
- Color: #2b7a87
- Spacing: 16px
- Font: Lexend 16px Medium
```

### "React Aria hook not working"

**Problem:** Props not spreading correctly or ref not forwarded.

**Solution:** Check the component pattern in `references/component-patterns.md` for the correct hook usage.

### "SCSS compilation error"

**Problem:** Token variable names don't match.

**Solution:** Verify token names in `references/token-mapping.md` and check for typos in variable references (remember the `$` prefix).

### "Missing accessibility features"

**Problem:** Component doesn't meet WCAG standards.

**Solution:** Request specific accessibility enhancements:
```
Add the following to this component:
- Keyboard navigation documentation
- Focus-visible styles
- Screen reader announcements for state changes
- Color contrast verification
```

## Tips for Best Results

1. **Provide complete Figma URLs** - Include both fileKey and nodeId
2. **Specify all variants upfront** - Mention size, hierarchy, state variants you need
3. **Request all artifacts together** - More efficient than requesting them separately
4. **Use your existing tokens** - Don't ask for new tokens unless absolutely necessary
5. **Test in Storybook** - Use the generated stories to verify all variants work
6. **Review accessibility** - Check keyboard navigation and screen reader support

## Integration with Your Workflow

This skill fits into your existing workflow:

```
Figma Design → Claude (this skill) → React Component
                                   → Props Documentation
                                   → SCSS Styles
                                   → Storybook Story
                                        ↓
                                   Review & Test
                                        ↓
                                   Commit to Repo
```

Since you work with:
- React with React Aria
- SCSS variables in `~build/scss/`
- Storybook for documentation
- Custom-built frontend (no frameworks)
- Limited development resources

This skill bridges the gap between Diana's Figma designs and implementation-ready code that your single developer can work with.

## Red Team Validation

As requested, here's my skeptical take on potential issues:

**Confidence: High**

1. **Token naming inconsistencies** - Your token system uses both kebab-case (`text-primary`) and descriptive names (`primary-inverted`). The skill handles this, but watch for edge cases in complex token paths.

2. **Typography token complexity** - The composite typography tokens (font-family + size + weight + line-height) require careful extraction from Figma. If Figma styles don't perfectly match your token structure, manual adjustment may be needed.

3. **React Aria version compatibility** - The patterns assume React Aria v3+. If you're using older versions, some hooks may have different APIs.

4. **SCSS variable availability** - The skill assumes all tokens are available as SCSS variables in `~build/scss/tokens`. If your token transformation pipeline doesn't expose all tokens as SCSS variables, you'll need to add them.

5. **Figma MCP limitations** - The skill relies on Figma MCP tools returning complete information. If Figma's API doesn't expose certain properties (like some advanced interactions), those will need manual implementation.

**Recommendation:** Start with a simple button component to validate the workflow, then tackle more complex components as you confirm the patterns work with your specific setup.

## Examples

See the `references/component-patterns.md` file for complete examples of:
- Button (primary, secondary, destructive)
- TextField (with error states)
- Checkbox (with custom styling)
- Select/Dropdown
- Card (static and interactive)
- Modal/Dialog

Each example includes both the React component and SCSS implementation.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the reference files in the skill
3. Ask Claude for clarification on specific patterns
4. Validate token names against `references/token-mapping.md`
