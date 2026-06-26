# React Component Patterns

This document provides proven patterns for implementing React components with design tokens, React Aria, and accessibility best practices.

## General Component Structure

All components follow this structure:

```tsx
import React from 'react';
import { useComponentHook } from 'react-aria';
import type { AriaComponentProps } from 'react-aria';
import './ComponentName.scss';

interface ComponentNameProps extends AriaComponentProps {
  // Component-specific props
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  // ... other props
}

export const ComponentName = ({
  size = 'md',
  variant = 'primary',
  ...ariaProps
}: ComponentNameProps) => {
  const ref = React.useRef(null);
  const { componentProps } = useComponentHook(ariaProps, ref);

  return (
    <element
      {...componentProps}
      ref={ref}
      className={`component-name component-name--${size} component-name--${variant}`}
    >
      {/* Component content */}
    </element>
  );
};
```

## Button Patterns

### Primary Button

```tsx
import React from 'react';
import { useButton } from 'react-aria';
import type { AriaButtonProps } from 'react-aria';
import './Button.scss';

interface ButtonProps extends AriaButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'destructive';
  isDisabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const Button = ({
  size = 'md',
  variant = 'primary',
  isDisabled = false,
  icon,
  iconPosition = 'left',
  children,
  ...ariaProps
}: ButtonProps) => {
  const ref = React.useRef(null);
  const { buttonProps } = useButton(
    { ...ariaProps, isDisabled },
    ref
  );

  return (
    <button
      {...buttonProps}
      ref={ref}
      className={`
        button 
        button--${size} 
        button--${variant}
        ${icon ? 'button--with-icon' : ''}
      `.trim()}
      disabled={isDisabled}
    >
      {icon && iconPosition === 'left' && (
        <span className="button__icon button__icon--left">{icon}</span>
      )}
      <span className="button__text">{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="button__icon button__icon--right">{icon}</span>
      )}
    </button>
  );
};
```

**SCSS:**
```scss
@import '~build/scss/tokens';

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s;
  font-family: $font-family-secondary;
  font-weight: $font-weight-medium;
  line-height: 1;
  
  &:focus-visible {
    outline: none;
    box-shadow: $focus-accent;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 1; // Maintain full opacity, use token colors for disabled state
  }
  
  // Primary variant
  &--primary {
    background-color: $color-buttons-primary-default;
    color: $color-text-default-primary-inverted;
    box-shadow: $elevation-primary-button;
    
    &:hover:not(:disabled) {
      background-color: $color-buttons-primary-hovered;
    }
    
    &:active:not(:disabled) {
      background-color: $color-buttons-primary-pressed;
    }
    
    &:disabled {
      background-color: $color-buttons-primary-disabled;
      box-shadow: none;
    }
  }
  
  // Secondary variant
  &--secondary {
    background-color: $color-buttons-secondary-default;
    color: $color-text-accent-default;
    border: 1px solid $color-border-button-default;
    
    &:hover:not(:disabled) {
      background-color: $color-buttons-secondary-hovered;
      border-color: $color-border-button-hovered;
    }
    
    &:active:not(:disabled) {
      background-color: $color-buttons-secondary-pressed;
      border-color: $color-border-button-pressed;
    }
    
    &:disabled {
      background-color: $color-buttons-secondary-disabled;
      border-color: $color-border-button-disabled;
      color: $color-text-default-disabled;
    }
  }
  
  // Destructive variant
  &--destructive {
    background-color: $color-buttons-destructive-default;
    color: $color-text-default-primary-inverted;
    
    &:hover:not(:disabled) {
      background-color: $color-buttons-destructive-hovered;
    }
    
    &:active:not(:disabled) {
      background-color: $color-buttons-destructive-pressed;
    }
  }
  
  // Size variants
  &--sm {
    height: $size-height-sm;
    padding-inline: $spacing-sm;
    font-size: 14px; // From typography token
    min-width: $size-width-button-mw-sm;
  }
  
  &--md {
    height: $size-height-md;
    padding-inline: $spacing-md;
    font-size: 16px; // From typography token
    min-width: $size-width-button-mw-sm;
  }
  
  &--lg {
    height: $size-height-lg;
    padding-inline: $spacing-lg;
    font-size: 16px; // From typography token
    min-width: $size-width-button-mw-lg;
  }
  
  // Icon positioning
  &__icon {
    display: inline-flex;
    align-items: center;
    
    svg {
      width: $size-height-icon-sm;
      height: $size-height-icon-sm;
    }
  }
  
  &--with-icon {
    &.button--sm .button__icon svg {
      width: $size-height-icon-xs;
      height: $size-height-icon-xs;
    }
    
    &.button--lg .button__icon svg {
      width: $size-height-icon-md;
      height: $size-height-icon-md;
    }
  }
}
```

## Input Field Pattern

