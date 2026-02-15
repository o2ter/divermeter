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
import { useResource, useState } from 'frosty';
import { useProto } from '../../proto';
import { useTheme } from '../../components/theme';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { Modal } from '../../components/modal';
import { useAlert } from '../../components/alert';
import { useActivity } from '../../components/activity';
import { normalizeColor, getRed, getGreen, getBlue, rgba, toHexString, mixColor } from '@o2ter/colors.js';
import { encodeValue, decodeValue } from '../browser/utils';

type ConfigEntry = {
  key: string;
  value: any;
  acl: any;
};

type EditingState = {
  key: string;
  value: string;
  acl: string;
} | null;

export const ConfigPage = () => {
  const proto = useProto();
  const theme = useTheme();
  const alert = useAlert();
  const startActivity = useActivity();
  const [editingState, setEditingState] = useState<EditingState>(null);
  const [newEntry, setNewEntry] = useState<{ key: string; value: string; acl: string }>({ key: '', value: '', acl: '' });
  const [showAddModal, setShowAddModal] = useState(false);

  const {
    resource: data,
    refresh,
  } = useResource(async () => {
    const config = await proto.config({ master: true });
    const acl = await proto.configAcl({ master: true });

    // Merge config and ACL into entries
    const entries: ConfigEntry[] = [];
    const keys = new Set([...Object.keys(config), ...Object.keys(acl)]);

    keys.forEach(key => {
      entries.push({
        key,
        value: config[key],
        acl: acl[key],
      });
    });

    return entries.sort((a, b) => a.key.localeCompare(b.key));
  }, []);

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

  // ACL helpers - convert between array and comma-separated string
  const encodeAcl = (acl: any): string => {
    if (_.isNil(acl)) return '';
    if (!_.isArray(acl)) return String(acl);
    return acl.join(', ');
  };

  const decodeAcl = (text: string): any => {
    const trimmed = text.trim();
    if (_.isEmpty(trimmed)) return undefined;
    return trimmed.split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  // Handle save
  const handleSave = (key: string) => {
    if (!editingState) return;

    startActivity(async () => {
      try {
        const parsedValue = decodeValue(editingState.value);
        const parsedAcl = editingState.acl.trim() ? decodeAcl(editingState.acl) : undefined;

        await proto.setConfig({ [key]: parsedValue }, { master: true, acl: parsedAcl });

        setEditingState(null);
        await refresh();
        alert.showSuccess('Configuration updated successfully');
      } catch (e: any) {
        alert.showError(e.message || 'Failed to save');
      }
    });
  };

  // Handle delete
  const handleDelete = (key: string) => {
    if (!confirm(`Delete config entry "${key}"?`)) return;

    startActivity(async () => {
      try {
        // Delete by setting to undefined
        await proto.setConfig({ [key]: undefined as any }, { master: true });
        await refresh();
        alert.showSuccess('Configuration entry deleted');
      } catch (e: any) {
        alert.showError(e.message || 'Failed to delete');
      }
    });
  };

  // Handle add new entry
  const handleAddEntry = () => {
    startActivity(async () => {
      try {
        if (!newEntry.key.trim()) {
          alert.showError('Key is required');
          return;
        }

        const value = newEntry.value.trim() ? decodeValue(newEntry.value) : undefined;
        const acl = newEntry.acl.trim() ? decodeAcl(newEntry.acl) : undefined;
        await proto.setConfig({ [newEntry.key]: value }, { master: true, acl });

        setShowAddModal(false);
        setNewEntry({ key: '', value: '', acl: '' });
        await refresh();
        alert.showSuccess('Configuration entry added');
      } catch (e: any) {
        alert.showError(e.message || 'Failed to add entry');
      }
    });
  };

  // Start editing
  const startEdit = (key: string) => {
    const entry = data?.find(e => e.key === key);
    if (!entry) return;

    setEditingState({
      key,
      value: encodeValue(entry.value),
      acl: encodeAcl(entry.acl),
    });
  };

  // Table styles
  const borderColor = mixColor(theme.colors.primary, '#dee2e6', 0.1);
  const headerBg = mixColor(theme.colors.primary, '#f8f9fa', 0.05);
  const rowHoverBg = withOpacity(theme.colors.primary, 0.03);
  const textPrimary = theme.colorContrast('#ffffff');
  const textSecondary = withOpacity(textPrimary, 0.65);

  const containerStyle = {
    padding: theme.spacing.xl,
    minHeight: '100vh',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  };

  const titleStyle = {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: textPrimary,
    margin: 0,
  };

  const tableContainerStyle = {
    border: `1px solid ${borderColor}`,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    margin: 0,
  };

  const thStyle = {
    padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
    backgroundColor: headerBg,
    borderBottom: `2px solid ${borderColor}`,
    textAlign: 'left' as const,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: textPrimary,
  };

  const tdStyle = {
    padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
    borderBottom: `1px solid ${borderColor}`,
    fontSize: theme.fontSize.sm,
    color: textPrimary,
    verticalAlign: 'top' as const,
  };

  const actionCellStyle = {
    ...tdStyle,
    width: 150,
    textAlign: 'center' as const,
  };

  const cellContentStyle = {
    maxHeight: 200,
    overflow: 'auto' as const,
    fontFamily: 'var(--font-monospace)',
    fontSize: theme.fontSize.xs,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
  };

  const modalContentStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing.md,
  };

  const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing.xs,
  };

  const labelStyle = {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: textPrimary,
  };

  const inputStyle = {
    padding: theme.spacing.sm,
    border: `1px solid ${borderColor}`,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.fontSize.sm,
    fontFamily: 'var(--font-monospace)',
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: 120,
    fontFamily: 'var(--font-monospace)',
    resize: 'vertical' as const,
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Configuration</h1>
        <Button
          variant="solid"
          color="primary"
          size="md"
          onClick={() => setShowAddModal(true)}
        >
          Add Entry
        </Button>
      </div>

      {!data ? (
        <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: textSecondary }}>
          Loading configuration...
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: textSecondary }}>
          No configuration entries found. Click "Add Entry" to create one.
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '20%' }}>Key</th>
                <th style={{ ...thStyle, width: '35%' }}>Value</th>
                <th style={{ ...thStyle, width: '35%' }}>ACL</th>
                <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, idx) => {
                const isEditing = editingState?.key === entry.key;
                return (
                  <tr
                    key={entry.key}
                    style={{
                      '&:hover': {
                        backgroundColor: rowHoverBg,
                      },
                    }}
                  >
                    <td style={tdStyle}>
                      <div style={cellContentStyle}>{entry.key}</div>
                    </td>
                    <td style={tdStyle}>
                      {isEditing ? (
                        <textarea
                          value={editingState.value}
                          onChange={(e) => setEditingState({ ...editingState, value: e.currentTarget.value })}
                          style={textareaStyle}
                          autofocus
                        />
                      ) : (
                        <div style={cellContentStyle}>
                          {_.isNil(entry.value) ? (
                            <span style={{ color: textSecondary, fontStyle: 'italic' }}>undefined</span>
                          ) : (
                            encodeValue(entry.value)
                          )}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingState.acl}
                          onChange={(e) => setEditingState({ ...editingState, acl: e.currentTarget.value })}
                          style={inputStyle}
                        />
                      ) : (
                        <div style={cellContentStyle}>
                          {_.isNil(entry.acl) ? (
                            <span style={{ color: textSecondary, fontStyle: 'italic' }}>undefined</span>
                          ) : (
                            encodeAcl(entry.acl)
                          )}
                        </div>
                      )}
                    </td>
                    <td style={actionCellStyle}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: theme.spacing.xs, justifyContent: 'center' }}>
                          <Button
                            variant="solid"
                            color="primary"
                            size="sm"
                            onClick={() => handleSave(entry.key)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingState(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: theme.spacing.xs, justifyContent: 'center' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(entry.key)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            color="error"
                            size="sm"
                            onClick={() => handleDelete(entry.key)}
                          >
                            <Icon name="close" size="sm" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddModal && (
        <Modal show={true}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.xl,
            minWidth: 400,
            maxWidth: 600,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing.lg,
            }}>
              <h2 style={{
                fontSize: theme.fontSize.lg,
                fontWeight: theme.fontWeight.semibold,
                margin: 0,
                color: textPrimary,
              }}>
                Add Configuration Entry
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  setNewEntry({ key: '', value: '', acl: '' });
                }}
              >
                <Icon name="close" size="sm" />
              </Button>
            </div>

            <div style={modalContentStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Key *</label>
                <input
                  type="text"
                  value={newEntry.key}
                  onChange={(e) => setNewEntry({ ...newEntry, key: e.currentTarget.value })}
                  style={inputStyle}
                  placeholder="config.key"
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Value</label>
                <textarea
                  value={newEntry.value}
                  onChange={(e) => setNewEntry({ ...newEntry, value: e.currentTarget.value })}
                  style={textareaStyle}
                  placeholder='{ string: "text", number: 123, date: ISODate("2026-02-15T00:00:00.000Z"), decimal: Decimal("0.001") }'
                />
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>ACL</label>
                <input
                  type="text"
                  value={newEntry.acl}
                  onChange={(e) => setNewEntry({ ...newEntry, acl: e.currentTarget.value })}
                  style={inputStyle}
                  placeholder='role:admin, *'
                />
              </div>

              <div style={{ display: 'flex', gap: theme.spacing.sm, justifyContent: 'flex-end' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEntry({ key: '', value: '', acl: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  color="primary"
                  onClick={handleAddEntry}
                >
                  Add Entry
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
