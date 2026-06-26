# Spec-Driven Component Development Template

## Overview

This document serves as a reusable template for building UI components from Figma Design System using a Spec-Driven Development (SDD) approach with Claude Sonnet 4.5, React, React Aria, and the Figma MCP.

---

## Prerequisites

- [ ] Figma MCP server configured and running
- [ ] VS Code with Claude Sonnet 4.5 integration
- [ ] React and React Aria installed
- [ ] Storybook configured in project
- [ ] SCSS variables available at `~build/scss/`

---

## Development Workflow

### Phase 1: Design Discovery

**Objective:** Extract component specifications from Figma using MCP.

#### Steps:

1. **Identify Component in Figma**
   - Component name: `[COMPONENT_NAME]`
   - Figma file/node ID: `[FIGMA_NODE_ID]`

2. **Extract Component Properties via Figma MCP**

   ```
   Request: Use Figma MCP to retrieve the following for [COMPONENT_NAME]:
   - Component variants and properties
   - Spacing/layout specifications
   - Color tokens and references
   - Typography styles
   - Interactive states (hover, focus, active, disabled)
   - Accessibility requirements
   - DO NOT use raw values or made-up classes, always refer to the SCSS variables in `~build/scss/`

   IMPORTANT - Prop Naming Conventions:
   - Use lowerCamelCase for all prop names (e.g., iconLeading, isDisabled, successLabel)
   - Remove emojis (✏️, 🔄) from Figma property names in code
   - ✏️ emoji = editable text (use children or named props; empty = hidden)
   - 🔄 emoji = swappable instance (use boolean + swap props for icons)
   - Single text element → use 'children' prop
   - Multiple text elements → use named props (title, supportingText, etc.)
   - Reference: src/components/actions/Button/Button.tsx
   ```

3. **Document Extracted Specifications**

   **Visual Properties:**
   - Colors: `[List color tokens from Figma]`
   - Typography: `[Font family, sizes, weights]`
   - Spacing: `[Padding, margins, gaps]`
   - Border radius: `[Values]`
   - Shadows/effects: `[If applicable]`

   **Component Variants:**
   - Variant 1: `[name]` - `[description]`
   - Variant 2: `[name]` - `[description]`

   **Interactive States:**
   ⚠️ IMPORTANT: The states listed below are EXAMPLES ONLY. Build component props based on what you extract from the Figma MCP. Not all components follow this exact structure. Always read the component properties directly from Figma via MCP to write the React code and props accurately.

   Common states (for reference, not prescriptive):
   - Default
   - Hover
   - Focus
   - Active
   - Disabled (often treated as a boolean prop)
   - Loading (if applicable - often treated as a boolean prop)

   **Reference Example:** See `instructions/component-documentation/button/button-props.md` for a complete example of how to document component props extracted from Figma.

   **Icons and Assets:**
   - DO NOT "code" SVGs inline - always use existing icon files from `assets/icons/`
   - Available icon categories: `base/`, `consumables/`, `custom/`, `filled/`, `graphic/`, `social/`, `flags/`
   - For components with image fills: Use `assets/imgs/img-placeholder-square.jpg` as default placeholder
   - If user provides a specific image file or URL, use that instead
   - Add Storybook props for image/video URLs ONLY if component contains layers with image or video fills

   **Accessibility Requirements:**
   - React ARIA attributes needed
   - Keyboard navigation support
   - Screen reader considerations

---

### Phase 2: Technical Specification

**Objective:** Define the component API and implementation approach.

#### SCSS Variable Mapping

Map Figma tokens to existing SCSS variables in `~build/scss/`:

```scss
// Example mapping
$component-primary-color: $brand-primary;
$component-spacing-medium: $spacing-4;
$component-border-radius: $radius-medium;
// ... additional mappings
```

#### React Aria Integration

**Selected React Aria Hook:** `[e.g., useButton, useTextField, useSelect]`

**Rationale:** `[Why this hook provides the needed accessibility and interaction patterns]`

---

### Phase 3: Implementation Specification

**Objective:** Create implementation plan with clear acceptance criteria.

#### File Structure

