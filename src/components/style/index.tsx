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

import { createContext, useContext, useMemo, PropsWithChildren } from 'frosty';
import { useTheme } from '../theme';
import { shiftColor, tintColor, shadeColor, mixColor, luminance, normalizeColor, getRed, getGreen, getBlue, rgba, toHexString, colorContrast } from '@o2ter/colors.js';

type MenuStyle = ReturnType<typeof createMenuStyle>;

const StyleContext = createContext<MenuStyle>();

const createMenuStyle = (theme: ReturnType<typeof useTheme>) => {
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

  // Derive complementary color for accents (opposite on color wheel)
  const complement = shiftColor(primary, 0.5);

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

  return {
    // Expose theme properties for direct access
    spacing: theme.spacing,
    fontSize: theme.fontSize,
    fontWeight: theme.fontWeight,
    borderRadius: theme.borderRadius,

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
  };
};

export const StyleProvider = ({ children }: PropsWithChildren<{}>) => {
  const theme = useTheme();
  const style = useMemo(() => createMenuStyle(theme), [theme]);
  
  return (
    <StyleContext value={style}>
      {children}
    </StyleContext>
  );
};

export const useStyle = () => useContext(StyleContext)!;

export default StyleProvider;
