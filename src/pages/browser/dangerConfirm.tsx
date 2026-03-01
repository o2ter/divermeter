//
//  dangerConfirm.tsx
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
import { Modal } from '../../components/modal';
import { Icon } from '../../components/icon';

export const DANGER_CONFIRM_WORD = 'confirm';

export type DangerConfirmModalProps = {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const DangerConfirmModal = ({
  title,
  description,
  onConfirm,
  onCancel,
}: DangerConfirmModalProps) => {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const confirmed = input === DANGER_CONFIRM_WORD;

  return (
    <Modal show={true}>
      <div style={{
        width: 480,
        maxWidth: '90vw',
        backgroundColor: '#ffffff',
        borderRadius: theme.borderRadius.lg,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
          backgroundColor: theme.colors['error-100'] ?? '#fff5f5',
          borderBottom: `1px solid ${theme.colors['error-200'] ?? '#fed7d7'}`,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
          <div style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: theme.colors['error-200'] ?? '#fed7d7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.error,
          }}>
            <Icon name="warning" size="lg" />
          </div>
          <div style={{
            flex: 1,
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.error,
          }}>
            {title}
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: theme.spacing.xs,
              color: theme.colors.error,
              opacity: 0.6,
              display: 'flex',
              alignItems: 'center',
              borderRadius: theme.borderRadius.sm,
              '&:hover': { opacity: 1 },
            }}
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: `${theme.spacing.xl}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.lg,
        }}>
          <p style={{
            margin: 0,
            fontSize: theme.fontSize.sm,
            color: '#4a5568',
            lineHeight: 1.6,
          }}>
            {description}
          </p>

          <div style={{
            padding: `${theme.spacing.md}px`,
            backgroundColor: theme.colors['error-100'] ?? '#fff5f5',
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors['error-200'] ?? '#fed7d7'}`,
            fontSize: theme.fontSize.sm,
            color: '#742a2a',
          }}>
            <strong>This action cannot be undone.</strong> Please type{' '}
            <code style={{
              backgroundColor: theme.colors['error-200'] ?? '#fed7d7',
              padding: '1px 6px',
              borderRadius: 3,
              fontFamily: 'monospace',
              fontWeight: theme.fontWeight.semibold,
            }}>
              {DANGER_CONFIRM_WORD}
            </code>
            {' '}to confirm.
          </div>

          <input
            type="text"
            autofocus={true}
            placeholder={`Type "${DANGER_CONFIRM_WORD}" to confirm`}
            value={input}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
              fontSize: theme.fontSize.sm,
              borderRadius: theme.borderRadius.md,
              border: confirmed
                ? `2px solid ${theme.colors.error}`
                : `2px solid ${theme.colors['error-300'] ?? '#fc8181'}`,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease',
              backgroundColor: '#ffffff',
              color: '#1a202c',
              fontFamily: 'monospace',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && confirmed) onConfirm();
              if (e.key === 'Escape') onCancel();
            }}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: `${theme.spacing.md}px ${theme.spacing.xl}px`,
          backgroundColor: theme.colors['primary-100'],
          borderTop: `1px solid ${theme.colors['primary-200']}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: theme.spacing.sm,
        }}>
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
            color="error"
            size="sm"
            disabled={!confirmed}
            onClick={() => {
              if (confirmed) onConfirm();
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};
