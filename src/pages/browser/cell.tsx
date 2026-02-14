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
import { TObject, TSchema } from '../../proto';
import { useTheme } from '../../components/theme';
import { normalizeColor, getRed, getGreen, getBlue, rgba, toHexString } from '@o2ter/colors.js';

type TableCellProps = {
  item: TObject;
  column: string;
  schema: TSchema;
  isEditing: boolean;
  editingValue?: any;
  setEditingValue?: (value: any) => void;
};

const encodeValue = (value: any, space = 2) => {
  const normalName = /^[a-z_][a-z\d_]\w*$/gi;
  const _encodeValue = (value: any, space: number, padding: number): string => {
    const newline = space ? '\n' : '';
    if (_.isNil(value)) return 'null';
    if (_.isBoolean(value)) return value ? 'true' : 'false';
    if (_.isNumber(value)) return value.toString();
    if (_.isString(value)) return JSON.stringify(value);
    if (_.isDate(value)) return `ISODate('${value.toISOString()}')`;
    if (value instanceof Decimal) return `Decimal('${value.toString()}')`;
    if (_.isArray(value)) return _.isEmpty(value) ? '[]' : `[${newline}${_.map(value, v => (
      `${_.padStart('', padding, ' ')}${_encodeValue(v, space, padding + space)}`
    )).join(`,${newline || ' '}`)}${newline}${_.padStart('', padding - space, ' ')}]`;
    return _.isEmpty(value) ? '{}' : `{${newline}${_.map(value as object, (v, k) => (
      `${_.padStart('', padding, ' ')}${k.match(normalName) ? k : `"${k.replace(/[\\"]/g, '\\$&')}"`}: ${_encodeValue(v, space, padding + space)}`
    )).join(`,${newline || ' '}`)}${newline}${_.padStart('', padding - space, ' ')}}`;
  };
  return _encodeValue(value, space, space);
};

export const TableCell = ({
  item, column, schema, isEditing, editingValue, setEditingValue,
}: TableCellProps) => {
  const theme = useTheme();
  const field = schema.fields[column];
  const isSecure = schema.secureFields?.includes(column);
  const type = _.isString(field) ? field : field.type;

  const cellStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as const;

  const value = item.get(column);

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
            onChange={(e) => setEditingValue?.(e.currentTarget.value)}
            autofocus
          />
        );
      case 'number':
        return (
          <input
            type="number"
            style={inputStyle}
            value={editingValue ?? value ?? ''}
            onChange={(e) => setEditingValue?.(parseFloat(e.currentTarget.value))}
            autofocus
          />
        );
      case 'boolean':
        return (
          <select
            style={inputStyle}
            value={editingValue ?? (value ? 'true' : 'false')}
            onChange={(e) => setEditingValue?.(e.currentTarget.value === 'true')}
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
            onChange={(e) => setEditingValue?.(new Date(e.currentTarget.value))}
            autofocus
          />
        );
      default:
        // For complex types, use textarea with JSON - allow resizing
        return (
          <textarea
            style={{ ...inputStyle, resize: 'both', minHeight: '60px' }}
            value={editingValue !== undefined ? encodeValue(editingValue, 0) : encodeValue(value, 0)}
            onChange={(e) => {
              try {
                // Try to parse the value
                const parsed = eval(`(${e.currentTarget.value})`);
                setEditingValue?.(parsed);
              } catch {
                // If parsing fails, store the raw string
                setEditingValue?.(e.currentTarget.value);
              }
            }}
            autofocus
          />
        );
    }
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
        return <div style={cellStyle}>{value?.toString()}</div>;
      case 'boolean':
        return <div style={cellStyle}>{value ? 'true' : 'false'}</div>;
      case 'date':
        return <div style={cellStyle}>{value?.toLocaleString()}</div>;
      case 'pointer':
        return <div style={cellStyle}>{value?.id}</div>;
      case 'relation':
        return <div style={cellStyle}>{_.map(value, (v: TObject) => v.id).join(', ')}</div>;
      default:
        return <div style={cellStyle}>{encodeValue(value, 0)}</div>;
    }
  }

};
