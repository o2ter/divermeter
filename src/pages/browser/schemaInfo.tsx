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
import { useState } from 'frosty';
import { TSchema } from '../../proto';
import { useTheme } from '../../components/theme';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { Modal } from '../../components/modal';
import { encodeValue, readonlyKeysForSchema, systemFields, typeOf } from './utils';

type SchemaInfoModalProps = {
  schema: TSchema;
  className: string;
  onCancel: () => void;
};

const renderACL = (acl: string[] | undefined): string => {
  if (!acl) return '—';
  if (acl.length === 0) return 'None';
  if (acl.includes('*')) return 'Everyone';
  return acl.join(', ');
};

const SectionHeader = ({ children, theme }: { children: any; theme: ReturnType<typeof useTheme> }) => (
  <h4 style={{
    margin: 0,
    marginBottom: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  }}>
    {children}
  </h4>
);

const TableWrapper = ({ children, theme }: { children: any; theme: ReturnType<typeof useTheme> }) => (
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
      {children}
    </table>
  </div>
);

const thStyle = (theme: ReturnType<typeof useTheme>) => ({
  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
  textAlign: 'left' as const,
  fontWeight: theme.fontWeight.semibold,
  color: theme.colors.primary,
  backgroundColor: theme.colors['primary-100'],
  borderBottom: `1px solid ${theme.colors['primary-200']}`,
  whiteSpace: 'nowrap' as const,
});

const tdStyle = (theme: ReturnType<typeof useTheme>, idx: number) => ({
  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
  color: theme.colorContrast('#ffffff'),
  backgroundColor: idx % 2 === 0 ? '#ffffff' : theme.colors['primary-100'],
  borderBottom: `1px solid ${theme.colors['primary-100']}`,
  verticalAlign: 'top' as const,
});

const Badge = ({ children, bg, color, theme }: {
  children: any;
  bg: string;
  color: string;
  theme: ReturnType<typeof useTheme>;
}) => (
  <span style={{
    display: 'inline-block',
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    marginRight: theme.spacing.xs,
    marginBottom: 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: bg,
    color: color,
    fontWeight: theme.fontWeight.medium,
    fontSize: theme.fontSize.xs,
  }}>
    {children}
  </span>
);

