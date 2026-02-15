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
import { useState, useRef } from 'frosty';
import { useLocation } from 'frosty/web';
import { Decimal } from 'proto.io';
import { TObject, TSchema, useProto } from '../../proto';
import { useTheme } from '../../components/theme';
import { normalizeColor, getRed, getGreen, getBlue, rgba, toHexString } from '@o2ter/colors.js';
import { JSCode } from '../../components/jscode';
import { Modal } from '../../components/modal';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { typeOf, encodeValue, decodeValue, verifyValue } from './utils';

// Helper component: Switch for boolean values
const Switch = ({ checked, onChange, disabled }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) => {
  const theme = useTheme();

  const switchStyle = {
    position: 'relative' as const,
    display: 'inline-block',
    width: 44,
    height: 24,
    backgroundColor: checked ? theme.colors.primary : '#ccc',
    borderRadius: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s ease',
    opacity: disabled ? 0.5 : 1,
  };

  const knobStyle = {
    position: 'absolute' as const,
    top: 2,
    left: checked ? 22 : 2,
    width: 20,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    transition: 'left 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  };

  return (
    <div
      style={switchStyle}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div style={knobStyle} />
    </div>
  );
};

type TableCellProps = {
  item?: TObject;
  column: string;
  schema: TSchema;
  className: string;
  isEditing: boolean;
  editingValue?: any;
  setEditingValue?: (value: any) => void;
};

export const TableCell = ({
  item, column, schema, className, isEditing, editingValue, setEditingValue,
}: TableCellProps) => {
  const theme = useTheme();
  const location = useLocation();

  // Helper to extract field type from dot-notated column names
  const getFieldFromColumn = (column: string) => {
    const parts = column.split('.');
    let currentField = schema.fields[parts[0]];

    // Traverse through nested shape properties
    for (let i = 1; i < parts.length; i++) {
      if (!currentField || _.isString(currentField)) return undefined;
      if (currentField.type !== 'shape' || !currentField.shape) return undefined;
      currentField = currentField.shape[parts[i]];
    }

    return currentField;
  };

  const field = getFieldFromColumn(column);
  const baseField = column.split('.')[0];
  const isSecure = schema.secureFields?.includes(baseField);
  const type = typeOf(field);

  const proto = useProto();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      minWidth: '100%',
      minHeight: '100%',
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

    // Special handling for _id column in empty rows (for adding to relations)
    if (column === '_id' && !item) {
      return (
        <input
          type="text"
          style={inputStyle}
          value={editingValue ?? ''}
          placeholder="Enter object ID to add to relation..."
          onInput={(e) => setEditingValue?.(e.currentTarget.value)}
          autofocus
        />
      );
    }

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
          <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', padding: theme.spacing.sm }}>
            <Switch
              checked={editingValue ?? value ?? false}
              onChange={(checked) => setEditingValue?.(checked)}
            />
          </div>
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
      case 'file':
        const displayFile = editingValue ?? value;
        const displayFilename = displayFile instanceof File ? displayFile.name : displayFile?.filename;

        return (
          <div style={{ ...inputStyle, display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {displayFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <span style={{ flex: 1, fontFamily: 'monospace', fontSize: theme.fontSize.sm }}>
                  {displayFilename}
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                  // Store the File object - parent will handle upload on save
                  setEditingValue?.(file);
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="upload" size="sm" />
              Upload File
            </Button>
          </div>
        );
      case 'pointer':
        return (
          <div style={{ ...inputStyle, display: 'flex', gap: theme.spacing.xs, alignItems: 'center' }}>
            <input
              type="text"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontFamily: 'monospace',
              }}
              value={editingValue?.id ?? value?.id ?? ''}
              onInput={(e) => {
                if (!field || _.isString(field) || field.type !== 'pointer' || !field.target) return;
                setEditingValue?.(proto.Object(field.target, e.currentTarget.value));
              }}
              autofocus
            />
            {(editingValue?.id || value?.id) && field && !_.isString(field) && field.type === 'pointer' && field.target && (
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: theme.spacing.xs,
                  color: theme.colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                }}
                onClick={() => {
                  if (!field || _.isString(field) || field.type !== 'pointer' || !field.target) return;
                  const targetId = editingValue?.id ?? value?.id;
                  location.pushState({}, `/classes/${field.target}?filter[_id]=${encodeURIComponent(targetId)}`);
                }}
              >
                <Icon name="link" size="sm" />
              </button>
            )}
          </div>
        );
      case 'relation':
        return (
          <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <span style={{ flex: 1, fontFamily: 'monospace', fontSize: theme.fontSize.sm }}>
              {(editingValue ?? value ?? []).length} item(s)
            </span>
            {field && !_.isString(field) && field.type === 'relation' && field.target && item?.id && (
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: theme.spacing.xs,
                  color: theme.colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                }}
                onClick={() => {
                  if (!field || _.isString(field) || field.type !== 'relation' || !field.target || !item?.id) return;
                  location.pushState({}, `/classes/${field.target}?relationOf=${encodeURIComponent(className)}&relationId=${encodeURIComponent(item.id)}&relationField=${encodeURIComponent(column)}`);
                }}
              >
                <Icon name="link" size="sm" />
              </button>
            )}
          </div>
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
        return (
          <div style={{ ...cellStyle, display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {value.filename}
            </span>
            <a
              href={value.url}
              download={value.filename}
              style={{
                color: theme.colors.primary,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <Icon name="download" size="sm" />
            </a>
          </div>
        );
      case 'pointer':
        return (
          <div style={{ ...cellStyle, display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {value.id}
            </span>
            {field && !_.isString(field) && field.type === 'pointer' && field.target && (
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: theme.colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!field || _.isString(field) || field.type !== 'pointer' || !field.target) return;
                  location.pushState({}, `/classes/${field.target}?filter[_id]=${encodeURIComponent(value.id)}`);
                }}
              >
                <Icon name="link" size="sm" />
              </button>
            )}
          </div>
        );
      case 'relation':
        return (
          <div style={{ ...cellStyle, display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {_.map(value, (v: TObject) => v.id).join(', ')}
            </span>
            {field && !_.isString(field) && field.type === 'relation' && field.target && item?.id && (
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: theme.colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!field || _.isString(field) || field.type !== 'relation' || !field.target || !item?.id) return;
                  location.pushState({}, `/classes/${field.target}?relationOf=${encodeURIComponent(className)}&relationId=${encodeURIComponent(item.id)}&relationField=${encodeURIComponent(column)}`);
                }}
              >
                <Icon name="link" size="sm" />
              </button>
            )}
          </div>
        );
      default:
        return <div style={cellStyle}>{encodeValue(value, 0)}</div>;
    }
  }

};
