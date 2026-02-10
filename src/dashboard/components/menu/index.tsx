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
  return (
    <div
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        fontWeight: isActive ? 600 : 400,
        backgroundColor: isActive ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
        borderLeft: isActive ? '3px solid #007AFF' : '3px solid transparent',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
    <div style={{ paddingLeft: '8px' }}>
      <div
        style={{
          padding: '8px 8px 4px 8px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(0, 0, 0, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Classes
      </div>
      {_.map(_.keys(schema).sort(), (key) => (
        <div
          key={key}
          style={{
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            backgroundColor: selected?.params.schema === key ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
            borderLeft: selected?.params.schema === key ? '3px solid #007AFF' : '3px solid transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <MenuItem
          label="Dashboard"
          isActive={isHome}
          onClick={() => location.pushState({}, '/')}
        />

        <div style={{
          margin: '12px 0',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        }} />

        <SchemaList />

        <div style={{
          margin: '12px 0',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
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
