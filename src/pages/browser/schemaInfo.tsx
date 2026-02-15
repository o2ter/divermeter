//
//  schemaInfo.tsx
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
import { TSchema } from '../../proto';
import { useTheme } from '../../components/theme';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { Modal } from '../../components/modal';
import { readonlyKeysForSchema, systemFields, typeOf } from './utils';

type SchemaInfoModalProps = {
  schema: TSchema;
  className: string;
  onCancel: () => void;
};

export const SchemaInfoModal = ({ schema, className, onCancel }: SchemaInfoModalProps) => {
  const theme = useTheme();
  const readonlyKeys = readonlyKeysForSchema(schema);

  return (
    <Modal show={true}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        maxWidth: '800px',
        width: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.md,
        }}>
          <h3 style={{
            margin: 0,
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colorContrast('#ffffff'),
          }}>
            Schema: {className}
          </h3>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: theme.fontSize.lg,
              cursor: 'pointer',
              color: theme.colorContrast('#ffffff'),
              opacity: 0.6,
              padding: 0,
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            <Icon name="close" size="lg" />
          </button>
        </div>

        {/* Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.lg,
          overflow: 'auto',
          flex: 1,
        }}>
          {/* Summary */}
          <div>
            <h4 style={{
              margin: 0,
              marginBottom: theme.spacing.sm,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.primary,
            }}>
              Summary
            </h4>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colorContrast('#ffffff') }}>
              <div style={{ marginBottom: theme.spacing.xs }}>
                <strong>Class Name:</strong> {className}
              </div>
              <div style={{ marginBottom: theme.spacing.xs }}>
                <strong>Total Fields:</strong> {Object.keys(schema.fields).length}
              </div>
              {schema.secureFields && schema.secureFields.length > 0 && (
                <div style={{ marginBottom: theme.spacing.xs }}>
                  <strong>Secure Fields:</strong> {schema.secureFields.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Fields */}
          <div>
            <h4 style={{
              margin: 0,
              marginBottom: theme.spacing.sm,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.primary,
            }}>
              Fields
            </h4>
            <div style={{
              border: `1px solid ${theme.colors['primary-200']}`,
              borderRadius: theme.borderRadius.md,
              overflow: 'hidden',
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: theme.fontSize.sm,
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: theme.colors['primary-100'],
                    borderBottom: `1px solid ${theme.colors['primary-200']}`,
                  }}>
                    <th style={{
                      padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                      textAlign: 'left',
                      fontWeight: theme.fontWeight.semibold,
                      color: theme.colors.primary,
                    }}>
                      Field Name
                    </th>
                    <th style={{
                      padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                      textAlign: 'left',
                      fontWeight: theme.fontWeight.semibold,
                      color: theme.colors.primary,
                    }}>
                      Type
                    </th>
                    <th style={{
                      padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                      textAlign: 'left',
                      fontWeight: theme.fontWeight.semibold,
                      color: theme.colors.primary,
                    }}>
                      Attributes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(schema.fields).map(([fieldName, fieldType], idx) => {
                    const isSecure = schema.secureFields?.includes(fieldName);
                    const isReadonly = readonlyKeys.includes(fieldName);
                    const isSystem = systemFields.includes(fieldName);

                    return (
                      <tr
                        key={fieldName}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : theme.colors['primary-100'],
                          borderBottom: `1px solid ${theme.colors['primary-100']}`,
                        }}
                      >
                        <td style={{
                          padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                          fontFamily: 'monospace',
                          color: theme.colorContrast('#ffffff'),
                        }}>
                          {fieldName}
                        </td>
                        <td style={{
                          padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                          color: theme.colorContrast('#ffffff'),
                        }}>
                          {typeOf(fieldType)}
                        </td>
                        <td style={{
                          padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                          fontSize: theme.fontSize.xs,
                        }}>
                          {isSystem && (
                            <span style={{
                              display: 'inline-block',
                              padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                              marginRight: theme.spacing.xs,
                              borderRadius: theme.borderRadius.sm,
                              backgroundColor: theme.colors['primary-200'],
                              color: theme.colors.primary,
                              fontWeight: theme.fontWeight.medium,
                            }}>
                              System
                            </span>
                          )}
                          {isSecure && (
                            <span style={{
                              display: 'inline-block',
                              padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                              marginRight: theme.spacing.xs,
                              borderRadius: theme.borderRadius.sm,
                              backgroundColor: theme.colors['warning-200'],
                              color: theme.colors.warning,
                              fontWeight: theme.fontWeight.medium,
                            }}>
                              Secure
                            </span>
                          )}
                          {isReadonly && !isSystem && (
                            <span style={{
                              display: 'inline-block',
                              padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                              marginRight: theme.spacing.xs,
                              borderRadius: theme.borderRadius.sm,
                              backgroundColor: theme.colors['info-200'],
                              color: theme.colors.info,
                              fontWeight: theme.fontWeight.medium,
                            }}>
                              Readonly
                            </span>
                          )}
                          {!_.isString(fieldType) && fieldType.type === 'relation' && (
                            <span style={{
                              display: 'inline-block',
                              padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                              borderRadius: theme.borderRadius.sm,
                              backgroundColor: theme.colors['success-200'],
                              color: theme.colors.success,
                              fontWeight: theme.fontWeight.medium,
                            }}>
                              → {fieldType.target}
                            </span>
                          )}
                          {!_.isString(fieldType) && fieldType.type === 'pointer' && (
                            <span style={{
                              display: 'inline-block',
                              padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                              borderRadius: theme.borderRadius.sm,
                              backgroundColor: theme.colors['success-200'],
                              color: theme.colors.success,
                              fontWeight: theme.fontWeight.medium,
                            }}>
                              → {fieldType.target}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: theme.spacing.md,
          borderTop: `1px solid ${theme.colors['primary-200']}`,
          marginTop: theme.spacing.md,
        }}>
          <Button
            variant="solid"
            color="primary"
            size="sm"
            onClick={onCancel}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
