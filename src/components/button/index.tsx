//
//  index.tsx
//
//  The MIT License
//  Copyright (c) 2021 - 2026 O2ter Limited. All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

import _ from 'lodash';
import { useMemo, useState, ComponentType, ComponentProps } from 'frosty';
import { useStyle } from '../style';

type ButtonVariant = 'solid' | 'subtle' | 'outline' | 'ghost' | 'link' | 'unstyled';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';

type ButtonState = {
  hovered: boolean;
  pressed: boolean;
  focused: boolean;
};

export type ButtonProps = ComponentProps<'button'> & {
  // Appearance
  variant?: ButtonVariant;
  color?: ButtonColor | (string & {});
  size?: ButtonSize;
  fullWidth?: boolean;
  
  // State
  loading?: boolean;
  activated?: boolean;
  
  // Icons
  leftIcon?: ComponentType<{ style?: any }>;
  rightIcon?: ComponentType<{ style?: any }>;
};

export const Button = ({
  children,
  variant = 'solid',
  color = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  activated,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  type = 'button',
  className,
  style: customStyle,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onFocus,
  onBlur,
  ...props
}: ButtonProps) => {
  const style = useStyle();

  // Track interactive state
  const [state, setState] = useState<ButtonState>({
    hovered: false,
    pressed: false,
    focused: false
  });

  // Determine if button is activated
  const isActivated = activated || state.hovered || state.pressed || (_.isNil(activated) && state.focused);

  // Get size-specific styles from pre-calculated values
  const sizeStyles = style.button.sizes[size];

  // Get button colors
  const colors = useMemo(() => {
    // Check if color is a semantic color
    const semanticColor = color as ButtonColor;

    if (semanticColor in style.button.colors) {
      // Use pre-calculated colors
      const colorSet = style.button.colors[semanticColor];
      return isActivated ? colorSet.activated[variant] : colorSet.base[variant];
    } else {
      // For custom colors, generate on the fly
      const colorSet = style.button.getVariantColors(color);
      return isActivated ? colorSet.activated[variant] : colorSet.base[variant];
    }
  }, [color, variant, isActivated, style]);

  // Compute final styles
  const buttonStyles = useMemo(() => {
    const base = {
      // Reset browser default button styles
      margin: 0,
      padding: 0,
      border: 'none',
      background: 'none',
      appearance: 'none' as const,
      WebkitAppearance: 'none' as const,
      MozAppearance: 'none' as const,

      // Layout
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row' as const,
      gap: style.spacing.sm,
      textAlign: 'center' as const,

      // Size
      paddingTop: sizeStyles.paddingTop,
      paddingBottom: sizeStyles.paddingBottom,
      paddingLeft: sizeStyles.paddingLeft,
      paddingRight: sizeStyles.paddingRight,
      width: fullWidth ? '100%' : 'auto',
      minHeight: sizeStyles.minHeight,

      // Typography
      fontSize: sizeStyles.fontSize,
      fontWeight: style.fontWeight.medium,
      fontFamily: 'inherit',
      lineHeight: 1.5,

      // Colors
      color: colors.color,
      backgroundColor: colors.backgroundColor,

      // Border
      ...(colors.borderColor !== 'transparent' && {
        borderWidth: 1,
        borderStyle: 'solid' as const,
        borderColor: colors.borderColor,
      }),

      // Border radius (not for unstyled variant)
      ...(variant !== 'unstyled' && {
        borderRadius: style.borderRadius.md,
      }),

      // Text decoration for link variant
      ...(variant === 'link' && isActivated && {
        textDecoration: 'underline',
      }),
      ...(variant === 'link' && !isActivated && {
        textDecoration: 'none',
      }),

      // Opacity for unstyled variant
      ...(variant !== 'unstyled' && {
        opacity: disabled ? 0.65 : 1,
      }),

      // Interaction
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.15s ease-in-out',
      outline: 'none',
      userSelect: 'none' as const,
    };

    return base;
  }, [
    sizeStyles,
    colors,
    style,
    disabled,
    loading,
    fullWidth,
    variant,
    isActivated,
  ]);

  // Icon size from pre-calculated values
  const iconSize = sizeStyles.iconSize;

  const iconStyle = useMemo(() => ({
    width: iconSize,
    height: iconSize,
    flexShrink: 0,
  }), [iconSize]);

  return (
    <button
      type={type}
      disabled={disabled || loading}
      ariaBusy={loading ? 'true' : undefined}
      ariaDisabled={disabled ? 'true' : undefined}
      className={className}
      style={{ ...buttonStyles, ...customStyle }}
      onMouseEnter={(e) => {
        setState(s => ({ ...s, hovered: true }));
        if (onMouseEnter) onMouseEnter.call(e.currentTarget, e);
      }}
      onMouseLeave={(e) => {
        setState(s => ({ ...s, hovered: false }));
        if (onMouseLeave) onMouseLeave.call(e.currentTarget, e);
      }}
      onMouseDown={(e) => {
        setState(s => ({ ...s, pressed: true }));
        if (onMouseDown) onMouseDown.call(e.currentTarget, e);
      }}
      onMouseUp={(e) => {
        setState(s => ({ ...s, pressed: false }));
        if (onMouseUp) onMouseUp.call(e.currentTarget, e);
      }}
      onFocus={(e) => {
        setState(s => ({ ...s, focused: true }));
        if (onFocus) onFocus.call(e.currentTarget, e);
      }}
      onBlur={(e) => {
        setState(s => ({ ...s, focused: false }));
        if (onBlur) onBlur.call(e.currentTarget, e);
      }}
      {...props}
    >
      {loading && (
        <span style={iconStyle}>
          <LoadingSpinner color={buttonStyles.color} />
        </span>
      )}
      {!loading && LeftIcon && <LeftIcon style={iconStyle} />}
      {children}
      {!loading && RightIcon && <RightIcon style={iconStyle} />}
    </button>
  );
};

// Simple loading spinner component
const LoadingSpinner = ({ color }: { color: string }) => (
  <span style={{
    display: 'block',
    width: '100%',
    height: '100%',
    border: `2px solid transparent`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: '0.6s linear infinite',
    keyframes: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    },
  }} />
);