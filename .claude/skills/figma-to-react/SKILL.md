---
name: figma-to-react
description: Convert Figma components to production-ready React implementations using design tokens, React Aria, and design system best practices. Use when users request to build React components from Figma designs, need component implementation specs, or want to bridge design-to-development workflows with proper token mapping and accessibility.
---

# Figma to React Component Converter

This skill converts Figma component designs into production-ready React components with full design token integration, accessibility support via React Aria, and comprehensive documentation.

## Workflow

**Agent Architecture:**
- Use **Claude Opus 4.6** (or latest Opus model) for planning and design extraction phases
- Use **Claude Sonnet 4.5** (or latest Sonnet model) for execution and implementation
- Leverage subagents via the Task tool for parallel work and specialized tasks

Follow these steps in order:

### 1. Extract Figma Design Context

Use Figma MCP tools to gather component information:

```bash
# Get component design context (includes tokens, properties, structure)
Figma:get_design_context(fileKey, nodeId)

# Get variable definitions if needed for token mapping
Figma:get_variable_defs(fileKey, nodeId)

# Get screenshot for visual reference
Figma:get_screenshot(fileKey, nodeId)
```

**What to extract:**

- Component structure and hierarchy
- Applied variables/tokens (colors, spacing, typography, etc.)
- Variant properties (size, state, hierarchy, etc.)
- Interactive states (hover, pressed, disabled, focus)
- Text styles and their token mappings
- Layout constraints and spacing values
- Icons and image fills (DO NOT code SVGs - reference existing icons from `assets/icons/`)
- For image/video fills: Use `assets/imgs/img-placeholder-square.jpg` unless user specifies otherwise

### 2. Map Design Tokens

Cross-reference Figma variables to the design token system in `references/token-mapping.md`.

**Token categories to map:**

- Colors → `Tokens.color.*`
- Spacing → `Numeric Tokens.spacing.*`
- Typography → `Responsive/Desktop.typography.*` or `Responsive/Mobile.typography.*`
- Border radius → `Numeric Tokens.radius.*`
- Elevation/shadows → `Elevation.elevation.*`
- Size → `Numeric Tokens.size.*`

**Important:** Use Web Code Syntax for all token references (e.g., `$spacing-md` instead of raw values like `16px`).

### 3. Generate Component Props Documentation

Create props documentation following the template in `references/props-template.md`. Save them in `instructions/component-documentation`

**Required sections:**

- Overview (max 200 characters)
- Component Properties (separate tables for Props and React Aria Properties)
- Size Variants (with typography token names, not individual properties)
- Hierarchy Variants
- State Variants (default, hover, pressed, disabled, focus)
- Surface Variants (if applicable)
- Icons (token references for icon sizes)
- Typography (use token names from Figma descriptions)
- Visual Characteristics
- Accessibility (Focus State, Keyboard Navigation, Disabled State, Color Contrast)
- Usage Guidelines

**Critical formatting rules:**

1. Typography must reference token names: `$typography-text-md-regular` (Lexend Regular, 16px, weight 400, line height 1.5)
2. Icon sizes use variable syntax: `$size-height-icon-sm` (20x20px)
3. Spacing uses variable syntax: `$spacing-md` (16px)
4. Never use raw pixel values in documentation

### 4. Generate React Component Code

Create component implementation following `references/component-patterns.md`.

**Component structure:**

```tsx
import React from "react";
import { useButton } from "react-aria";
import type { AriaButtonProps } from "react-aria";
import "./ComponentName.scss";

interface ComponentNameProps extends AriaButtonProps {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "destructive";
  isDisabled?: boolean;
  // ... other props
}

export const ComponentName = ({
  size = "md",
  variant = "primary",
  isDisabled = false,
  children,
  ...ariaProps
}: ComponentNameProps) => {
  const ref = React.useRef(null);
  const { buttonProps } = useButton({ ...ariaProps, isDisabled }, ref);

  return (
    <button
      {...buttonProps}
      ref={ref}
      className={`component-name component-name--${size} component-name--${variant}`}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
};
```

**Key requirements:**

- Use React Aria hooks for accessibility
- TypeScript with explicit prop types
- SCSS for styling (referencing tokens from `~build/scss/`)
- BEM naming convention for CSS classes
- Proper disabled state handling
- Focus management with visible focus rings

### 5. Generate SCSS Styles

Create stylesheet using design tokens from the SCSS variable system.

**SCSS structure:**

