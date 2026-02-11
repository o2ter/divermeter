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
import { shiftColor, normalizeColor, getRed, getGreen, getBlue, getAlpha, rgba, toHexString } from '@o2ter/colors.js';

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

  // Derive menu background from primary color
  const menuBackground = shiftColor(theme.colors.primary, -0.85);

  return {
    // Expose theme properties for direct access
    spacing: theme.spacing,
    fontSize: theme.fontSize,
    fontWeight: theme.fontWeight,
    borderRadius: theme.borderRadius,

    // Menu container styles
    menu: {
      background: menuBackground,
      textColor: theme.colorContrast(menuBackground),
      borderColor: withOpacity(theme.colors.secondary, 0.3),
    },
    // Menu item styles and colors
    menuItem: {
      padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.normal,
      activeFontWeight: theme.fontWeight.semibold,
      activeBackground: withOpacity(theme.colors.primary, 0.12),
      hoverBackground: withOpacity(theme.colors.primary, 0.08),
      accentBorder: theme.colors.primary,
      borderWidth: 3,
    },
    // Menu header styles and colors
    menuHeader: {
      padding: `${theme.spacing.sm}px ${theme.spacing.sm}px ${theme.spacing.xs}px ${theme.spacing.sm}px`,
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.semibold,
      letterSpacing: '0.5px',
      textColor: withOpacity(theme.colors.secondary, 0.6),
    },
    // Divider styles and colors
    divider: {
      margin: `${theme.spacing.md}px 0`,
      borderWidth: 1,
      color: withOpacity(theme.colors.secondary, 0.3),
    },
    // List item styles and colors
    listItem: {
      padding: `${theme.spacing.sm + 2}px ${theme.spacing.lg}px`,
      fontSize: theme.fontSize.sm,
      hoverBackground: withOpacity(theme.colors.primary, 0.04),
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
