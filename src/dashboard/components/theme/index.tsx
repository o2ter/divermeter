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
import { createContext, PropsWithChildren, useContext } from 'frosty';
import { shiftColor } from '@o2ter/colors.js';

const initialStyle = `
:root {
  --font-sans-serif: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-monospace: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

body {
  margin: 0;
  font-family: var(--font-sans-serif);
  background-color: white;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
}

h1 {
  font-weight: 500;
  font-size: 40px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

h2 {
  font-weight: 500;
  font-size: 32px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

h3 {
  font-weight: 500;
  font-size: 28px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

h4 {
  font-weight: 500;
  font-size: 24px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

h5 {
  font-weight: 500;
  font-size: 20px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

h6 {
  font-weight: 500;
  font-size: 16px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

table {
  width: 100%;
  color: #212529;
  vertical-align: top;
  border-collapse: collapse;
  margin-bottom: 16px;
  border-top-color: #dee2e6;
  border-bottom-color: #dee2e6;
  border-left-color: #dee2e6;
  border-right-color: #dee2e6;
}

th {
  text-align: inherit;
}

tbody, td, tfoot, th, thead, tr {
  border-style: solid;
  border-top-color: inherit;
  border-bottom-color: inherit;
  border-left-color: inherit;
  border-right-color: inherit;
  border-top-width: 0;
  border-bottom-width: 0;
  border-left-width: 0;
  border-right-width: 0;
}

table &gt;
thead &gt;
tr &gt;
* {
  border-bottom-color: currentColor;
}

table tr &gt;
* {
  background-color: transparent;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 8px;
  padding-right: 8px;
  border-bottom-width: 1px;
}

table &gt;
tbody {
  vertical-align: inherit;
}

table &gt;
thead {
  vertical-align: bottom;
}

.table-striped tr:nth-of-type(odd) &gt;
* {
  background-color: rgba(0, 0, 0, 0.05);
}

.absolute-fill {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.fixed-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1030;
}

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1030;
}

.sticky-top {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1020;
}

.h1 {
  font-weight: 500;
  font-size: 40px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

.h2 {
  font-weight: 500;
  font-size: 32px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

.h3 {
  font-weight: 500;
  font-size: 28px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

.h4 {
  font-weight: 500;
  font-size: 24px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

.h5 {
  font-weight: 500;
  font-size: 20px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

.h6 {
  font-weight: 500;
  font-size: 16px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}
`;

const defaultTheme = {
  colors: {
    // Core colors - everything else derives from these
    primary: '#1890ff',      // Main brand/accent color
    background: '#ffffff',    // Base background color
    text: '#212529',         // Base text color
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
  },
  borderRadius: {
    sm: 2,
    md: 4,
    lg: 8,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
  },
};

type _ThemeSettings = typeof defaultTheme;

export type ThemeSettings = { [x in keyof _ThemeSettings]?: Partial<_ThemeSettings[x]>; };

const Context = createContext<_ThemeSettings>();

export const ThemeProvider = ({
  theme,
  children,
}: PropsWithChildren<{
  theme?: Partial<_ThemeSettings>;
}>) => {
  const parent = useContext(Context);
  const value = _.merge({}, parent ?? defaultTheme, theme);
  return (
    <Context value={value}>
      {!parent && <head>
        <style>{initialStyle}</style>
      </head>}
      {children}
    </Context>
  );
};

const colorWeights = {
  '100': -0.8,
  '200': -0.6,
  '300': -0.4,
  '400': -0.2,
  '500': 0,
  '600': 0.2,
  '700': 0.4,
  '800': 0.6,
  '900': 0.8,
} as const;

export const useTheme = () => {
  const theme = useContext(Context) ?? defaultTheme;

  // Core colors for generating variants
  const colors = {
    primary: theme.colors.primary,
  } as const;

  // Helper to create color with opacity
  const withOpacity = (color: string, opacity: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Derive all UI colors from the 3 base colors
  const derivedColors = {
    // Base colors
    primary: theme.colors.primary,
    background: theme.colors.background,
    text: theme.colors.text,

    // Derived from background (slightly darker for contrast)
    secondary: shiftColor(theme.colors.background, -0.05),
    menuBackground: shiftColor(theme.colors.background, -0.02),

    // Derived from text (with opacity for subtle effects)
    activeBackground: withOpacity(theme.colors.text, 0.08),
    hoverBackground: withOpacity(theme.colors.text, 0.05),
    borderColor: withOpacity(theme.colors.text, 0.1),
    divider: withOpacity(theme.colors.text, 0.1),

    // Text variations
    textPrimary: theme.colors.text,
    textSecondary: withOpacity(theme.colors.text, 0.5),

    // Accent uses primary color
    accentBorder: theme.colors.primary,
  };

  return {
    ...theme,
    colors: {
      ...derivedColors,
      // Generate primary color variants (100-900)
      ..._.fromPairs(
        _.flatMap(colors, (v, k) => _.map(colorWeights, (s, w) => [`${k}-${w}`, shiftColor(v, s)]))
      ) as Record<`${keyof typeof colors}-${keyof typeof colorWeights}`, string>,
    },
    // Calculated styles for menu items
    menuItem: {
      padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.normal,
      activeFontWeight: theme.fontWeight.semibold,
      borderWidth: 3,
    },
    // Calculated styles for menu header
    menuHeader: {
      padding: `${theme.spacing.sm}px ${theme.spacing.sm}px ${theme.spacing.xs}px ${theme.spacing.sm}px`,
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.semibold,
      letterSpacing: '0.5px',
    },
    // Calculated styles for divider
    divider: {
      margin: `${theme.spacing.md}px 0`,
      borderWidth: 1,
    },
    // List item specific styles
    listItem: {
      padding: `${theme.spacing.sm + 2}px ${theme.spacing.lg}px`,
      fontSize: theme.fontSize.sm,
    },
  };
};