```scss
@import "~build/scss/tokens";

.component-name {
  // Base styles using tokens - these are examples, use the respective tokens referencing what you find from the Figma MCP.
  padding: $spacing-md;
  border-radius: $radius-md;
  background-color: $color-buttons-primary-default;
  color: $color-text-default-primary-inverted;
  font-family: $font-family-secondary;
  font-size: $typography-text-md-regular-size;
  font-weight: $typography-text-md-regular-weight;
  line-height: $typography-text-md-regular-line-height;

  // State modifiers - these are examples, read the states from the Figma MCP extraction.
  &:hover:not(:disabled) {
    background-color: $color-buttons-primary-hovered;
  }

  &:active:not(:disabled) {
    background-color: $color-buttons-primary-pressed;
  }

  &:disabled {
    background-color: $color-buttons-primary-disabled;
    cursor: not-allowed;
  }

  &:focus-visible {
    box-shadow: $focus-accent;
    outline: none;
  }

  // Size variants. These are not fixed for all components. Extract and build the variants based on what you extract from Figma MCP.
  &--sm {
    height: $size-height-sm;
    padding-inline: $spacing-sm;
    font-size: $typography-other-cta-sm-size;
  }

  &--md {
    height: $size-height-md;
    padding-inline: $spacing-md;
    font-size: $typography-other-cta-md-size;
  }

  &--lg {
    height: $size-height-lg;
    padding-inline: $spacing-lg;
    font-size: $typography-other-cta-md-size;
  }
}
```

**SCSS best practices:**

- Import tokens from `~build/scss/tokens`
- Use BEM modifier syntax (`--variant`, `--size`)
- Separate state modifiers (`:hover`, `:active`, `:disabled`, `:focus-visible`)
- Use semantic token names (not primitive values)
- Include focus-visible styles for keyboard navigation

### 6. Create Storybook Story

Generate Storybook documentation showing all variants.

**Story structure:**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ComponentName } from "./ComponentName";

const meta: Meta<typeof ComponentName> = {
  title: "Components/ComponentName",
  component: ComponentName,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "destructive"],
    },
    isDisabled: {
      control: "boolean",
    },
    // React Aria props - include these for all interactive components
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the component. Overrides visible text for screen readers.',
      table: { category: 'React Aria' },
    },
    'aria-labelledby': {
      control: 'text',
      description: 'ID of element that labels this component.',
      table: { category: 'React Aria' },
    },
    'aria-describedby': {
      control: 'text',
      description: 'ID of element that describes this component.',
      table: { category: 'React Aria' },
    },
    // Add other relevant ARIA props based on component type
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    children: "Button Text",
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
      <ComponentName size="sm">Small</ComponentName>
      <ComponentName size="md">Medium</ComponentName>
      <ComponentName size="lg">Large</ComponentName>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "16px", flexDirection: "column" }}>
      <ComponentName variant="primary">Primary</ComponentName>
      <ComponentName variant="secondary">Secondary</ComponentName>
      <ComponentName variant="destructive">Destructive</ComponentName>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "16px" }}>
      <ComponentName>Default</ComponentName>
      <ComponentName isDisabled>Disabled</ComponentName>
    </div>
  ),
};
```

**Reference:** See `stories/components/Button.stories.tsx` for a complete example with React Aria props and comprehensive controls.

## Output Structure

Deliver all artifacts in this order:

1. **Props Documentation** (`ComponentName-props.md`)
   - Following template structure in `instructions/component-documentation/`
   - All tokens referenced by variable name
   - Complete accessibility documentation
   - Reference `instructions/component-documentation/button/button-props.md` for structure

2. **React Component** (`ComponentName.tsx`)
   - TypeScript with full type safety
   - React Aria integration
   - Clean, maintainable code
   - NO inline SVG code - use existing icons from `assets/icons/`

3. **SCSS Stylesheet** (`ComponentName.module.scss`)
   - Token-based styling from `build/scss/`
   - BEM methodology
   - All state variants

4. **Storybook Story** (`ComponentName.stories.tsx`)
   - Interactive examples with React Aria props
   - All variants demonstrated
   - Accessibility testing hooks
   - Image/video URL props if component contains media fills

### 7. Automated Testing & Validation

After component implementation, perform automated testing:

```bash
# Use Claude in Chrome (or built-in /chrome integration) for automated testing
# Open Storybook and navigate to component
# Test all variants, states, and interactions
# Verify visual fidelity against Figma design
# Test keyboard navigation and screen reader compatibility
```

**Testing checklist:**
- Visual comparison with Figma design (pixel-perfect within 2px tolerance)
- All variants render correctly
- Interactive states (hover, focus, pressed, disabled) work as expected
- Keyboard navigation functions properly
- Loading states display correctly
- Success/error states behave as designed

### 8. Cleanup Junk Files

The Figma MCP sometimes generates temporary files during extraction. Clean these up:

```bash
# Remove any auto-generated SVG or image files in root or unexpected locations
# Keep only intentionally referenced assets in assets/icons/ and assets/imgs/
# Verify no orphaned files exist from the MCP extraction process
```

**Common junk files to remove:**
- Root-level SVG files generated by Figma MCP
- Temporary PNG/JPG files not in `assets/imgs/`
- Duplicate icon files not in `assets/icons/` structure

## Critical Rules

1. **Never use raw values** - Always reference design tokens by variable name from `build/scss/`
2. **Typography tokens** - Use token names from Figma style descriptions (e.g., `$desktop-typography-text-md-regular`)
3. **React Aria required** - All interactive components must use React Aria hooks
4. **Accessibility first** - Document and implement all ARIA attributes, keyboard navigation, focus states
5. **BEM naming** - Use consistent BEM methodology for CSS class names
6. **Type safety** - All components must have explicit TypeScript interfaces
7. **SCSS imports** - Always import from `~build/scss/index`
8. **Focus visible** - Always include `:focus-visible` styles, never just `:focus`
9. **NO inline SVGs** - Never code SVG markup inline. Always use existing icons from `assets/icons/`
10. **Icon categories** - Available: `base/`, `consumables/`, `custom/`, `filled/`, `graphic/`, `social/`, `flags/`
11. **Image placeholders** - Use `assets/imgs/img-placeholder-square.jpg` for image fills unless user specifies otherwise
12. **Props from Figma** - Build component props based on actual Figma MCP extraction, not assumptions
13. **Reference documentation** - Follow `instructions/component-documentation/button/button-props.md` structure
14. **Use subagents** - Leverage Task tool for parallel work and specialized tasks
15. **Test with Chrome** - Use /chrome or Claude in Chrome for automated visual testing after implementation
16. **Clean up junk** - Remove temporary files generated by Figma MCP (SVGs, images in wrong locations)

## Prop Naming Conventions

Follow these conventions when building component props from Figma:

1. **lowerCamelCase naming** - Always use lowerCamelCase for prop names (e.g., `iconLeading`, `isDisabled`, `successLabel`)
   - Most Figma properties already use this convention
   - If Figma uses different casing, convert to lowerCamelCase

2. **Figma emoji indicators** - Remove emojis (✏️, 🔄) from Figma property names in code:
   - **✏️ (Edit emoji)** - Indicates editable text that needs boolean + string props in Figma
   - **🔄 (Swap emoji)** - Indicates swappable instances (like icons) that need boolean + swap props in Figma
   - In React code, these are simplified (see below)

3. **Text content props**:
   - **Single text element** → Use `children` prop (React convention)
   - **Multiple text elements** → Use named props from Figma (e.g., `title`, `supportingText`, `label`)
   - **Editable text with ✏️** in Figma → Just use the text prop in React
     - Figma: `✏️ Label` (needs boolean `showLabel` + string `label`)
     - React: `children` or named prop (empty = hidden)

4. **Icon props**:
   - **Icon with 🔄** in Figma → Boolean + swap props in React
     - Figma: `🔄 Icon Leading` (needs boolean + swap instance)
     - React: `iconLeading?: boolean` + `iconLeadingSwap?: React.ReactNode`
   - **Empty icon prop = hidden** (no need for separate boolean in some cases)
   - See [Button.tsx](src/components/actions/Button/Button.tsx) for reference implementation

5. **Boolean prefixes**:
   - Use `is` prefix for state: `isDisabled`, `isLoading`, `isActive`
   - Use `has` prefix for presence: `hasIcon`, `hasBorder`
   - Use `show` prefix for visibility: `showLabel`, `showDivider`

6. **Reference implementation**:
   - [Button.tsx](src/components/actions/Button/Button.tsx) - Complete example of prop naming
   - [Button.module.scss](src/components/actions/Button/Button.module.scss) - SCSS token usage

### Examples

**Figma Properties → React Props:**

```typescript
// Figma: "✏️ Label" (editable text)
// React: Use children or named prop
children?: React.ReactNode;
// OR for multiple text elements:
label?: string;
title?: string;
supportingText?: string;