```tsx
import React from 'react';
import { useTextField } from 'react-aria';
import type { AriaTextFieldProps } from 'react-aria';
import './TextField.scss';

interface TextFieldProps extends AriaTextFieldProps {
  label: string;
  errorMessage?: string;
  description?: string;
}

export const TextField = ({
  label,
  errorMessage,
  description,
  ...ariaProps
}: TextFieldProps) => {
  const ref = React.useRef(null);
  const { labelProps, inputProps, descriptionProps, errorMessageProps } = 
    useTextField(ariaProps, ref);

  const hasError = !!errorMessage;

  return (
    <div className="text-field">
      <label {...labelProps} className="text-field__label">
        {label}
      </label>
      {description && (
        <div {...descriptionProps} className="text-field__description">
          {description}
        </div>
      )}
      <input
        {...inputProps}
        ref={ref}
        className={`text-field__input ${hasError ? 'text-field__input--error' : ''}`}
      />
      {hasError && (
        <div {...errorMessageProps} className="text-field__error">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
```

**SCSS:**
```scss
@import '~build/scss/tokens';

.text-field {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  
  &__label {
    font-size: 14px;
    font-weight: $font-weight-medium;
    color: $color-text-default-primary;
  }
  
  &__description {
    font-size: 14px;
    color: $color-text-default-secondary;
  }
  
  &__input {
    height: $size-height-md;
    padding: $spacing-sm $spacing-md;
    border: 1px solid $color-border-input-default;
    border-radius: $radius-md;
    font-size: 16px;
    font-family: $font-family-secondary;
    color: $color-text-default-primary;
    background-color: $color-surface-primary;
    transition: border-color 0.2s, box-shadow 0.2s;
    
    &::placeholder {
      color: $color-text-default-disabled;
    }
    
    &:hover:not(:disabled) {
      border-color: $color-border-input-hover;
    }
    
    &:focus {
      outline: none;
      border-color: $color-border-input-active;
      box-shadow: $focus-accent;
    }
    
    &:disabled {
      background-color: $color-surface-interactive-disabled;
      border-color: $color-border-input-disabled;
      color: $color-text-default-disabled;
      cursor: not-allowed;
    }
    
    &--error {
      border-color: $color-border-input-error;
      
      &:focus {
        box-shadow: $focus-error;
      }
    }
  }
  
  &__error {
    font-size: 14px;
    color: $color-text-error-default;
  }
}
```

## Checkbox Pattern

```tsx
import React from 'react';
import { useCheckbox } from 'react-aria';
import { useToggleState } from 'react-stately';
import type { AriaCheckboxProps } from 'react-aria';
import './Checkbox.scss';

interface CheckboxProps extends AriaCheckboxProps {
  label: string;
}

export const Checkbox = ({ label, ...ariaProps }: CheckboxProps) => {
  const ref = React.useRef(null);
  const state = useToggleState(ariaProps);
  const { inputProps } = useCheckbox(ariaProps, state, ref);

  return (
    <label className="checkbox">
      <input {...inputProps} ref={ref} className="checkbox__input" />
      <span className="checkbox__box">
        {state.isSelected && (
          <svg viewBox="0 0 16 16" className="checkbox__check">
            <path
              d="M3 8l3 3 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="checkbox__label">{label}</span>
    </label>
  );
};
```

**SCSS:**
```scss
@import '~build/scss/tokens';

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  
  &__input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
    
    &:focus-visible + .checkbox__box {
      box-shadow: $focus-accent;
    }
    
    &:disabled ~ .checkbox__box {
      background-color: $color-surface-interactive-disabled;
      border-color: $color-border-input-disabled;
      cursor: not-allowed;
    }
    
    &:disabled ~ .checkbox__label {
      color: $color-text-default-disabled;
      cursor: not-allowed;
    }
  }
  
  &__box {
    position: relative;
    width: 20px;
    height: 20px;
    border: 1px solid $color-border-input-default;
    border-radius: $radius-sm;
    background-color: $color-surface-primary;
    transition: all 0.2s;
    
    .checkbox__input:checked ~ & {
      background-color: $color-buttons-primary-default;
      border-color: $color-buttons-primary-default;
    }
    
    .checkbox__input:hover:not(:disabled) ~ & {
      border-color: $color-border-input-hover;
    }
  }
  
  &__check {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    color: $color-text-default-primary-inverted;
  }
  
  &__label {
    font-size: 16px;
    color: $color-text-default-primary;
  }
}
```

## Select/Dropdown Pattern

```tsx
import React from 'react';
import { useSelect } from 'react-aria';
import { useSelectState } from 'react-stately';
import type { AriaSelectProps } from 'react-aria';
import './Select.scss';

interface SelectProps<T> extends AriaSelectProps<T> {
  label: string;
}

export function Select<T extends object>({ 
  label, 
  ...ariaProps 
}: SelectProps<T>) {
  const ref = React.useRef(null);
  const state = useSelectState(ariaProps);
  const {
    labelProps,
    triggerProps,
    valueProps,
    menuProps,
  } = useSelect(ariaProps, state, ref);

  return (
    <div className="select">
      <label {...labelProps} className="select__label">
        {label}
      </label>
      <button
        {...triggerProps}
        ref={ref}
        className="select__trigger"
      >
        <span {...valueProps} className="select__value">
          {state.selectedItem?.rendered || 'Select an option'}
        </span>
        <span className="select__arrow">▼</span>
      </button>
      {state.isOpen && (
        <div className="select__menu">
          {/* Menu items would go here using useListBox and useOption */}
        </div>
      )}
    </div>
  );
}
```

