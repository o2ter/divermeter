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

import { createContext, useContext, useMemo, PropsWithChildren, ElementNode } from 'frosty';
import { useTheme } from '../theme';
import { shiftColor, tintColor, shadeColor, mixColor, luminance, normalizeColor, getRed, getGreen, getBlue, rgba, toHexString, colorContrast } from '@o2ter/colors.js';

type StyleContextType = ReturnType<typeof createStyles>;

const StyleContext = createContext<StyleContextType>();

const createStyles = (theme: ReturnType<typeof useTheme>) => {
  // Helper to create color with opacity using @o2ter/colors.js
  const withOpacity = (color: string, opacity: number) => {
    const normalized = normalizeColor(color);
    if (!normalized) return color;
    return toHexString(rgba(
      getRed(normalized),
      getGreen(normalized),
      getBlue(normalized),
      Math.round(255 * opacity)
    ), true);
  };

  // Analyze primary color luminance for proper color derivation
  const primaryColor = normalizeColor(theme.colors.primary);
  const primaryLuminance = primaryColor ? luminance(primaryColor) : 0.5;
  const isLight = primaryLuminance > 0.7;
  const isDark = primaryLuminance < 0.3;

  // Create harmonious color palette following color theory
  const primary = theme.colors.primary;

  // Create sophisticated menu background with gradient
  const menuBgBase = isLight
    ? mixColor(primary, '#fafbfc', 0.03)  // Very subtle tint for light colors
    : isDark
      ? mixColor(primary, '#1a1d23', 0.08)  // Dark, rich background
      : mixColor(primary, '#f8f9fa', 0.05); // Neutral mid-tone

  const menuBgGradientStart = menuBgBase;
  const menuBgGradientEnd = isLight
    ? tintColor(menuBgBase, 0.02)
    : isDark
      ? shadeColor(menuBgBase, 0.05)
      : tintColor(menuBgBase, 0.01);

  // Create text colors with proper contrast
  const menuTextPrimary = theme.colorContrast(menuBgBase);
  const menuTextSecondary = withOpacity(menuTextPrimary, 0.65);
  const menuTextMuted = withOpacity(menuTextPrimary, 0.45);

  // Create active and hover states using color theory
  const activeBackground = isLight
    ? mixColor(primary, '#ffffff', 0.85)  // Soft highlight for light themes
    : isDark
      ? mixColor(primary, '#2d3748', 0.7)  // Rich, saturated for dark themes
      : mixColor(primary, '#f0f4f8', 0.75); // Balanced for mid-tones

  const hoverBackground = isLight
    ? withOpacity(primary, 0.06)
    : isDark
      ? withOpacity(tintColor(primary, 0.3), 0.12)
      : withOpacity(primary, 0.08);

  // Create modern accent colors using primary and complement
  const accentPrimary = isLight
    ? shadeColor(primary, 0.1)  // Slightly darker for visibility
    : isDark
      ? tintColor(primary, 0.2)  // Lighter for contrast
      : primary;

  const accentGlow = withOpacity(accentPrimary, 0.4);

  // Active text color with proper contrast against active background
  const activeTextColor = isLight
    ? shadeColor(primary, 0.5)  // Much darker shade for light themes
    : isDark
      ? tintColor(primary, 0.4)  // Lighter tint for dark themes
      : shadeColor(primary, 0.2); // Slightly darker for mid-tones

  // Ensure active text has sufficient contrast - use colorContrast as fallback
  const activeTextFinal = colorContrast(activeBackground, activeTextColor, menuTextPrimary);

  // Modern border colors
  const borderPrimary = withOpacity(menuTextPrimary, 0.08);
  const borderAccent = withOpacity(accentPrimary, 0.3);

  // ========== Button Styles ==========
  // Pre-calculate button variant styles for different colors
  const createButtonVariantColors = (color: string) => {
    const contrastColor = theme.colorContrast(color);
    const darkerColor = shadeColor(color, 0.15);

    return {
      // Base state colors
      base: {
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
          backgroundColor: withOpacity(color, 0),
          borderColor: color,
        },
        link: {
          color: color,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        },
        ghost: {
          color: color,
          backgroundColor: withOpacity(color, 0),
          borderColor: 'transparent',
        },
        unstyled: {
          color: color,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        },
      },
      // Activated state colors
      activated: {
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
      },
    };
  };

  // Pre-calculate button colors for semantic colors
  const buttonColors = {
    primary: createButtonVariantColors(theme.colors.primary),
    secondary: createButtonVariantColors(theme.colors.secondary),
    success: createButtonVariantColors(theme.colors.success),
    info: createButtonVariantColors(theme.colors.info),
    warning: createButtonVariantColors(theme.colors.warning),
    error: createButtonVariantColors(theme.colors.error),
  };

  // Pre-calculate size-specific button styles
  const buttonSizes = {
    sm: {
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.xs,
      paddingLeft: theme.spacing.md,
      paddingRight: theme.spacing.md,
      fontSize: theme.fontSize.sm,
      minHeight: 32,
      iconSize: 14,
    },
    md: {
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      paddingLeft: theme.spacing.lg,
      paddingRight: theme.spacing.lg,
      fontSize: theme.fontSize.md,
      minHeight: 40,
      iconSize: 16,
    },
    lg: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      paddingLeft: theme.spacing.xl,
      paddingRight: theme.spacing.xl,
      fontSize: theme.fontSize.lg,
      minHeight: 48,
      iconSize: 20,
    },
  };

  // ========== Alert Styles ==========
  // Pre-calculate alert background colors with opacity
  const alertBackgrounds = {
    success: withOpacity(theme.colors.success, 0.9),
    info: withOpacity(theme.colors.info, 0.9),
    warning: withOpacity(theme.colors.warning, 0.9),
    error: withOpacity(theme.colors.error, 0.9),
  };

  // Pre-calculate alert text colors
  const alertTextColors = {
    success: theme.colorContrast(theme.colors.success),
    info: theme.colorContrast(theme.colors.info),
    warning: theme.colorContrast(theme.colors.warning),
    error: theme.colorContrast(theme.colors.error),
  };

  // Pre-calculate default alert icons
  const createAlertIcon = (type: 'success' | 'info' | 'warning' | 'error'): ElementNode => {
    const iconSize = 20;
    const iconProps = {
      width: iconSize,
      height: iconSize,
      viewBox: '0 0 20 20',
      fill: 'currentColor',
    };

    switch (type) {
      case 'success':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const alertIcons = {
    success: createAlertIcon('success'),
    info: createAlertIcon('info'),
    warning: createAlertIcon('warning'),
    error: createAlertIcon('error'),
  };

  // ========== Modal Styles ==========
  const modalStyles = {
    backdrop: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: theme.spacing.lg,
    },
    content: {
      borderRadius: theme.borderRadius.lg,
      maxWidth: '90%',
      maxHeight: '90%',
      overflow: 'auto' as const,
    },
  };

  return {
    // Expose theme properties for direct access
    spacing: theme.spacing,
    fontSize: theme.fontSize,
    fontWeight: theme.fontWeight,
    borderRadius: theme.borderRadius,

    // Helper function for custom colors
    withOpacity,

    // Menu container styles with gradient
    menu: {
      background: `linear-gradient(180deg, ${menuBgGradientStart} 0%, ${menuBgGradientEnd} 100%)`,
      textColor: menuTextPrimary,
      borderColor: borderPrimary,
      shadow: isLight
        ? '0 0 0 1px rgba(0, 0, 0, 0.04)'
        : '0 0 0 1px rgba(255, 255, 255, 0.05)',
    },
    // Modern menu item styles
    menuItem: {
      padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
      margin: `${theme.spacing.xs}px ${theme.spacing.md}px`,
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium,
      activeFontWeight: theme.fontWeight.semibold,
      textColor: menuTextPrimary,
      activeTextColor: activeTextFinal,
      activeBackground: activeBackground,
      hoverBackground: hoverBackground,
      accentBorder: accentPrimary,
      accentGlow: accentGlow,
      borderWidth: 0,
      borderRadius: theme.borderRadius.md,
      activeShadow: `0 2px 8px ${accentGlow}, 0 0 0 1px ${borderAccent}`,
      hoverShadow: `0 1px 4px ${withOpacity(menuTextPrimary, 0.08)}`,
    },
    // Menu header with modern typography
    menuHeader: {
      padding: `${theme.spacing.md}px ${theme.spacing.lg}px ${theme.spacing.xs}px`,
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.semibold,
      letterSpacing: '0.8px',
      textColor: menuTextMuted,
    },
    // Subtle modern divider
    divider: {
      margin: `${theme.spacing.lg}px ${theme.spacing.lg}px`,
      height: 1,
      background: `linear-gradient(90deg, transparent 0%, ${borderPrimary} 50%, transparent 100%)`,
    },
    // List item styles
    listItem: {
      padding: `${theme.spacing.sm + 2}px ${theme.spacing.lg}px`,
      margin: `2px ${theme.spacing.md}px`,
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.normal,
      textColor: menuTextSecondary,
      activeTextColor: activeTextFinal,
      hoverBackground: hoverBackground,
      borderRadius: theme.borderRadius.md,
      activeShadow: `0 1px 4px ${accentGlow}, 0 0 0 1px ${borderAccent}`,
    },

    // Button styles
    button: {
      colors: buttonColors,
      sizes: buttonSizes,
      getVariantColors: createButtonVariantColors,
    },

    // Alert styles
    alert: {
      backgrounds: alertBackgrounds,
      textColors: alertTextColors,
      icons: alertIcons,
    },

    // Modal styles
    modal: modalStyles,
  };
};

export const StyleProvider = ({ children }: PropsWithChildren<{}>) => {
  const theme = useTheme();
  const style = useMemo(() => createStyles(theme), [theme]);
  
  return (
    <StyleContext value={style}>
      {children}
    </StyleContext>
  );
};

export const useStyle = () => useContext(StyleContext)!;
