//
//  columnSettings.tsx
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

import { useState } from 'frosty';
import { TSchema } from '../../proto';
import { useTheme } from '../../components/theme';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { Modal } from '../../components/modal';

// Column Settings Modal Component
type ColumnSettingsModalProps = {
  columns: Array<{ key: string; baseField: string; fieldType: TSchema['fields'][string] }>;
  columnOrder: string[];
  hiddenColumns: Set<string>;
  onApply: (order: string[], hidden: Set<string>) => void;
  onCancel: () => void;
};

export const ColumnSettingsModal = ({ columns, columnOrder, hiddenColumns, onApply, onCancel }: ColumnSettingsModalProps) => {
  const theme = useTheme();
  // Initialize state from props - no useEffect needed, key prop resets component
  const initialOrder = columnOrder.length > 0 ? columnOrder : columns.map(col => col.key);
  const [localOrder, setLocalOrder] = useState<string[]>(initialOrder);
  const [localHidden, setLocalHidden] = useState<Set<string>>(new Set(hiddenColumns));

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...localOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      setLocalOrder(newOrder);
    }
  };

  const toggleVisibility = (columnKey: string) => {
    const newHidden = new Set(localHidden);
    if (newHidden.has(columnKey)) {
      newHidden.delete(columnKey);
    } else {
      newHidden.add(columnKey);
    }
    setLocalHidden(newHidden);
  };

  const resetToDefault = () => {
    setLocalOrder(columns.map(col => col.key));
    setLocalHidden(new Set());
  };

  const handleApply = () => {
    onApply(localOrder, localHidden);
  };

  return (
    <Modal show={true}>
      <div style={{
        width: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderRadius: theme.borderRadius.lg,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      }}>
        {/* Header */}
        <div style={{
          padding: theme.spacing.lg,
          borderBottom: `1px solid ${theme.colors['primary-200']}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.primary,
          }}>
            Column Settings
          </h3>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: theme.spacing.xs,
              display: 'flex',
              alignItems: 'center',
              color: theme.colorContrast('#ffffff'),
              opacity: 0.6,
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: theme.spacing.lg,
        }}>
          <div style={{
            fontSize: theme.fontSize.sm,
            color: theme.colorContrast('#ffffff'),
            opacity: 0.7,
            marginBottom: theme.spacing.md,
          }}>
            Reorder columns or hide them from the table. Hidden columns can be shown again later.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
            {localOrder.map((colKey, index) => {
              const column = columns.find(c => c.key === colKey);
              if (!column) return null;

              const isHidden = localHidden.has(colKey);

              return (
                <div
                  key={colKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.sm,
                    backgroundColor: isHidden ? theme.colors['primary-100'] : '#ffffff',
                    border: `1px solid ${theme.colors['primary-200']}`,
                    borderRadius: theme.borderRadius.md,
                    opacity: isHidden ? 0.5 : 1,
                  }}
                >
                  {/* Visibility checkbox */}
                  <input
                    type="checkbox"
                    checked={!isHidden}
                    onChange={() => toggleVisibility(colKey)}
                    style={{
                      cursor: 'pointer',
                      width: '16px',
                      height: '16px',
                    }}
                  />

                  {/* Column name */}
                  <div style={{
                    flex: 1,
                    fontSize: theme.fontSize.sm,
                    color: theme.colorContrast('#ffffff'),
                  }}>
                    {column.key}
                  </div>

                  {/* Move buttons */}
                  <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                    <button
                      onClick={() => moveColumn(index, 'up')}
                      disabled={index === 0}
                      style={{
                        background: 'none',
                        border: `1px solid ${theme.colors['primary-300']}`,
                        borderRadius: theme.borderRadius.sm,
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        padding: theme.spacing.xs,
                        display: 'flex',
                        alignItems: 'center',
                        color: theme.colorContrast('#ffffff'),
                        opacity: index === 0 ? 0.3 : 0.7,
                        '&:hover': {
                          opacity: index === 0 ? 0.3 : 1,
                          backgroundColor: index === 0 ? 'transparent' : theme.colors['primary-100'],
                        },
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveColumn(index, 'down')}
                      disabled={index === localOrder.length - 1}
                      style={{
                        background: 'none',
                        border: `1px solid ${theme.colors['primary-300']}`,
                        borderRadius: theme.borderRadius.sm,
                        cursor: index === localOrder.length - 1 ? 'not-allowed' : 'pointer',
                        padding: theme.spacing.xs,
                        display: 'flex',
                        alignItems: 'center',
                        color: theme.colorContrast('#ffffff'),
                        opacity: index === localOrder.length - 1 ? 0.3 : 0.7,
                        '&:hover': {
                          opacity: index === localOrder.length - 1 ? 0.3 : 1,
                          backgroundColor: index === localOrder.length - 1 ? 'transparent' : theme.colors['primary-100'],
                        },
                      }}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: theme.spacing.lg,
          borderTop: `1px solid ${theme.colors['primary-200']}`,
          display: 'flex',
          justifyContent: 'space-between',
          gap: theme.spacing.sm,
        }}>
          <Button
            variant="ghost"
            color="primary"
            size="sm"
            onClick={resetToDefault}
          >
            Reset to Default
          </Button>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <Button
              variant="outline"
              color="primary"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="primary"
              size="sm"
              onClick={handleApply}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
