//
//  index.tsx
//
//  The MIT License
//  Copyright (c) 2021 - 2025 O2ter Limited. All rights reserved.
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

const MenuItem = ({
  label,
  isActive,
  onClick
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  const theme = useTheme();
  return (
    <div
      style={{
        padding: theme.menuItem.padding,
        cursor: 'pointer',
        fontSize: `${theme.menuItem.fontSize}px`,
        fontWeight: isActive ? theme.menuItem.activeFontWeight : theme.menuItem.fontWeight,
        backgroundColor: isActive ? theme.colors.activeBackground : 'transparent',
        borderLeft: isActive ? `${theme.menuItem.borderWidth}px solid ${theme.colors.accentBorder}` : `${theme.menuItem.borderWidth}px solid transparent`,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: theme.colors.hoverBackground,
        },
      }}
      onClick={onClick}
    >
      {label}
    </div>
  );
};

const SchemaList = () => {
  const theme = useTheme();
  const location = useLocation();
  const schema = useProtoSchema();
  const selected = match('/classes/:schema')(location.pathname) || undefined;

  return (
    <div style={{ paddingLeft: `${theme.spacing.sm}px` }}>
      <div
        style={{
          padding: theme.menuHeader.padding,
          fontSize: `${theme.menuHeader.fontSize}px`,
          fontWeight: theme.menuHeader.fontWeight,
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: theme.menuHeader.letterSpacing,
        }}
      >
        Classes
      </div>
      {_.map(_.keys(schema).sort(), (key) => (
        <div
          key={key}
          style={{
            padding: theme.listItem.padding,
            cursor: 'pointer',
            fontSize: `${theme.listItem.fontSize}px`,
            backgroundColor: selected?.params.schema === key ? theme.colors.activeBackground : 'transparent',
            borderLeft: selected?.params.schema === key ? `${theme.menuItem.borderWidth}px solid ${theme.colors.accentBorder}` : `${theme.menuItem.borderWidth}px solid transparent`,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: theme.colors.hoverBackground,
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
  const theme = useTheme();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isConfig = location.pathname === '/config';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: theme.colors.menuBackground,
      borderRight: `1px solid ${theme.colors.borderColor}`,
    }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <MenuItem
          label="Dashboard"
          isActive={isHome}
          onClick={() => location.pushState({}, '/')}
        />

        <div style={{
          margin: theme.divider.margin,
          borderTop: `${theme.divider.borderWidth}px solid ${theme.colors.divider}`,
        }} />

        <SchemaList />

        <div style={{
          margin: theme.divider.margin,
          borderTop: `${theme.divider.borderWidth}px solid ${theme.colors.divider}`,
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
