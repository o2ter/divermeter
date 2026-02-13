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
import { PropsWithChildren, useMemo, useState, ComponentType } from 'frosty';
import { useTheme } from '../theme';
import { shadeColor, tintColor } from '@o2ter/colors.js';

type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';

export type ButtonProps = PropsWithChildren<{
  // Appearance
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  fullWidth?: boolean;
  
  // State
  disabled?: boolean;
  loading?: boolean;
  
  // Icons
  leftIcon?: ComponentType<{ style?: any }>;
  rightIcon?: ComponentType<{ style?: any }>;
  
  // Events
  onClick?: (e: MouseEvent) => void;
  onMouseDown?: (e: MouseEvent) => void;
  onMouseUp?: (e: MouseEvent) => void;
  
  // HTML attributes
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  className?: string;
  style?: any;
}>;

export const Button = ({
  children,
  variant = 'solid',
  color = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onClick,
  onMouseDown,
  onMouseUp,
  type = 'button',
  ariaLabel,
  className,
  style: customStyle,
}: ButtonProps) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Get color from theme
  const baseColor = useMemo(() => {
    return _.get(theme.colors, color) as string;
  }, [theme.colors, color]);

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

  // Calculate variant-specific styles
  const variantStyles = useMemo(() => {
    const contrastColor = theme.colorContrast(baseColor);
    
    switch (variant) {
      case 'outline':
        return {
          default: {
            backgroundColor: 'transparent',
            color: baseColor,
            borderColor: baseColor,
            borderWidth: 1,
            borderStyle: 'solid' as const,
          },
          hover: {
            backgroundColor: tintColor(baseColor, 0.9),
            color: baseColor,
            borderColor: baseColor,
          },
          active: {
            backgroundColor: tintColor(baseColor, 0.8),
            color: baseColor,
            borderColor: shadeColor(baseColor, 0.2),
          },
        };
      
      case 'ghost':
        return {
          default: {
            backgroundColor: 'transparent',
            color: baseColor,
            borderWidth: 0,
          },
          hover: {
            backgroundColor: tintColor(baseColor, 0.9),
            color: baseColor,
          },
          active: {
            backgroundColor: tintColor(baseColor, 0.85),
            color: baseColor,
          },
        };
      
      case 'link':
        return {
          default: {
            backgroundColor: 'transparent',
            color: baseColor,
            borderWidth: 0,
            textDecoration: 'underline',
          },
          hover: {
            backgroundColor: 'transparent',
            color: shadeColor(baseColor, 0.2),
            textDecoration: 'underline',
          },
          active: {
            backgroundColor: 'transparent',
            color: shadeColor(baseColor, 0.3),
            textDecoration: 'underline',
          },
        };
      
      case 'solid':
      default:
        return {
          default: {
            backgroundColor: baseColor,
            color: contrastColor,
            borderWidth: 0,
          },
          hover: {
            backgroundColor: shadeColor(baseColor, 0.15),
            color: contrastColor,
          },
          active: {
            backgroundColor: shadeColor(baseColor, 0.25),
            color: contrastColor,
          },
        };
    }
  }, [variant, baseColor, theme]);

  // Compute final styles based on state
  const buttonStyles = useMemo(() => {
    const base = {
      ...sizeStyles,
      ...variantStyles.default,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      fontWeight: theme.fontWeight.medium,
      borderRadius: theme.borderRadius.md,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease-in-out',
      outline: 'none',
      userSelect: 'none' as const,
      textDecoration: variant === 'link' ? 'underline' : 'none',
      width: fullWidth ? '100%' : 'auto',
      fontFamily: 'inherit',
    };

    if (disabled || loading) {
      return {
        ...base,
        opacity: 0.5,
        cursor: 'not-allowed',
      };
    }

    if (isPressed) {
      return {
        ...base,
        ...variantStyles.active,
        transform: variant !== 'link' ? 'scale(0.98)' : 'none',
      };
    }

    if (isHovered) {
      return {
        ...base,
        ...variantStyles.hover,
      };
    }

    return base;
  }, [
    sizeStyles,
    variantStyles,
    theme,
    disabled,
    loading,
    isHovered,
    isPressed,
    fullWidth,
    variant,
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

  const handleClick = (e: MouseEvent) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (disabled || loading) return;
    setIsPressed(true);
    onMouseDown?.(e);
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (disabled || loading) return;
    setIsPressed(false);
    onMouseUp?.(e);
  };

  const handleMouseEnter = () => {
    if (disabled || loading) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={disabled}
      className={className}
      style={{ ...buttonStyles, ...customStyle }}
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