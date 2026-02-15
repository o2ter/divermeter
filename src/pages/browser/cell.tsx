//
//  cell.tsx
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
import { Decimal } from 'proto.io';
import { TObject, TSchema, useProto } from '../../proto';
import { useTheme } from '../../components/theme';
import { normalizeColor, getRed, getGreen, getBlue, rgba, toHexString } from '@o2ter/colors.js';
import { JSCode } from '../../components/jscode';
import { typeOf, encodeValue, decodeValue, verifyValue } from './utils';

type TableCellProps = {
  item?: TObject;
  column: string;
  schema: TSchema;
  isEditing: boolean;
  editingValue?: any;
  setEditingValue?: (value: any) => void;
};

export const TableCell = ({
  item, column, schema, isEditing, editingValue, setEditingValue,
}: TableCellProps) => {
  const theme = useTheme();
  const field = schema.fields[column];
  const isSecure = schema.secureFields?.includes(column);
  const type = typeOf(field);

  const proto = useProto();

  const value = item?.get(column);

  // Helper to create color with opacity
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

  // Get color based on value type
  const getTypeColor = () => {
    if (isSecure || _.isNil(value)) {
      return 'lightgray';
    }
    switch (type) {
      case 'string':
        return 'darkred';
      case 'number':
      case 'decimal':
        return 'mediumblue';
      case 'boolean':
        return 'darkblue';
      case 'date':
        return 'darkslateblue';
      case 'file':
        return 'mediumblue';
      case 'pointer':
      case 'relation':
        return 'rebeccapurple';
      default:
        return 'gray';
    }
  };

  const cellStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: getTypeColor(),
    fontFamily: type === 'string' ? 'inherit' : 'monospace',
  } as const;

  // Editing mode
  if (isEditing) {
    const inputStyle = {
      width: '100%',
      minWidth: '100%',
      height: '100%',
      border: `1px solid ${theme.colors.tint}`,
      outline: 'none',
      padding: theme.spacing.xs,
      margin: 0,
      fontSize: 'inherit',
      fontFamily: 'inherit',
      backgroundColor: '#ffffff',
      boxShadow: `0 0 0 3px ${withOpacity(theme.colors.tint, 0.1)}`,
      borderRadius: theme.borderRadius.sm,
      overflow: 'visible',
    };

    switch (type) {
      case 'string':
        return (
          <input
            type="text"
            style={inputStyle}
            value={editingValue ?? value ?? ''}
            onInput={(e) => setEditingValue?.(e.currentTarget.value)}
            autofocus
          />
        );
      case 'number':
        return (
          <input
            type="number"
            style={inputStyle}
            value={editingValue ?? value ?? ''}
            onInput={(e) => setEditingValue?.(parseFloat(e.currentTarget.value))}
            autofocus
          />
        );
      case 'decimal':
        return (
          <input
            type="number"
            style={inputStyle}
            value={editingValue ?? value ?? ''}
            onInput={(e) => setEditingValue?.(Decimal(e.currentTarget.value))}
            autofocus
          />
        );
      case 'boolean':
        return (
          <select
            style={inputStyle}
            value={editingValue ?? (value ? 'true' : 'false')}
            onInput={(e) => setEditingValue?.(e.currentTarget.value === 'true')}
            autofocus
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );
      case 'date':
        return (
          <input
            type="datetime-local"
            style={inputStyle}
            value={editingValue ? new Date(editingValue).toISOString().slice(0, 16) : (value ? new Date(value).toISOString().slice(0, 16) : '')}
            onInput={(e) => setEditingValue?.(new Date(e.currentTarget.value))}
            autofocus
          />
        );
      case 'pointer':
        return (
          <input
            type="text"
            style={inputStyle}
            value={editingValue?.id ?? value?.id ?? ''}
            onInput={(e) => {
              if (_.isString(field) || field.type !== 'pointer' || !field.target) return;
              setEditingValue?.(proto.Object(field.target, e.currentTarget.value));
            }}
            autofocus
          />
        );
      default:
        // For complex types, use JSCode component with proper parser
        const displayValue = editingValue !== undefined ? editingValue : value;
        return (
          <div style={{ ...inputStyle, padding: 0, paddingRight: theme.spacing.md, minHeight: '120px', height: '120px', resize: 'both', overflow: 'auto' }}>
            <JSCode
              initialValue={_.isNil(displayValue) ? '' : encodeValue(displayValue, 2)}
              onChangeValue={(text) => {
                try {
                  const parsed = decodeValue(text);
                  verifyValue(parsed);
                  setEditingValue?.(parsed);
                } catch (error) {
                  // Keep the raw text as editing value when parsing fails
                  // This allows the user to continue typing
                  setEditingValue?.(text);
                }
              }}
              autoFocus
            />
          </div>
        );
    }
  }

  if (_.isNil(item)) {
    return <div style={cellStyle} />;
  }

  // Display mode
  if (isSecure) {
    return <div style={cellStyle}>(hidden)</div>;
  }

  if (_.isNil(value)) {
    return <div style={cellStyle}>(null)</div>;
  } else {
    switch (type) {
      case 'string':
        return <div style={cellStyle}>{value}</div>;
      case 'number':
        return <div style={cellStyle}>{value}</div>;
      case 'decimal':
        return <div style={cellStyle}>{value.toString()}</div>;
      case 'boolean':
        return <div style={cellStyle}>{value ? 'true' : 'false'}</div>;
      case 'date':
        return <div style={cellStyle}>{value.toLocaleString()}</div>;
      case 'file':
        return <div style={cellStyle}>{value.filename}</div>;
      case 'pointer':
        return <div style={cellStyle}>{value.id}</div>;
      case 'relation':
        return <div style={cellStyle}>{_.map(value, (v: TObject) => v.id).join(', ')}</div>;
      default:
        return <div style={cellStyle}>{encodeValue(value, 0)}</div>;
    }
  }

};
