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
import { useTheme } from '../theme';
import { shadeColor, tintColor, colorContrast, normalizeColor, rgba, getRed, getGreen, getBlue, toHexString } from '@o2ter/colors.js';

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

// Helper to make color transparent
const transparent = (color: string, alpha: number) => {
  const normalized = normalizeColor(color);
  if (!normalized) return color;
  return toHexString(rgba(
    getRed(normalized),
    getGreen(normalized),
    getBlue(normalized),
    Math.round(255 * alpha)
  ), true);
};

// Generate button colors for each variant
const getButtonColors = (color: string, theme: ReturnType<typeof useTheme>) => {
  const contrastColor = theme.colorContrast(color);

  return {
    solid: {
      color: contrastColor,
      backgroundColor: color,
      borderColor: color,
    },
    subtle: {
      color: shadeColor(color, 0.6),
      backgroundColor: tintColor(color, 0.8),
      borderColor: tintColor(color, 0.8),
    },
    outline: {
      color: color,
      backgroundColor: transparent(color, 0),
      borderColor: color,
    },
    link: {
      color: color,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    ghost: {
      color: color,
      backgroundColor: transparent(color, 0),
      borderColor: 'transparent',
    },
    unstyled: {
      color: color,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  };
};

// Generate focused/activated button colors
const getButtonFocusedColors = (color: string, theme: ReturnType<typeof useTheme>) => {
  const contrastColor = theme.colorContrast(color);
  const darkerColor = shadeColor(color, 0.15);

  return {
    solid: {
      color: contrastColor,
      backgroundColor: darkerColor,
      borderColor: darkerColor,
    },
    subtle: {
      color: shadeColor(color, 0.7),
      backgroundColor: tintColor(color, 0.7),
      borderColor: tintColor(color, 0.7),
    },
    outline: {
      color: darkerColor,
      backgroundColor: tintColor(color, 0.9),
      borderColor: darkerColor,
    },
    link: {
      color: darkerColor,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    ghost: {
      color: darkerColor,
      backgroundColor: tintColor(color, 0.9),
      borderColor: 'transparent',
    },
    unstyled: {
      color: darkerColor,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  };
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
  const theme = useTheme();

  // Track interactive state
  const [state, setState] = useState<ButtonState>({
    hovered: false,
    pressed: false,
    focused: false
  });

  // Determine if button is activated
  const isActivated = activated || state.hovered || state.pressed || (_.isNil(activated) && state.focused);

  // Get color from theme
  const baseColor = useMemo(() => _.get(theme.colors, color, color), [theme.colors, color]);

  // Calculate size-specific values
  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          paddingTop: theme.spacing.xs,
          paddingBottom: theme.spacing.xs,
          paddingLeft: theme.spacing.md,
          paddingRight: theme.spacing.md,
          fontSize: theme.fontSize.sm,
          minHeight: 32,
        };
      case 'lg':
        return {
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.md,
          paddingLeft: theme.spacing.xl,
          paddingRight: theme.spacing.xl,
          fontSize: theme.fontSize.lg,
          minHeight: 48,
        };
      case 'md':
      default:
        return {
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.sm,
          paddingLeft: theme.spacing.lg,
          paddingRight: theme.spacing.lg,
          fontSize: theme.fontSize.md,
          minHeight: 40,
        };
    }
  }, [size, theme]);

  // Get button colors for current and activated states
  const colors = useMemo(() => {
    const fromColors = getButtonColors(baseColor, theme);
    const toColors = getButtonFocusedColors(baseColor, theme);
    
    const variantColors = isActivated ? toColors[variant] : fromColors[variant];

    return {
      color: variantColors.color,
      backgroundColor: variantColors.backgroundColor,
      borderColor: variantColors.borderColor,
    };
  }, [baseColor, theme, variant, isActivated]);

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
      gap: theme.spacing.sm,
      textAlign: 'center' as const,

      // Size
      ...sizeStyles,
      width: fullWidth ? '100%' : 'auto',

      // Typography
      fontSize: sizeStyles.fontSize,
      fontWeight: theme.fontWeight.medium,
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
        borderRadius: theme.borderRadius.md,
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
    theme,
    disabled,
    loading,
    fullWidth,
    variant,
    isActivated,
  ]);

  // Icon size based on button size
  const iconSize = useMemo(() => {
    switch (size) {
      case 'sm':
        return 14;
      case 'lg':
        return 20;
      case 'md':
      default:
        return 16;
    }
  }, [size]);

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