// Figma: "🔄 Icon Leading" (swappable icon)
// React: Boolean + swap instance
iconLeading?: boolean;
iconLeadingSwap?: React.ReactNode;

// Figma: "Size" with options (sm, lg)
// React: Keep as-is (already lowerCamelCase)
size?: 'sm' | 'lg';

// Figma: "Is Disabled" or "Disabled"
// React: Use 'is' prefix
isDisabled?: boolean;
```

## Common Patterns

See `references/component-patterns.md` for:

- Button patterns (primary, secondary, destructive)
- Input field patterns (text, select, checkbox)
- Card patterns (interactive, static)
- Navigation patterns (tabs, segmented controls)
- Modal/dialog patterns
- Form patterns with validation

## Token System Notes

- Color tokens follow semantic naming: `$color-{category}-{variant}-{state}`
- Spacing uses t-shirt sizing: `$spacing-{2xs|xs|sm|md|lg|xl|2xl|3xl|4xl}`
- Typography tokens encode full style: `$typography-{category}-{size}-{weight}`
- Responsive tokens available for desktop/mobile: `Responsive/Desktop.*` and `Responsive/Mobile.*`
- Border radius options: `$radius-{square|sm|md|full}`
- Elevation follows Material Design principles: `$elevation-{sharp|primary-button}-{sm|md|lg|xl}`

## Troubleshooting

**Missing tokens in Figma:**

- Check if using hard-coded values instead of variables
- Verify token collection is published
- Use `get_variable_defs` to inspect available tokens

**Token mapping unclear:**

- Consult `references/token-mapping.md` for full token catalog
- Check primitive values in `Primitives` collection
- Verify semantic token aliases in `Tokens` collection

**React Aria integration issues:**

- Review component patterns in references
- Ensure proper ref forwarding
- Check ARIA attributes are spreading correctly

**SCSS compilation errors:**

- Verify import path: `@import '~build/scss/tokens'`
- Check token variable names match exactly
- Ensure no typos in BEM class names
