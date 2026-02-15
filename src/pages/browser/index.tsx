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
import { _useCallbacks, useEffect, useMemo, useResource, useState } from 'frosty';
import { useLocation } from 'frosty/web';
import { DataSheet } from '../../components/datasheet';
import { _typeOf, typeOf } from './utils';
import { TableCell } from './cell';
import { useTheme } from '../../components/theme';
import { useAlert } from '../../components/alert';
import { useActivity } from '../../components/activity';
import { Decimal, deserialize, serialize } from 'proto.io';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { FilterModal } from './filter';

// System fields that cannot be edited
const systemFields = ['_id', '_created_at', '_updated_at', '__v', '__i'];
const readonlyKeysForSchema = (schema?: TSchema) => {
  if (!schema) return systemFields;
  return [
    ...systemFields,
    ..._.keys(_.pickBy(schema.fields, type => !_.isString(type) && type.type === 'relation' && !_.isNil(type.foreignField))),
  ];
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
  const location = useLocation();

  const [filter, setFilter] = useState<QueryFilter[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [relationQuery, setRelationQuery] = useState<{ className: string; objectId: string; field: string } | null>(null);

  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<Record<string, 1 | -1>>({});

  const [columnWidth, setColumnWidth] = useState<Record<string, number>>({});

  const startActivity = useActivity();

  // Expand columns from schema  
  const expandedColumns = useMemo(() => schema ? expandColumns(schema.fields) : [], [schema]);

  // Read filter from URL query params (e.g., ?id=123 or ?relationOf=User&relationId=123&relationField=posts)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const relationOf = params.get('relationOf');
    const relationId = params.get('relationId');
    const relationField = params.get('relationField');

    if (id) {
      setFilter([{ _id: { $eq: id } }]);
      setRelationQuery(null);
    } else if (relationOf && relationId && relationField) {
      // Store relation query params to use proto.Relation in the query
      setRelationQuery({ className: relationOf, objectId: relationId, field: relationField });
      setFilter([]);
    } else {
      setFilter([]);
      setRelationQuery(null);
    }
  }, [location.search]);

  const {
    resource: {
      items = [],
      count = 0,
    } = {},
    setResource,
    refresh,
  } = useResource(async () => {
    // Build query: either from relation or regular query with filters
    const q = relationQuery
      ? proto.Relation(proto.Object(relationQuery.className, relationQuery.objectId), relationQuery.field)
      : _.reduce(filter, (query, f) => query.filter(f), proto.Query(className));

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
    setFilter(filters);
    setOffset(0);
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
        return deserialize(value);
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
        items: newItems,
        count: prev?.count ?? newItems.length,
      };
    });
  };

  const {
    handleUpdateItem,
    handleDeleteItems,
    handleDeleteKeys,
  } = _useCallbacks({
    handleUpdateItem: (item: TObject, columnKey: string, value: any) => {
      startActivity(async () => {
        try {
          const cloned = item.clone();
          const isNewItem = !item.id;
          // Handle file upload - check if value is a browser File object
          if (value instanceof File) {
            // Upload the file to proto.io
            const protoFile = proto.File(value.name, value);
            await protoFile.save({ master: true });
            cloned.set(columnKey, protoFile);
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
            disabled={!!relationQuery}
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
                    setSort(sort => ({
                      ...e.shiftKey ? _.omit(sort, sortKey) : {},
                      [sortKey]: sort[sortKey] === 1 ? -1 : 1,
                    }));
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
                  if (_.isEmpty(data) || !_.isArray(data)) return;

                  // Check if pasting into empty rows (for adding to relation)
                  const emptyRows = _.filter(rows, row => row >= items.length);
                  const existingRows = _.filter(rows, row => row < items.length);

                  // Handle adding objects to relation by ID when pasting into empty rows
                  if (!_.isEmpty(emptyRows) && relationQuery && canEditInRelationMode) {
                    const objectsToAdd: TObject[] = [];

                    // Find _id column index
                    const idColumnIdx = _.findIndex(expandedColumns, col => col.key === '_id');

                    if (type === 'json') {
                      // When pasting JSON with _id field
                      for (const values of data.slice(0, emptyRows.length)) {
                        if (values._id && _.isString(values._id)) {
                          const targetClassName = schema?.fields[relationQuery.field.split('.')[0]];
                          const targetClass = !_.isString(targetClassName) && targetClassName?.type === 'relation'
                            ? targetClassName.target
                            : className;
                          const obj = await proto.Object(targetClass, values._id).fetch({ master: true });
                          if (obj) objectsToAdd.push(obj);
                        }
                      }
                    } else if (type === 'raw' && idColumnIdx >= 0) {
                      // When pasting raw data with _id column
                      for (const values of data.slice(0, emptyRows.length)) {
                        const idValue = values[idColumnIdx];
                        if (idValue && _.isString(idValue)) {
                          const targetClassName = schema?.fields[relationQuery.field.split('.')[0]];
                          const targetClass = !_.isString(targetClassName) && targetClassName?.type === 'relation'
                            ? targetClassName.target
                            : className;
                          const obj = await proto.Object(targetClass, idValue).fetch({ master: true });
                          if (obj) objectsToAdd.push(obj);
                        }
                      }
                    }

                    // Add objects to relation
                    if (!_.isEmpty(objectsToAdd)) {
                      const parentObj = proto.Object(relationQuery.className, relationQuery.objectId);
                      parentObj.addToSet(relationQuery.field, objectsToAdd);
                      await parentObj.save({ master: true });

                      // Update local state
                      setResource((prev) => {
                        const prevItems = prev?.items ?? [];
                        const newItems = [...prevItems, ...objectsToAdd];
                        return {
                          items: newItems,
                          count: newItems.length,
                        };
                      });

                      alert.showSuccess(`${objectsToAdd.length} object(s) added to relation successfully`);
                    }
                  } else if (!_.isEmpty(emptyRows) && !relationQuery) {
                    // Handle creating new objects in normal query mode
                    const newObjects: TObject[] = [];
                    const startIdx = _.indexOf(rows, emptyRows[0]);

                    if (type === 'json') {
                      // When pasting JSON data
                      for (const values of data.slice(startIdx, startIdx + emptyRows.length)) {
                        const _obj = proto.Object(className);
                        for (const [column, value] of _.toPairs(values)) {
                          const baseField = column.split('.')[0];
                          if (!_.includes(readonlyKeys, baseField)) {
                            await _obj.set(column, value);
                          }
                        }
                        newObjects.push(_obj);
                      }
                    } else if (type === 'raw') {
                      // When pasting raw data
                      for (const values of data.slice(startIdx, startIdx + emptyRows.length)) {
                        const _obj = proto.Object(className);
                        for (const [column, value] of _.zip(expandedColumns, values)) {
                          if (!column) continue;

                          if (!_.includes(readonlyKeys, column.baseField)) {
                            if (!_.isNil(value) && _.isString(value)) {
                              const _value = await decodeRawValue(_typeOf(column.fieldType) ?? '', value);
                              if (!_.isNil(_value)) _obj.set(column.key, _value as any);
                            }
                          }
                        }
                        newObjects.push(_obj);
                      }
                    }

                    if (!_.isEmpty(newObjects)) {
                      await performSaves(newObjects);
                      alert.showSuccess(`${newObjects.length} object(s) created successfully`);
                    }
                  }

                  // Handle updating existing rows
                  if (!_.isEmpty(existingRows)) {
                    const objs = _.compact(_.map(existingRows, row => items[row]));
                    const updates: TObject[] = [];
                    const startIdx = _.indexOf(rows, existingRows[0]);

                    if (type === 'json') {
                      for (const [obj, values] of _.zip(objs, data.slice(startIdx))) {
                        const _obj = obj?.clone() ?? proto.Object(className);
                        for (const [column, value] of _.toPairs(values)) {
                          // Proto handles dot notation automatically - extract base field for readonly check
                          const baseField = column.split('.')[0];
                          if (!_.includes(readonlyKeys, baseField)) {
                            await _obj.set(column, value);
                          }
                        }
                        updates.push(_obj);
                      }
                    } else if (type === 'raw') {
                      for (const [obj, values] of _.zip(objs, data.slice(startIdx))) {
                        const _obj = obj?.clone() ?? proto.Object(className);
                        for (const [column, value] of _.zip(expandedColumns, values)) {
                          if (!column) continue;

                          if (!_.includes(readonlyKeys, column.baseField)) {
                            if (_.isNil(value)) {
                              if (_obj.id) _obj.set(column.key, null);
                            } else if (_.isString(value)) {
                              const _value = await decodeRawValue(_typeOf(column.fieldType) ?? '', value);
                              if (!_.isNil(_value)) _obj.set(column.key, _value as any);
                            } else {
                              throw Error(`Invalid value for column ${column.key}: ${value}`);
                            }
                          }
                        }
                        updates.push(_obj);
                      }
                    }

                    if (!_.isEmpty(updates)) {
                      await performSaves(updates);
                      alert.showSuccess(`${updates.length} object(s) updated successfully`);
                    }
                  }
                } catch (error) {
                  console.error('Failed to paste data:', error);
                  alert.showError(error instanceof Error ? error.message : 'Failed to paste data');
                }
              });
            }}
            onPasteCells={(cells, clipboard) => {
              startActivity(async () => {
                try {
                  const _rows = _.range(cells.start.row, cells.end.row + 1);
                  const _cols = _.range(cells.start.col, cells.end.col + 1).map(c => expandedColumns[c]).filter(Boolean);
                  const { data } = await decodeClipboardData(clipboard, false) ?? {};
                  if (_.isEmpty(data) || !_.isArray(data)) return;

                  // Check if pasting into empty rows (for adding to relation)
                  const emptyRows = _.filter(_rows, row => row >= items.length);
                  const existingRows = _.filter(_rows, row => row < items.length);

                  // Handle adding objects to relation by ID when pasting _id column into empty rows
                  if (!_.isEmpty(emptyRows) && relationQuery && canEditInRelationMode) {
                    const idColumn = _.find(_cols, col => col.key === '_id');
                    const idColumnIdx = idColumn ? _.indexOf(_cols, idColumn) : -1;

                    if (idColumnIdx >= 0) {
                      const objectsToAdd: TObject[] = [];

                      for (const values of data.slice(0, emptyRows.length)) {
                        const idValue = values[idColumnIdx];
                        if (idValue && _.isString(idValue)) {
                          const targetClassName = schema?.fields[relationQuery.field.split('.')[0]];
                          const targetClass = !_.isString(targetClassName) && targetClassName?.type === 'relation'
                            ? targetClassName.target
                            : className;
                          const obj = await proto.Object(targetClass, idValue).fetch({ master: true });
                          if (obj) objectsToAdd.push(obj);
                        }
                      }

                      // Add objects to relation
                      if (!_.isEmpty(objectsToAdd)) {
                        const parentObj = proto.Object(relationQuery.className, relationQuery.objectId);
                        parentObj.addToSet(relationQuery.field, objectsToAdd);
                        await parentObj.save({ master: true });

                        // Update local state
                        setResource((prev) => {
                          const prevItems = prev?.items ?? [];
                          const newItems = [...prevItems, ...objectsToAdd];
                          return {
                            items: newItems,
                            count: newItems.length,
                          };
                        });

                        alert.showSuccess(`${objectsToAdd.length} object(s) added to relation successfully`);
                      }
                    }
                  } else if (!_.isEmpty(emptyRows) && !relationQuery) {
                    // Handle creating new objects in normal query mode
                    const newObjects: TObject[] = [];
                    const startIdx = _.indexOf(_rows, emptyRows[0]);

                    for (const values of data.slice(startIdx, startIdx + emptyRows.length)) {
                      const _obj = proto.Object(className);
                      for (const [column, value] of _.zip(_cols, values)) {
                        if (!column) continue;

                        if (!_.includes(readonlyKeys, column.baseField)) {
                          if (!_.isNil(value) && _.isString(value)) {
                            const _value = await decodeRawValue(_typeOf(column.fieldType) ?? '', value);
                            if (!_.isNil(_value)) _obj.set(column.key, _value as any);
                          }
                        }
                      }
                      newObjects.push(_obj);
                    }

                    if (!_.isEmpty(newObjects)) {
                      await performSaves(newObjects);
                      alert.showSuccess(`${newObjects.length} object(s) created successfully`);
                    }
                  }

                  // Handle updating existing rows
                  if (!_.isEmpty(existingRows)) {
                    const objs = _.compact(_.map(existingRows, row => items[row]));
                    const updates: TObject[] = [];
                    const startIdx = _.indexOf(_rows, existingRows[0]);

                    for (const [obj, values] of _.zip(objs, data.slice(startIdx))) {
                      const _obj = obj?.clone() ?? proto.Object(className);
                      for (const [column, value] of _.zip(_cols, values)) {
                        if (!column) continue;

                        if (!_.includes(readonlyKeys, column.baseField)) {
                          if (_.isNil(value)) {
                            if (_obj.id) _obj.set(column.key, null);
                          } else if (_.isString(value)) {
                            const _value = await decodeRawValue(_typeOf(column.fieldType) ?? '', value);
                            if (!_.isNil(_value)) _obj.set(column.key, _value as any);
                          } else {
                            throw Error(`Invalid value for column ${column.key}: ${value}`);
                          }
                        }
                      }
                      updates.push(_obj);
                    }

                    if (!_.isEmpty(updates)) {
                      await performSaves(updates);
                      alert.showSuccess(`${updates.length} object(s) updated successfully`);
                    }
                  }
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
            onClick={() => setOffset(0)}
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
            onClick={() => setOffset(Math.max(0, offset - limit))}
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
            onClick={() => setOffset(offset + limit)}
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
            onClick={() => setOffset(Math.floor((count - 1) / limit) * limit)}
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
              setLimit(newLimit);
              setOffset(0);
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
