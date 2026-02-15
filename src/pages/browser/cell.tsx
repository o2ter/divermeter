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

// Helper component: Relation editor modal
const RelationEditor = ({
  value,
  targetClassName,
  onSave,
  onClose
}: {
  value: TObject[];
  targetClassName: string;
  onSave: (items: TObject[]) => void;
  onClose: () => void;
}) => {
  const theme = useTheme();
  const proto = useProto();
  const [items, setItems] = useState<TObject[]>(value);
  const [newId, setNewId] = useState('');

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

  const modalStyle = {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    minWidth: 400,
    maxWidth: 600,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing.lg,
  };

  const headerStyle = {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colorContrast('#ffffff'),
  };

  const listStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing.sm,
    maxHeight: 300,
    overflowY: 'auto' as const,
    padding: theme.spacing.sm,
    backgroundColor: withOpacity(theme.colors.primary, 0.02),
    borderRadius: theme.borderRadius.md,
  };

  const itemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.sm,
    border: `1px solid ${withOpacity(theme.colors.primary, 0.1)}`,
  };

  const addSectionStyle = {
    display: 'flex',
    gap: theme.spacing.sm,
    alignItems: 'center',
  };

  const inputStyle = {
    flex: 1,
    padding: theme.spacing.sm,
    border: `1px solid ${withOpacity(theme.colors.primary, 0.2)}`,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.fontSize.md,
    outline: 'none',
    '&:focus': {
      borderColor: theme.colors.primary,
      boxShadow: `0 0 0 3px ${withOpacity(theme.colors.primary, 0.1)}`,
    },
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  };

  const addItem = () => {
    if (newId.trim() && !items.find(item => item.id === newId.trim())) {
      setItems([...items, proto.Object(targetClassName, newId.trim())]);
      setNewId('');
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div style={modalStyle}>
      <div style={headerStyle}>Edit Relation ({targetClassName})</div>

      <div style={listStyle}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: theme.spacing.md }}>
            No items
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} style={itemStyle}>
              <span style={{ fontFamily: 'monospace', color: 'rebeccapurple' }}>{item.id}</span>
              <button
                onClick={() => item.id && removeItem(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: theme.spacing.xs,
                  color: theme.colors.error,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon name="trash" size="sm" />
              </button>
            </div>
          ))
        )}
      </div>

      <div style={addSectionStyle}>
        <input
          type="text"
          value={newId}
          onInput={(e) => setNewId(e.currentTarget.value)}
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
          placeholder="Enter object ID"
          style={inputStyle}
        />
        <Button variant="outline" color="primary" onClick={addItem} disabled={!newId.trim()}>
          <Icon name="plus" size="sm" />
          Add
        </Button>
      </div>

      <div style={buttonGroupStyle}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="solid" color="primary" onClick={() => { onSave(items); onClose(); }}>
          Save
        </Button>
      </div>
    </div>
  );
};

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
  const [showRelationModal, setShowRelationModal] = useState(false);

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
                  location.pushState({}, `/classes/${field.target}?filter=${encodeURIComponent(`id == "${targetId}"`)}`);
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRelationModal(true)}
            >
              Edit Items
            </Button>
            <Modal show={showRelationModal}>
              <RelationEditor
                value={editingValue ?? value ?? []}
                targetClassName={field && !_.isString(field) && field.type === 'relation' && field.target ? field.target : 'Object'}
                onSave={(items) => setEditingValue?.(items)}
                onClose={() => setShowRelationModal(false)}
              />
            </Modal>
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
                  location.pushState({}, `/classes/${field.target}?filter=${encodeURIComponent(`id == "${value.id}"`)}`);
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
          </div>
        );
      default:
        return <div style={cellStyle}>{encodeValue(value, 0)}</div>;
    }
  }

};
