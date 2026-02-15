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
import { tsvParseRows } from 'd3-dsv';
import { useParams } from '../../components/router';
import { QueryFilter, TObject, TSchema, useProto, useProtoSchema } from '../../proto';
import { _useCallbacks, useMemo, useResource, useState } from 'frosty';
import { useSearchParams } from 'frosty/web';
import { DataSheet } from '../../components/datasheet';
import { _typeOf, typeOf, decodeValue, verifyValue } from './utils';
import { TableCell } from './cell';
import { useTheme } from '../../components/theme';
import { useAlert } from '../../components/alert';
import { useActivity } from '../../components/activity';
import { Decimal, deserialize, serialize } from 'proto.io';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { FilterModal, decodeFiltersFromURLParams, encodeFiltersToURLParams } from './filter';

// System fields that cannot be edited
const systemFields = ['_id', '_created_at', '_updated_at', '__v', '__i'];
const readonlyKeysForSchema = (schema?: TSchema) => {
  if (!schema) return systemFields;
  return _.uniq([
    ...systemFields,
    ..._.keys(_.pickBy(schema.fields, type => !_.isString(type) && type.type === 'relation' && !_.isNil(type.foreignField))),
    ...schema.secureFields ?? [],
  ]);
};

// Helper: Expand schema fields into columns (flatten object types but not arrays)
const expandColumns = (fields: TSchema['fields']) => {
  const columns: Array<{
    key: string;
    baseField: string;
    fieldType: TSchema['fields'][string];
  }> = [];

  const expandField = (fieldName: string, fieldType: TSchema['fields'][string], path: string[] = []) => {

    if (!_.isString(fieldType) && fieldType.type === 'shape') {
      // Expand object properties into separate columns
      for (const [propName, propType] of Object.entries(fieldType.shape)) {
        expandField(fieldName, propType, [...path, propName]);
      }
    } else {
      // Regular field or non-expandable type
      const key = path.length > 0 ? `${fieldName}.${path.join('.')}` : fieldName;
      columns.push({
        key,
        baseField: fieldName,
        fieldType,
      });
    }
  };

  for (const [fieldName, fieldType] of Object.entries(fields)) {
    expandField(fieldName, fieldType);
  }

  return columns;
};