## Card Pattern (Interactive)

```tsx
import React from 'react';
import { useFocusRing } from 'react-aria';
import './Card.scss';

interface CardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  href?: string;
}

export const Card = ({
  title,
  description,
  children,
  onClick,
  href,
}: CardProps) => {
  const { isFocusVisible, focusProps } = useFocusRing();
  const isInteractive = !!(onClick || href);
  
  const Element = href ? 'a' : onClick ? 'button' : 'div';
  
  return (
    <Element
      {...(isInteractive ? focusProps : {})}
      onClick={onClick}
      href={href}
      className={`
        card 
        ${isInteractive ? 'card--interactive' : ''}
        ${isFocusVisible ? 'card--focus-visible' : ''}
      `.trim()}
    >
      <h3 className="card__title">{title}</h3>
      {description && (
        <p className="card__description">{description}</p>
      )}
      {children && (
        <div className="card__content">{children}</div>
      )}
    </Element>
  );
};
```

**SCSS:**
```scss
@import '~build/scss/tokens';

.card {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-lg;
  background-color: $color-surface-primary;
  border-radius: $radius-md;
  box-shadow: $elevation-sharp-md;
  transition: all 0.2s;
  
  &--interactive {
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    border: none;
    text-align: left;
    width: 100%;
    
    &:hover {
      background-color: $color-surface-interactive-hovered;
      box-shadow: $elevation-sharp-lg;
    }
    
    &:active {
      background-color: $color-surface-interactive-selected;
    }
  }
  
  &--focus-visible {
    outline: none;
    box-shadow: $focus-accent, $elevation-sharp-md;
  }
  
  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: $font-weight-medium;
    color: $color-text-default-primary;
  }
  
  &__description {
    margin: 0;
    font-size: 16px;
    color: $color-text-default-secondary;
  }
  
  &__content {
    margin-top: $spacing-sm;
  }
}
```

## Modal/Dialog Pattern

```tsx
import React from 'react';
import { useDialog } from 'react-aria';
import { useOverlayTriggerState } from 'react-stately';
import type { AriaDialogProps } from 'react-aria';
import './Modal.scss';

interface ModalProps extends AriaDialogProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export const Modal = ({
  title,
  children,
  isOpen,
  onClose,
  ...ariaProps
}: ModalProps) => {
  const ref = React.useRef(null);
  const { dialogProps, titleProps } = useDialog(ariaProps, ref);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        {...dialogProps}
        ref={ref}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 {...titleProps} className="modal__title">
            {title}
          </h2>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal__content">{children}</div>
      </div>
    </div>
  );
};
```

**SCSS:**
```scss
@import '~build/scss/tokens';

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: $color-surface-overlay;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: $color-surface-primary;
  border-radius: $radius-md;
  box-shadow: $elevation-sharp-xl;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
  
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-lg;
    border-bottom: 1px solid $color-border-divider-subtle;
  }
  
  &__title {
    margin: 0;
    font-size: 24px;
    font-weight: $font-weight-medium;
    color: $color-text-default-primary;
  }
  
  &__close {
    background: none;
    border: none;
    font-size: 32px;
    cursor: pointer;
    color: $color-text-default-secondary;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    
    &:hover {
      background-color: $color-surface-interactive-hovered;
    }
    
    &:focus-visible {
      outline: none;
      box-shadow: $focus-accent;
    }
  }
  
  &__content {
    padding: $spacing-lg;
  }
}
```

## Accessibility Best Practices

### Focus Management
1. Always use `:focus-visible` instead of `:focus`
2. Provide clear focus indicators using `$focus-*` tokens
3. Never remove outline without providing alternative visual feedback
4. Use `useFocusRing` hook from React Aria for consistent focus styling

### Keyboard Navigation
1. All interactive elements must be keyboard accessible
2. Use React Aria hooks to handle keyboard events correctly
3. Implement proper tab order with logical DOM structure
4. Provide keyboard shortcuts where appropriate (document with aria-keyshortcuts)

### Screen Readers
1. Use semantic HTML elements (button, input, label, etc.)
2. Provide descriptive labels for all form inputs
3. Use aria-label or aria-labelledby when visual labels aren't present
4. Announce state changes with aria-live regions when appropriate

### Color Contrast
1. Use high-contrast tokens for text (`-high-contrast` variants)
2. Test all color combinations meet WCAG AA standards (4.5:1 for normal text)
3. Provide visual indicators beyond color alone
4. Use disabled state tokens that maintain readability

### Component States
Document and implement all states:
- Default
- Hover
- Focus
- Active/Pressed
- Disabled
- Loading (if applicable)
- Error (if applicable)
