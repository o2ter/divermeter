//
//  addEntry.tsx
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
import { useTheme } from '../../components/theme';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { Modal } from '../../components/modal';
import { JSCode } from '../../components/jscode';
import { mixColor } from '@o2ter/colors.js';

// Separate AddEntryModal component to leverage key prop for state reset
type AddEntryModalProps = {
  onSave: (key: string, value: string, acl: string) => void;
  onCancel: () => void;
};

export const AddEntryModal = ({ onSave, onCancel }: AddEntryModalProps) => {
  const theme = useTheme();
  const textPrimary = theme.colorContrast('#ffffff');
  // Initialize state fresh for each modal open (via key prop)
  const [newEntry, setNewEntry] = useState({ key: '', value: '', acl: '' });

  // Modal-specific styles
  const borderColor = mixColor(theme.colors.primary, '#dee2e6', 0.1);
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

  return (
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
            onClick={onCancel}
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
            <div style={{ minHeight: '120px' }}>
              <JSCode
                initialValue={newEntry.value}
                onChangeValue={(text) => setNewEntry({ ...newEntry, value: text })}
              />
            </div>
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
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="primary"
              onClick={() => onSave(newEntry.key, newEntry.value, newEntry.acl)}
            >
              Add Entry
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
