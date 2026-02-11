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
import { useProtoSchema } from '../../proto';
import { useLocation } from 'frosty/web';
import { match } from 'path-to-regexp';
import { useStyle } from '../style';

const MenuItem = ({
  label,
  isActive,
  onClick
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  }) => {
  const style = useStyle();
  return (
    <div
      style={{
        padding: style.menuItem.padding,
        cursor: 'pointer',
        fontSize: `${style.menuItem.fontSize}px`,
        fontWeight: isActive ? style.menuItem.activeFontWeight : style.menuItem.fontWeight,
        color: style.menu.textColor,
        backgroundColor: isActive ? style.menuItem.activeBackground : 'transparent',
        borderLeft: isActive ? `${style.menuItem.borderWidth}px solid ${style.menuItem.accentBorder}` : `${style.menuItem.borderWidth}px solid transparent`,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: style.menuItem.hoverBackground,
        },
      }}
      onClick={onClick}
    >
      {label}
    </div>
  );
};

const SchemaList = () => {
  const style = useStyle();
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
          color: style.menuHeader.textColor,
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
            color: style.menu.textColor,
            backgroundColor: selected?.params.schema === key ? style.menuItem.activeBackground : 'transparent',
            borderLeft: selected?.params.schema === key ? `${style.menuItem.borderWidth}px solid ${style.menuItem.accentBorder}` : `${style.menuItem.borderWidth}px solid transparent`,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: style.listItem.hoverBackground,
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
  const style = useStyle();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isConfig = location.pathname === '/config';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: style.menu.background,
      borderRight: `1px solid ${style.menu.borderColor}`,
    }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <MenuItem
          label="Dashboard"
          isActive={isHome}
          onClick={() => location.pushState({}, '/')}
        />

        <div style={{
          margin: style.divider.margin,
          borderTop: `${style.divider.borderWidth}px solid ${style.divider.color}`,
        }} />

        <SchemaList />

        <div style={{
          margin: style.divider.margin,
          borderTop: `${style.divider.borderWidth}px solid ${style.divider.color}`,
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
