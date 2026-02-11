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
import { useProtoSchema } from '../../../proto';
import { useLocation } from 'frosty/web';
import { match } from 'path-to-regexp';
import { useTheme } from '../theme';
import { useMemo } from 'frosty';
import { shiftColor } from '@o2ter/colors.js';

const useMemuStyle = () => {
  const theme = useTheme();
  return useMemo(() => {

    // Helper to create color with opacity
    const withOpacity = (color: string, opacity: number) => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    // Derive all UI colors from primary and secondary
    const background = '#ffffff';
    const menuBackground = shiftColor(theme.colors.primary, -0.85); // Lighter primary color

    return {
      ...theme,
      colors: {
        // Base colors
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        menuBackground,

        // Interactive states - derived from primary/secondary with opacity
        activeBackground: withOpacity(theme.colors.primary, 0.12),
        hoverBackground: withOpacity(theme.colors.primary, 0.08),

        // Borders and dividers
        borderColor: withOpacity(theme.colors.secondary, 0.3),
        divider: withOpacity(theme.colors.secondary, 0.3),

        // Text colors - automatically contrast with backgrounds
        textSecondary: withOpacity(theme.colorContrast(background), 0.6),
        textOnMenu: theme.colorContrast(menuBackground),

        // Accent uses primary color
        accentBorder: theme.colors.primary,
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
    }
  }, [theme]);
}

const MenuItem = ({
  label,
  isActive,
  onClick
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  }) => {
  const style = useMemuStyle();
  return (
    <div
      style={{
        padding: style.menuItem.padding,
        cursor: 'pointer',
        fontSize: `${style.menuItem.fontSize}px`,
        fontWeight: isActive ? style.menuItem.activeFontWeight : style.menuItem.fontWeight,
        color: style.colors.textOnMenu,
        backgroundColor: isActive ? style.colors.activeBackground : 'transparent',
        borderLeft: isActive ? `${style.menuItem.borderWidth}px solid ${style.colors.accentBorder}` : `${style.menuItem.borderWidth}px solid transparent`,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: style.colors.hoverBackground,
        },
      }}
      onClick={onClick}
    >
      {label}
    </div>
  );
};

const SchemaList = () => {
  const style = useMemuStyle();
  const location = useLocation();
  const schema = useProtoSchema();
  const selected = match('/classes/:schema')(location.pathname) || undefined;

  return (
    <div style={{ paddingLeft: `${style.spacing.sm}px` }}>
      <div
        style={{
          padding: style.menuHeader.padding,
          fontSize: `${style.menuHeader.fontSize}px`,
          fontWeight: style.menuHeader.fontWeight,
          color: style.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: style.menuHeader.letterSpacing,
        }}
      >
        Classes
      </div>
      {_.map(_.keys(schema).sort(), (key) => (
        <div
          key={key}
          style={{
            padding: style.listItem.padding,
            cursor: 'pointer',
            fontSize: `${style.listItem.fontSize}px`,
            color: style.colors.textOnMenu,
            backgroundColor: selected?.params.schema === key ? style.colors.activeBackground : 'transparent',
            borderLeft: selected?.params.schema === key ? `${style.menuItem.borderWidth}px solid ${style.colors.accentBorder}` : `${style.menuItem.borderWidth}px solid transparent`,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: style.colors.hoverBackground,
            },
          }}
          onClick={() => {
            location.pushState({}, `/classes/${key}`);
          }}
        >
          {key}
        </div>
      ))}
    </div>
  );
};

export const Menu = () => {
  const style = useMemuStyle();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isConfig = location.pathname === '/config';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: style.colors.menuBackground,
      borderRight: `1px solid ${style.colors.borderColor}`,
    }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <MenuItem
          label="Dashboard"
          isActive={isHome}
          onClick={() => location.pushState({}, '/')}
        />

        <div style={{
          margin: style.divider.margin,
          borderTop: `${style.divider.borderWidth}px solid ${style.colors.divider}`,
        }} />

        <SchemaList />

        <div style={{
          margin: style.divider.margin,
          borderTop: `${style.divider.borderWidth}px solid ${style.colors.divider}`,
        }} />

        <MenuItem
          label="Config"
          isActive={isConfig}
          onClick={() => location.pushState({}, '/config')}
        />
      </div>
    </div>
  );
};