```
src/
  components/
    [ComponentName]/
      [ComponentName].tsx
      [ComponentName].module.scss
      index.ts
stories/
  components/
    [ComponentName].stories.tsx
```

#### Implementation Requirements

1. **Component Structure**
   - Use React functional component with TypeScript
   - Implement React Aria hook for accessibility
   - Support all variants defined in Figma
   - Handle all interactive states

2. **Styling Requirements**
   - Import SCSS variables from `~build/scss/`
   - Use CSS modules for component-scoped styles
   - Implement responsive behavior if defined in Figma
   - Support theming through SCSS variables

3. **Accessibility Requirements**
   - Keyboard navigation support
   - Proper ARIA attributes via React Aria
   - Focus management
   - Screen reader compatibility
   - Minimum touch target size (44x44px)

4. **Acceptance Criteria**
   - [ ] Component matches Figma design pixel-perfect (within 2px tolerance)
   - [ ] All variants render correctly
   - [ ] All interactive states work as expected
   - [ ] Keyboard navigation functions properly
   - [ ] Screen reader announces component correctly
   - [ ] Component passes accessibility audit
   - [ ] Storybook story includes all variants and states
   - [ ] TypeScript types are properly defined
   - [ ] Component is properly exported

---

### Phase 4: Implementation

**Objective:** Build the component following the specification.

#### Implementation Prompt for Claude Sonnet 4.5

```
Using the specifications above, implement the [ComponentName] component with:

1. Use Figma MCP to retrieve detailed design specifications for [COMPONENT_NAME]
2. Create [ComponentName].tsx with:
   - TypeScript interface matching the API spec
   - React Aria hook implementation ([HOOK_NAME])
   - All variants and states from Figma
   - Proper prop handling and defaults

3. Create [ComponentName].module.scss with:
   - Import SCSS variables from ~build/scss/
   - Styles for all variants
   - Styles for all interactive states
   - Responsive styles if needed

4. Create index.ts for clean exports

5. Ensure accessibility:
   - Keyboard navigation
   - ARIA attributes via React Aria
   - Focus management
   - Semantic HTML
```

---

### Phase 5: Storybook Documentation

**Objective:** Create comprehensive Storybook stories for component documentation and testing.

#### Story Requirements

**Location:** `~stories/components/[ComponentName].stories.tsx`

**Story Structure:**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { [ComponentName] } from '@/components/[ComponentName]';

const meta: Meta<typeof [ComponentName]> = {
  title: 'Components/[ComponentName]',
  component: [ComponentName],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Define controls for each prop
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Stories to include:
// - Default
// - All variants
// - All sizes
// - Interactive states
// - Disabled state
// - Loading state (if applicable)
// - With custom content
// - Accessibility testing story
```

#### Storybook Story Prompt for Claude Sonnet 4.5

```
Create a comprehensive Storybook story file at ~stories/components/[ComponentName].stories.tsx that includes:

1. All component variants from Figma
2. All size options
3. All interactive states
4. Examples with different content
5. Accessibility testing story
6. Proper TypeScript types
7. ArgTypes for interactive controls
8. Documentation in JSDoc format
```

---

## Quality Checklist

Before marking component as complete:

- [ ] Figma design specifications extracted via MCP
- [ ] Component implements all Figma variants
- [ ] SCSS variables correctly imported from `~build/scss/`
- [ ] React Aria integration implemented
- [ ] All interactive states working
- [ ] TypeScript types properly defined
- [ ] Component is fully accessible
- [ ] Storybook story created at `~stories/components/`
- [ ] All acceptance criteria met
- [ ] Component tested in isolation
- [ ] Documentation is complete

---

## Usage Example

To use this template:

1. Copy this document for each new component
2. Fill in the `[PLACEHOLDER]` values with component-specific information
3. Use Figma MCP to extract design specifications
4. Follow each phase sequentially
5. Provide prompts to Claude Sonnet 4.5 as specified
6. Validate against the quality checklist

---

## Notes

- Always verify SCSS variable names in `~build/scss/` before mapping
- Test component in both light and dark themes if applicable
- Consider edge cases (long text, empty states, etc.)
- Document any deviations from Figma design with rationale
- Update this template as team processes evolve