export const BrowserPage = () => {
  const theme = useTheme();
  const alert = useAlert();
  const { schema: className } = useParams() as { schema: string; };
  const proto = useProto();
  const schemas = useProtoSchema();
  const { [className]: schema } = schemas;
  const [searchParams, setSearchParams] = useSearchParams();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [columnWidth, setColumnWidth] = useState<Record<string, number>>({});

  const startActivity = useActivity();

  // Parse URL search params for state persistence
  const { filter, relationQuery, limit, offset, sort } = useMemo(() => {
    const params = searchParams;
    const relationOf = params.get('relationOf');
    const relationId = params.get('relationId');
    const relationField = params.get('relationField');
    const limitParam = params.get('limit');
    const offsetParam = params.get('offset');
    const sortParam = params.get('sort');

    // Derive filter and relationQuery
    let filter: QueryFilter[] = [];
    let relationQuery: { className: string; objectId: string; field: string } | null = null;

    if (relationOf && relationId && relationField) {
    // Priority 1: relation parameters
      relationQuery = { className: relationOf, objectId: relationId, field: relationField };
    } else {
      // Priority 2: Parse filter parameters using centralized decoder
      filter = decodeFiltersFromURLParams(params, proto);
    }

    // Parse limit
    const limit = limitParam ? parseInt(limitParam) : 20;

    // Parse offset
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    // Parse sort
    let sort: Record<string, 1 | -1> = {};
    if (sortParam) {
      try {
        sort = JSON.parse(sortParam);
      } catch {
        sort = {};
      }
    }

    return { filter, relationQuery, limit, offset, sort };
  }, [searchParams, proto]);

  // Helper functions to update URL params
  const updateFilter = (newFilter: QueryFilter[]) => {
    setSearchParams(params => {
      // Use centralized encoder to update filter params
      encodeFiltersToURLParams(newFilter, params, proto);
      params.delete('offset');
      return params;
    });
  };

  const updateSort = (newSort: Record<string, 1 | -1>) => {
    setSearchParams(params => {
      if (Object.keys(newSort).length > 0) {
        params.set('sort', JSON.stringify(newSort));
      } else {
        params.delete('sort');
      }
      return params;
    });
  };

  const updateLimit = (newLimit: number) => {
    setSearchParams(params => {
      params.set('limit', String(newLimit));
      params.delete('offset');
      return params;
    });
  };

  const updateOffset = (newOffset: number) => {
    setSearchParams(params => {
      if (newOffset > 0) {
        params.set('offset', String(newOffset));
      } else {
        params.delete('offset');
      }
      return params;
    });
  };

  // Expand columns from schema  
  const expandedColumns = useMemo(() => schema ? expandColumns(schema.fields) : [], [schema]);

  const {
    resource: {
      items = [],
      count = 0,
    } = {},
    setResource,
    refresh,
  } = useResource<{
    className: string;
    count: number;
    items: TObject[];
  }>(async ({ prevState, dispatch }) => {

    if (prevState?.className !== className) {
      // Reset state when switching to a different class
      dispatch({ className, count: 0, items: [] });
    }

    // Build query: start with relation or regular query, then apply filters
    let q = relationQuery
      ? proto.Relation(proto.Object(relationQuery.className, relationQuery.objectId), relationQuery.field)
      : proto.Query(className);

    // Apply filters to the query (works for both relation and regular queries)
    q = _.reduce(filter, (query, f) => query.filter(f), q);

    const count = await q.count({ master: true });
    const relation = _.filter(expandedColumns, ({ fieldType: type }) => !_.isString(type) && (type.type === 'pointer' || type.type === 'relation'));
    const files = _.filter(expandedColumns, ({ fieldType: type }) => !_.isString(type) && type.type === 'pointer' && type.target === 'File');
    // need to includes all pointer and relation fields
    q.includes(
      '*',
      ..._.map(relation, ({ key }) => `${key}._id`),
      ..._.map(files, ({ key }) => `${key}.filename`),
    );
    q.limit(limit);
    if (offset > 0) q.skip(offset);
    if (!_.isEmpty(sort)) q.sort(sort);
    return {
      className,
      count,
      items: await q.find({ master: true }),
    };
  }, [className, expandedColumns, filter, relationQuery, limit, offset, sort]);

  const [editingValue, setEditingValue] = useState<any>();

  const readonlyKeys = readonlyKeysForSchema(schema);

  // Check if we can edit in relation mode (relation field must be editable)
  const canEditInRelationMode = relationQuery
    ? !_.includes(readonlyKeysForSchema(schemas[relationQuery.className]), relationQuery.field.split('.')[0])
    : true;

  const handleApplyFilters = (filters: QueryFilter[]) => {
    updateFilter(filters);
    setShowFilterModal(false);
  };

  const decodeClipboardData = async (
    clipboard: DataTransfer | Clipboard,
    json: boolean,
  ) => {
    if (json && clipboard instanceof DataTransfer) {
      const json = clipboard.getData('application/json');
      if (!_.isEmpty(json)) return { type: 'json', data: deserialize(json) as Record<string, any>[] } as const;
    }
    if (clipboard instanceof DataTransfer) {
      const text = clipboard.getData('text/plain');
      if (!_.isEmpty(text)) return { type: 'raw', data: tsvParseRows(text) } as const;
    }
    if (clipboard instanceof Clipboard) {
      const text = await clipboard.readText();
      if (!_.isEmpty(text)) return { type: 'raw', data: tsvParseRows(text) } as const;
    }
  };

  const decodeRawValue = async (type: string, value: string) => {
    switch (type) {
      case 'boolean':
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        break;
      case 'number':
        {
          const number = parseFloat(value);
          if (_.isFinite(number)) return number;
          break;
        }
      case 'decimal':
        {
          const number = new Decimal(value);
          if (number.isFinite()) return number;
          break;
        }
      case 'string': return value;
      case 'date':
        {
          const date = new Date(value);
          if (_.isFinite(date.valueOf())) return date;
          break;
        }
      case 'object':
      case 'array':
      case 'string[]':
        const parsed = decodeValue(value);
        verifyValue(parsed);
        return parsed;
      case 'pointer':
        if (!_.isEmpty(value)) return proto.Object(className, value).fetch({ master: true });
        break;
      case 'relation':
        const _value = JSON.parse(value);
        if (_.isArray(_value) && _.every(_value, v => !_.isEmpty(v) && _.isString(v))) {
          return await Promise.all(_.map(_value, v => proto.Object(className, v).fetch({ master: true })));
        }
        break;
      default: break;
    }
  };

  const performSaves = async (items: TObject[]) => {
    for (const item of items) {
      await item.save({ master: true });
    }
    if (relationQuery && canEditInRelationMode) {
      const parentObj = proto.Object(relationQuery.className, relationQuery.objectId);
      parentObj.addToSet(relationQuery.field, items);
      await parentObj.save({ master: true });
    }
    setResource((prev) => {
      const prevItems = prev?.items ?? [];
      const newItems = [
        ..._.map(prevItems, i => items.find(it => it.id === i.id) ?? i),
        ..._.filter(items, it => !_.some(prevItems, p => p.id === it.id))
      ];
      return {
        className,
        items: newItems,
        count: prev?.count ?? newItems.length,
      };
    });
  };

  const {
    handleUpdateItem,
    handleDeleteItems,
    handleDeleteKeys,
    handlePasteData,
  } = _useCallbacks({
    handleUpdateItem: (item: TObject, columnKey: string, value: any) => {
      startActivity(async () => {
        try {
          const cloned = item.clone();
          const isNewItem = !item.id;
          const isUserPassword = className === 'User' && columnKey === 'password';

          // Handle file upload - check if value is a browser File object
          if (value instanceof File) {
            // Upload the file to proto.io
            const protoFile = proto.File(value.name, value);
            await protoFile.save({ master: true });
            cloned.set(columnKey, protoFile);
          } else if (isUserPassword && isNewItem) {
            // For new User objects with password: save first, then set password
            await cloned.save({ master: true });
            await proto.setPassword(cloned, value, { master: true });
            // Update in relation if needed
            if (relationQuery && canEditInRelationMode) {
              const parentObj = proto.Object(relationQuery.className, relationQuery.objectId);
              parentObj.addToSet(relationQuery.field, [cloned]);
              await parentObj.save({ master: true });
            }
            setResource((prev) => {
              const prevItems = prev?.items ?? [];
              const newItems = [...prevItems, cloned];
              return {
                className,
                items: newItems,
                count: prev?.count ?? newItems.length,
              };
            });
            alert.showSuccess(`Object ${cloned.id} created successfully`);
            return; // Early return - already saved
          } else if (isUserPassword) {
            // For existing User objects: use proto.setPassword
            await proto.setPassword(cloned, value, { master: true });
          } else {
            cloned.set(columnKey, value);
          }
          await performSaves([cloned]);
          alert.showSuccess(`Object ${cloned.id} ${isNewItem ? 'created' : 'updated'} successfully`);
        } catch (error) {
          console.error('Failed to update item:', error);
          alert.showError(error instanceof Error ? error.message : 'Failed to update item');
        }
      });
    },
    handleDeleteItems: (items: TObject[]) => {
      startActivity(async () => {
        try {
          // If we're in relation mode, remove from relation instead of deleting
          if (relationQuery && canEditInRelationMode) {
            const parentObj = proto.Object(relationQuery.className, relationQuery.objectId);
            parentObj.removeAll(relationQuery.field, items);
            await parentObj.save({ master: true });
            setResource((prev) => {
              const prevItems = prev?.items ?? [];
              const newItems = _.filter(prevItems, i => !items.includes(i));
              return {
                className,
                items: newItems,
                count: Math.max(0, (prev?.count ?? 0) - items.length),
              };
            });
            alert.showSuccess(`${items.length} object(s) removed from relation successfully`);
          } else {
            // Regular delete
            await Promise.all(items.map(item => item.destroy({ master: true })));
            setResource((prev) => {
              const prevItems = prev?.items ?? [];
              const newItems = _.filter(prevItems, i => !items.includes(i));
              return {
                className,
                items: newItems,
                count: Math.max(0, (prev?.count ?? 0) - items.length),
              };
            });
            alert.showSuccess(`${items.length} object(s) deleted successfully`);
          }
        } catch (error) {
          console.error('Failed to delete items:', error);
          alert.showError(error instanceof Error ? error.message : 'Failed to delete items');
        }
      });
    },
    handleDeleteKeys: (item: TObject[], keys: string[]) => {
      startActivity(async () => {
        try {
          const updates: TObject[] = [];
          for (const obj of item) {
            const cloned = obj.clone();
            keys.forEach(key => cloned.set(key, null));
            updates.push(cloned);
          }
          await performSaves(updates);
          alert.showSuccess(`${keys.length} field(s) cleared in ${updates.length} object(s)`);
        } catch (error) {
          console.error('Failed to delete fields:', error);
          alert.showError(error instanceof Error ? error.message : 'Failed to delete fields');
        }
      });
    },
    handlePasteData: async (
      rows: number[],
      cols: Array<{ key: string; baseField: string; fieldType: TSchema['fields'][string] }>,
      data: any[][] | Record<string, any>[],
      type: 'json' | 'raw',
    ) => {
      // Determine mode: creating new objects vs updating existing
      const isCreating = rows[0] >= items.length;

      if (isCreating) {
        // MODE: Create new objects (paste into empty row)
        if (relationQuery && canEditInRelationMode) {
          // Add existing objects to relation by ID
          const idColumnIdx = _.findIndex(cols, col => col.key === '_id');
          if (idColumnIdx < 0) return;

          const objectsToAdd: TObject[] = [];

          for (const values of data) {
            const idValue = type === 'json' && !_.isArray(values) ? values._id : _.isArray(values) ? values[idColumnIdx] : undefined;
            if (idValue && _.isString(idValue)) {
              const targetField = schema?.fields[relationQuery.field.split('.')[0]];
              const targetClass = !_.isString(targetField) && targetField?.type === 'relation'
                ? targetField.target : className;
              const obj = await proto.Object(targetClass, idValue).fetch({ master: true });
              if (obj) objectsToAdd.push(obj);
            }
          }

          if (!_.isEmpty(objectsToAdd)) {
            const parentObj = proto.Object(relationQuery.className, relationQuery.objectId);
            parentObj.addToSet(relationQuery.field, objectsToAdd);
            await parentObj.save({ master: true });
            setResource((prev) => ({
              className,
              items: [...(prev?.items ?? []), ...objectsToAdd],
              count: (prev?.items ?? []).length + objectsToAdd.length,
            }));
            alert.showSuccess(`${objectsToAdd.length} object(s) added to relation successfully`);
          }
        } else {
          // Create new objects in normal mode
          const newObjects: TObject[] = [];
          const pendingPasswords: Array<{ obj: TObject; password: any }> = [];

          for (const values of data) {
            const obj = proto.Object(className);
            if (type === 'json' && !_.isArray(values)) {
              for (const [column, value] of _.toPairs(values)) {
                const baseField = column.split('.')[0];
                if (!_.includes(readonlyKeys, baseField)) {
                  if (className === 'User' && column === 'password') {
                    // Save password for later - must set after object is saved
                    pendingPasswords.push({ obj, password: value });
                  } else {
                    await obj.set(column, value as any);
                  }
                }
              }
            } else if (_.isArray(values)) {
              for (const [column, value] of _.zip(cols, values)) {
                if (column && !_.includes(readonlyKeys, column.baseField)) {
                  if (!_.isNil(value) && _.isString(value)) {
                    const decoded = await decodeRawValue(_typeOf(column.fieldType) ?? '', value);
                    if (!_.isNil(decoded)) {
                      if (className === 'User' && column.key === 'password') {
                        // Save password for later - must set after object is saved
                        pendingPasswords.push({ obj, password: decoded });
                      } else {
                        obj.set(column.key, decoded as any);
                      }
                    }
                  }
                }
              }
            }
            newObjects.push(obj);
          }

          if (!_.isEmpty(newObjects)) {
            await performSaves(newObjects);
            // Now set passwords for User objects
            for (const { obj, password } of pendingPasswords) {
              await proto.setPassword(obj, password, { master: true });
            }
            alert.showSuccess(`${newObjects.length} object(s) created successfully`);
          }
        }
      } else {
        // MODE: Update existing objects (paste into existing rows)
        const updates: TObject[] = [];
        const pendingPasswords: Array<{ obj: TObject; password: any }> = [];
        const targetRows = _.filter(rows, row => row < items.length);

        for (const [idx, row] of _.entries(targetRows)) {
          const item = items[row];
          const values = data[parseInt(idx)];
          if (!item || !values) continue;

          const obj = item.clone();
          let hasNonPasswordChanges = false;

          if (type === 'json' && !_.isArray(values)) {
            for (const [column, value] of _.toPairs(values)) {
              const baseField = column.split('.')[0];
              if (!_.includes(readonlyKeys, baseField)) {
                if (className === 'User' && column === 'password') {
                  // Save password for later - must be set after other fields are saved
                  pendingPasswords.push({ obj, password: value });
                } else {
                  await obj.set(column, value as any);
                  hasNonPasswordChanges = true;
                }
              }
            }
          } else if (_.isArray(values)) {
            for (const [column, value] of _.zip(cols, values)) {
              if (column && !_.includes(readonlyKeys, column.baseField)) {
                if (_.isNil(value)) {
                  obj.set(column.key, null);
                  hasNonPasswordChanges = true;
                } else if (_.isString(value)) {
                  const decoded = await decodeRawValue(_typeOf(column.fieldType) ?? '', value);
                  if (!_.isNil(decoded)) {
                    if (className === 'User' && column.key === 'password') {
                      // Save password for later - must be set after other fields are saved
                      pendingPasswords.push({ obj, password: decoded });
                    } else {
                      obj.set(column.key, decoded as any);
                      hasNonPasswordChanges = true;
                    }
                  }
                }
              }
            }
          }

          // Only add to updates if there are non-password changes
          if (hasNonPasswordChanges || pendingPasswords.some(p => p.obj === obj)) {
            updates.push(obj);
          }
        }

        if (!_.isEmpty(updates)) {
          await performSaves(updates);
          // Now set passwords for User objects (after other fields are saved)
          for (const { obj, password } of pendingPasswords) {
            await proto.setPassword(obj, password, { master: true });
          }
          alert.showSuccess(`${updates.length} object(s) updated successfully`);
        }
      }
    },
  });

  const encodeValue = (x: any) => {
    if (_.isNil(x)) return '';
    if (_.isNumber(x) || _.isBoolean(x) || _.isString(x)) return `${x}`;
    if (x instanceof Decimal) return x.toString();
    if (_.isDate(x)) return x.toISOString();
    if (proto.isObject(x)) return x.id ?? '';
    return serialize(x);
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      alignItems: 'stretch',
    }}>
      <div style={{
        padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
        borderBottom: `1px solid ${theme.colors['primary-200']}`,
        backgroundColor: theme.colors['primary-100'],
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.primary,
            }}>
              {className}
            </h2>
            <div style={{
              marginTop: theme.spacing.xs,
              fontSize: theme.fontSize.sm,
              color: theme.colorContrast(theme.colors['primary-100']),
              opacity: 0.7,
            }}>
              {count} {count === 1 ? 'record' : 'records'}
              {relationQuery && ` • Related to ${relationQuery.className}#${relationQuery.objectId}.${relationQuery.field}`}
              {!relationQuery && filter.length > 0 && ` • ${filter.length} ${filter.length === 1 ? 'filter' : 'filters'} active`}
            </div>
          </div>
          <Button
            variant={filter.length > 0 || relationQuery ? 'solid' : 'outline'}
            color="primary"
            size="sm"
            onClick={() => setShowFilterModal(true)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <Icon name="search" size="sm" />
              <span>Filters {filter.length > 0 && `(${filter.length})`}</span>
            </div>
          </Button>
        </div>
      </div>
      <FilterModal
        show={showFilterModal}
        schema={schema}
        currentFilters={filter}
        onApply={handleApplyFilters}
        onCancel={() => setShowFilterModal(false)}
      />
      <div style={{
        flex: 1,
        position: 'relative',
      }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'auto',
          }}
        >
          {schema && <DataSheet
            key={className}
            data={items}
            columns={expandedColumns.map(col => ({
              key: col.key,
              label: (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={(e) => {
                    // Only allow sorting by base field (not nested properties)
                    const sortKey = col.baseField;
                    updateSort({
                      ...e.shiftKey ? _.omit(sort, sortKey) : {},
                      [sortKey]: sort[sortKey] === 1 ? -1 : 1,
                    });
                  }}
                >
                  <span>{col.key}</span>
                  <span style={{
                    color: theme.colorContrast(theme.colors['primary-100']),
                    opacity: 0.5,
                    paddingLeft: theme.spacing.xs,
                  }}>({typeOf(col.fieldType)})</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    {sort[col.baseField] === 1 ? (
                      <Icon name="sortAsc" size="md" />
                    ) : sort[col.baseField] === -1 ? (
                      <Icon name="sortDesc" size="md" />
                    ) : null}
                  </span>
                </div>
              ),
            }))}
            showEmptyLastRow={true}
            columnWidth={expandedColumns.map(col => columnWidth[col.key] || 150)}
            startRowNumber={offset + 1}
            allowEditForCell={(row, col) => {
              const column = expandedColumns[col];
              if (!column) return false;

              // In empty last row, allow editing writable columns
              if (row >= items.length) {
                // In relation mode, only allow _id to add existing objects
                if (relationQuery && canEditInRelationMode) {
                  return column.key === '_id';
                }
                // In normal mode, allow any non-readonly column to create new objects
                return !readonlyKeys.includes(column.baseField);
              }

              // Can't edit system fields or the base field of system fields
              return !readonlyKeys.includes(column.baseField);
            }}
            onColumnWidthChange={(col, width) => {
              const column = expandedColumns[col];
              if (column) {
                setColumnWidth(prev => ({ ...prev, [column.key]: width }));
              }
            }}
            renderItem={({ item, columnKey, isEditing }) => (
              <TableCell
                item={item}
                column={columnKey}
                schema={schema}
                className={className}
                isEditing={isEditing}
                editingValue={editingValue}
                setEditingValue={setEditingValue}
              />
            )}
            encodeValue={(v, k) => encodeValue(v.get(k))}
            onStartEditing={(row, col) => {
              const column = expandedColumns[col];
              if (!column) return;
              const currentValue = items[row]?.get(column.key);
              setEditingValue(currentValue);
            }}
            onEndEditing={(row, col) => {
              const column = expandedColumns[col];
              if (!column) return;

              // Handle adding objects to relation by _id in empty rows
              if (row >= items.length && relationQuery && canEditInRelationMode && column.key === '_id') {
                if (editingValue && _.isString(editingValue)) {
                  startActivity(async () => {
                    try {
                      const targetClassName = schema?.fields[relationQuery.field.split('.')[0]];
                      const targetClass = !_.isString(targetClassName) && targetClassName?.type === 'relation'
                        ? targetClassName.target
                        : className;
                      const obj = await proto.Object(targetClass, editingValue).fetch({ master: true });

                      if (obj) {
                        const parentObj = proto.Object(relationQuery.className, relationQuery.objectId);
                        parentObj.addToSet(relationQuery.field, [obj]);
                        await parentObj.save({ master: true });

                        // Update local state
                        setResource((prev) => {
                          const prevItems = prev?.items ?? [];
                          const newItems = [...prevItems, obj];
                          return {
                            className,
                            items: newItems,
                            count: newItems.length,
                          };
                        });

                        alert.showSuccess(`Object ${obj.id} added to relation successfully`);
                      }
                    } catch (error) {
                      console.error('Failed to add object to relation:', error);
                      alert.showError(error instanceof Error ? error.message : 'Failed to add object to relation');
                    }
                  });
                }
                setEditingValue(undefined);
                return;
              }

              const item = items[row] ?? proto.Object(className);
              const currentValue = item.get(column.key);

              // Only save if value changed
              if (!_.isEqual(editingValue, currentValue)) {
                handleUpdateItem(item, column.key, editingValue);
              }

              setEditingValue(undefined);
            }}
            onPasteRows={(rows, clipboard) => {
              startActivity(async () => {
                try {
                  const { type, data } = await decodeClipboardData(clipboard, true) ?? {};
                  if (_.isEmpty(data) || !_.isArray(data) || !type) return;
                  await handlePasteData(rows, expandedColumns, data, type);
                } catch (error) {
                  console.error('Failed to paste data:', error);
                  alert.showError(error instanceof Error ? error.message : 'Failed to paste data');
                }
              });
            }}
            onPasteCells={(cells, clipboard) => {
              startActivity(async () => {
                try {
                  const rows = _.range(cells.start.row, cells.end.row + 1);
                  const cols = _.range(cells.start.col, cells.end.col + 1).map(c => expandedColumns[c]).filter(Boolean);
                  const { data } = await decodeClipboardData(clipboard, false) ?? {};
                  if (_.isEmpty(data) || !_.isArray(data)) return;
                  await handlePasteData(rows, cols, data, 'raw');
                } catch (error) {
                  console.error('Failed to paste data:', error);
                  alert.showError(error instanceof Error ? error.message : 'Failed to paste data');
                }
              });
            }}
            onDeleteRows={(rows) => {
              const selectedItems = _.compact(_.map(rows, row => items[row]));
              if (!_.isEmpty(selectedItems)) {
                handleDeleteItems(selectedItems);
              }
            }}
            onDeleteCells={(cells) => {
              const _rows = _.range(cells.start.row, cells.end.row + 1);
              const _cols = _.range(cells.start.col, cells.end.col + 1)
                .map(c => expandedColumns[c])
                .filter(Boolean);

              // Filter out readonly columns (check base field)
              const editableCols = _.filter(_cols, col => !_.includes(readonlyKeys, col.baseField))
                .map(col => col.key);
              const selectedItems = _.compact(_.map(_rows, row => items[row]));

              if (!_.isEmpty(editableCols) && !_.isEmpty(selectedItems)) {
                handleDeleteKeys(selectedItems, editableCols);
              }
            }}
          />}
        </div>
      </div>
      <div style={{
        padding: `${theme.spacing.md}px ${theme.spacing.xl}px`,
        borderTop: `1px solid ${theme.colors['primary-200']}`,
        backgroundColor: theme.colors['primary-100'],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontSize: theme.fontSize.sm,
          color: theme.colorContrast(theme.colors['primary-100']),
        }}>
          Showing {Math.min(offset + 1, count)} - {Math.min(offset + limit, count)} of {count}
        </div>
        <div style={{
          display: 'flex',
          gap: theme.spacing.xs,
          alignItems: 'center',
        }}>
          <Button
            variant="ghost"
            color="primary"
            size="sm"
            onClick={() => updateOffset(0)}
            disabled={offset === 0}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="chevronDoubleLeft" size="xs" />
              <span>First</span>
            </div>
          </Button>
          <Button
            variant="ghost"
            color="primary"
            size="sm"
            onClick={() => updateOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="chevronLeft" size="xs" />
              <span>Prev</span>
            </div>
          </Button>
          <div style={{
            padding: `0 ${theme.spacing.sm}px`,
            fontSize: theme.fontSize.sm,
            color: theme.colorContrast(theme.colors['primary-100']),
          }}>
            Page {Math.floor(offset / limit) + 1} of {Math.max(1, Math.ceil(count / limit))}
          </div>
          <Button
            variant="ghost"
            color="primary"
            size="sm"
            onClick={() => updateOffset(offset + limit)}
            disabled={offset + limit >= count}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>Next</span>
              <Icon name="chevronRight" size="xs" />
            </div>
          </Button>
          <Button
            variant="ghost"
            color="primary"
            size="sm"
            onClick={() => updateOffset(Math.floor((count - 1) / limit) * limit)}
            disabled={offset + limit >= count}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>Last</span>
              <Icon name="chevronDoubleRight" size="xs" />
            </div>
          </Button>
          <select
            value={`${limit}`}
            onChange={(e) => {
              const newLimit = parseInt(e.currentTarget.value);
              updateLimit(newLimit);
            }}
            style={{
              marginLeft: theme.spacing.md,
              padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
              fontSize: theme.fontSize.sm,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors['primary-300']}`,
              backgroundColor: '#ffffff',
              color: theme.colorContrast('#ffffff'),
            }}
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
            <option value="200">200 / page</option>
          </select>
        </div>
      </div>
    </div>
  );
};