export const SchemaInfoModal = ({ schema, className, onCancel }: SchemaInfoModalProps) => {
  const theme = useTheme();
  const readonlyKeys = readonlyKeysForSchema(schema);
  const clpOperations = ['get', 'find', 'count', 'create', 'update', 'delete'] as const;
  const [expandedShapes, setExpandedShapes] = useState(new Set<string>());

  const toggleShape = (path: string) => {
    setExpandedShapes(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  };

  const renderShapeSubRows = (
    shape: TSchema['fields'],
    pathPrefix: string,
    depth: number,
    baseIdx: number
  ): any[] => Object.entries(shape).flatMap(([subName, subType], subIdx) => {
    const path = `${pathPrefix}.${subName}`;
    const isSubShape = !_.isString(subType) && subType.type === 'shape';
    const isExpanded = expandedShapes.has(path);
    const subDefault = !_.isString(subType) && 'default' in subType ? subType.default : undefined;
    const subDescription = !_.isString(subType) && 'description' in subType ? subType.description : undefined;
    const rowIdx = baseIdx + subIdx;
    const indent = theme.spacing.md + depth * 16;

    const row = (
      <tr key={path}>
        <td style={{ ...tdStyle(theme, rowIdx), fontFamily: 'monospace', paddingLeft: indent }}>
          <span style={{ color: theme.colors.primary, opacity: 0.4, marginRight: 4, userSelect: 'none' }}>└</span>
          {isSubShape ? (
            <button
              onClick={() => toggleShape(path)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, marginRight: 4, verticalAlign: 'middle',
                color: theme.colors.primary,
              }}
            >
              <Icon
                name="chevronRight"
                size="xs"
                style={{
                  display: 'inline-block',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>
          ) : null}
          {subName}
        </td>
        <td style={tdStyle(theme, rowIdx)}>
          <span style={{ fontFamily: 'monospace' }}>{typeOf(subType)}</span>
          {isSubShape && !isExpanded && (
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.primary, marginTop: 2 }}>
              {Object.keys((subType as any).shape).length} sub-fields
            </div>
          )}
          {!_.isString(subType) && (subType.type === 'relation' || subType.type === 'pointer') && (
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.success, marginTop: 2 }}>→ {subType.target}</div>
          )}
          {!_.isString(subType) && subType.type === 'vector' && (
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.primary, marginTop: 2 }}>dim: {subType.dimension}</div>
          )}
        </td>
        <td style={{ ...tdStyle(theme, rowIdx), fontFamily: 'monospace', fontSize: theme.fontSize.xs }}>
          {!_.isNil(subDefault) ? encodeValue(subDefault, 0) : <span style={{ opacity: 0.4 }}>—</span>}
        </td>
        <td style={{ ...tdStyle(theme, rowIdx), fontSize: theme.fontSize.xs, maxWidth: 200 }}>
          {subDescription ?? <span style={{ opacity: 0.4 }}>—</span>}
        </td>
        <td style={tdStyle(theme, rowIdx)} />
      </tr>
    );

    if (isSubShape && isExpanded) {
      return [row, ...renderShapeSubRows((subType as any).shape, path, depth + 1, rowIdx + 1)];
    }
    return [row];
  });

  return (
    <Modal show={true}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        maxWidth: '1000px',
        width: '92vw',
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
              cursor: 'pointer',
              color: theme.colorContrast('#ffffff'),
              opacity: 0.6,
              padding: 0,
              '&:hover': { opacity: 1 },
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
            <SectionHeader theme={theme}>Summary</SectionHeader>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: `${theme.spacing.xs}px ${theme.spacing.lg}px`,
              fontSize: theme.fontSize.sm,
              color: theme.colorContrast('#ffffff'),
            }}>
              <strong>Class Name:</strong><span style={{ fontFamily: 'monospace' }}>{className}</span>
              <strong>Total Fields:</strong><span>{Object.keys(schema.fields).length}</span>
              <strong>Live Query:</strong>
              <span>
                {schema.liveQuery ? (
                  <Badge bg={theme.colors['success-200']} color={theme.colors.success} theme={theme}>Enabled</Badge>
                ) : (
                  <Badge bg={theme.colors['primary-100']} color={theme.colors.primary} theme={theme}>Disabled</Badge>
                )}
              </span>
              {schema.secureFields && schema.secureFields.length > 0 && (
                <>
                  <strong>Secure Fields:</strong>
                  <span style={{ fontFamily: 'monospace' }}>{schema.secureFields.join(', ')}</span>
                </>
              )}
            </div>
          </div>

          {/* Fields */}
          <div>
            <SectionHeader theme={theme}>Fields</SectionHeader>
            <TableWrapper theme={theme}>
              <thead>
                <tr>
                  <th style={thStyle(theme)}>Field Name</th>
                  <th style={thStyle(theme)}>Type</th>
                  <th style={thStyle(theme)}>Default</th>
                  <th style={thStyle(theme)}>Description</th>
                  <th style={thStyle(theme)}>Attributes</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(schema.fields).map(([fieldName, fieldType], idx) => {
                  const isSecure = schema.secureFields?.includes(fieldName);
                  const isReadonly = readonlyKeys.includes(fieldName);
                  const isSystem = systemFields.includes(fieldName);
                  const defaultVal = !_.isString(fieldType) && 'default' in fieldType ? fieldType.default : undefined;
                  const description = !_.isString(fieldType) && 'description' in fieldType ? fieldType.description : undefined;

                  const isShape = !_.isString(fieldType) && fieldType.type === 'shape';
                  const isExpanded = isShape && expandedShapes.has(fieldName);

                  return (
                    <>
                      <tr key={fieldName}>
                        <td style={{ ...tdStyle(theme, idx), fontFamily: 'monospace' }}>
                          {isShape ? (
                            <button
                              onClick={() => toggleShape(fieldName)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: 0, marginRight: 4, verticalAlign: 'middle',
                                color: theme.colors.primary,
                              }}
                            >
                              <Icon
                                name="chevronRight"
                                size="xs"
                                style={{
                                  display: 'inline-block',
                                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.15s ease',
                                }}
                              />
                            </button>
                          ) : null}
                          {fieldName}
                        </td>
                        <td style={tdStyle(theme, idx)}>
                          <span style={{ fontFamily: 'monospace' }}>{typeOf(fieldType)}</span>
                          {!_.isString(fieldType) && fieldType.type === 'vector' && (
                            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.primary, marginTop: 2 }}>
                              dim: {fieldType.dimension}
                            </div>
                          )}
                          {isShape && !isExpanded && (
                            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.primary, marginTop: 2 }}>
                              {Object.keys((fieldType as any).shape).length} sub-fields
                            </div>
                          )}
                          {!_.isString(fieldType) && (fieldType.type === 'relation' || fieldType.type === 'pointer') && (
                            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.success, marginTop: 2 }}>
                              → {fieldType.target}
                            </div>
                          )}
                          {!_.isString(fieldType) && fieldType.type === 'relation' && fieldType.foreignField && (
                            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.info, marginTop: 2 }}>
                              via {fieldType.foreignField}
                            </div>
                          )}
                        </td>
                        <td style={{ ...tdStyle(theme, idx), fontFamily: 'monospace', fontSize: theme.fontSize.xs }}>
                          {!_.isNil(defaultVal) ? encodeValue(defaultVal, 0) : <span style={{ opacity: 0.4 }}>—</span>}
                        </td>
                        <td style={{ ...tdStyle(theme, idx), fontSize: theme.fontSize.xs, maxWidth: 200 }}>
                          {description ?? <span style={{ opacity: 0.4 }}>—</span>}
                        </td>
                        <td style={{ ...tdStyle(theme, idx), fontSize: theme.fontSize.xs }}>
                          {isSystem && (
                            <Badge bg={theme.colors['primary-200']} color={theme.colors.primary} theme={theme}>System</Badge>
                          )}
                          {isSecure && (
                            <Badge bg={theme.colors['warning-200']} color={theme.colors.warning} theme={theme}>Secure</Badge>
                          )}
                          {isReadonly && (
                            <Badge bg={theme.colors['info-200']} color={theme.colors.info} theme={theme}>Readonly</Badge>
                          )}
                        </td>
                      </tr>
                      {isShape && isExpanded && renderShapeSubRows((fieldType as any).shape, fieldName, 1, idx)}
                    </>
                  );
                })}
              </tbody>
            </TableWrapper>
          </div>

          {/* Indexes */}
          {schema.indexes && schema.indexes.length > 0 && (
            <div>
              <SectionHeader theme={theme}>Indexes</SectionHeader>
              <TableWrapper theme={theme}>
                <thead>
                  <tr>
                    <th style={thStyle(theme)}>#</th>
                    <th style={thStyle(theme)}>Type</th>
                    <th style={thStyle(theme)}>Keys</th>
                    <th style={thStyle(theme)}>Options</th>
                  </tr>
                </thead>
                <tbody>
                  {schema.indexes.map((index, idx) => (
                    <tr key={idx}>
                      <td style={{ ...tdStyle(theme, idx), width: 32, color: theme.colors.primary }}>{idx + 1}</td>
                      <td style={{ ...tdStyle(theme, idx), fontFamily: 'monospace' }}>
                        {index.type ?? 'basic'}
                      </td>
                      <td style={{ ...tdStyle(theme, idx), fontFamily: 'monospace' }}>
                        {index.type === 'vector'
                          ? (_.isArray(index.keys) ? index.keys.join(', ') : index.keys)
                          : Object.entries(index.keys).map(([k, dir]) => `${k}: ${dir === 1 ? 'asc' : 'desc'}`).join(', ')
                        }
                      </td>
                      <td style={{ ...tdStyle(theme, idx), fontSize: theme.fontSize.xs }}>
                        {index.type !== 'vector' && index.unique && (
                          <Badge bg={theme.colors['warning-200']} color={theme.colors.warning} theme={theme}>Unique</Badge>
                        )}
                        {index.type === 'vector' && index.method && (
                          <Badge bg={theme.colors['info-200']} color={theme.colors.info} theme={theme}>{index.method}</Badge>
                        )}
                        {!(index.type !== 'vector' && index.unique) && !(index.type === 'vector' && index.method) && (
                          <span style={{ opacity: 0.4 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrapper>
            </div>
          )}

          {/* Class Level Permissions */}
          {schema.classLevelPermissions && (
            <div>
              <SectionHeader theme={theme}>Class Level Permissions</SectionHeader>
              <TableWrapper theme={theme}>
                <thead>
                  <tr>
                    <th style={thStyle(theme)}>Operation</th>
                    <th style={thStyle(theme)}>Allowed</th>
                  </tr>
                </thead>
                <tbody>
                  {clpOperations.map((op, idx) => (
                    <tr key={op}>
                      <td style={{ ...tdStyle(theme, idx), fontFamily: 'monospace', width: 100 }}>{op}</td>
                      <td style={{ ...tdStyle(theme, idx), fontSize: theme.fontSize.xs, fontFamily: 'monospace' }}>
                        {renderACL(schema.classLevelPermissions![op])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrapper>
            </div>
          )}

          {/* Additional Object Permissions */}
          {schema.additionalObjectPermissions && (
            <div>
              <SectionHeader theme={theme}>Additional Object Permissions</SectionHeader>
              <TableWrapper theme={theme}>
                <thead>
                  <tr>
                    <th style={thStyle(theme)}>Operation</th>
                    <th style={thStyle(theme)}>Allowed</th>
                  </tr>
                </thead>
                <tbody>
                  {(['read', 'update'] as const).map((op, idx) => (
                    <tr key={op}>
                      <td style={{ ...tdStyle(theme, idx), fontFamily: 'monospace', width: 100 }}>{op}</td>
                      <td style={{ ...tdStyle(theme, idx), fontSize: theme.fontSize.xs, fontFamily: 'monospace' }}>
                        {renderACL(schema.additionalObjectPermissions![op])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrapper>
            </div>
          )}

          {/* Field Level Permissions */}
          {schema.fieldLevelPermissions && !_.isEmpty(schema.fieldLevelPermissions) && (
            <div>
              <SectionHeader theme={theme}>Field Level Permissions</SectionHeader>
              <TableWrapper theme={theme}>
                <thead>
                  <tr>
                    <th style={thStyle(theme)}>Field</th>
                    <th style={thStyle(theme)}>Read</th>
                    <th style={thStyle(theme)}>Create</th>
                    <th style={thStyle(theme)}>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(schema.fieldLevelPermissions).map(([fieldName, flp], idx) => (
                    <tr key={fieldName}>
                      <td style={{ ...tdStyle(theme, idx), fontFamily: 'monospace' }}>{fieldName}</td>
                      <td style={{ ...tdStyle(theme, idx), fontSize: theme.fontSize.xs, fontFamily: 'monospace' }}>
                        {renderACL(flp.read)}
                      </td>
                      <td style={{ ...tdStyle(theme, idx), fontSize: theme.fontSize.xs, fontFamily: 'monospace' }}>
                        {renderACL(flp.create)}
                      </td>
                      <td style={{ ...tdStyle(theme, idx), fontSize: theme.fontSize.xs, fontFamily: 'monospace' }}>
                        {renderACL(flp.update)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrapper>
            </div>
          )}
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
