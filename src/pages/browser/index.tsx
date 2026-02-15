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
import { QueryFilter, TObject, useProto, useProtoSchema } from '../../proto';
import { _useCallbacks, useResource, useState } from 'frosty';
import { DataSheet } from '../../components/datasheet';
import { _typeOf, TableCell } from './cell';
import { useTheme } from '../../components/theme';
import { useAlert } from '../../components/alert';
import { useActivity } from '../../components/activity';
import { Decimal, deserialize, serialize } from 'proto.io';
import { Button } from '../../components/button';

// System fields that cannot be edited
const systemFields = ['_id', '_created_at', '_updated_at', '__v', '__i'];

// Search operators
const operators = [
  { value: '$eq', label: 'equals' },
  { value: '$ne', label: 'not equals' },
  { value: '$gt', label: 'greater than' },
  { value: '$gte', label: 'greater or equal' },
  { value: '$lt', label: 'less than' },
  { value: '$lte', label: 'less or equal' },
  { value: '$in', label: 'in' },
  { value: '$nin', label: 'not in' },
  { value: '$exists', label: 'exists' },
  { value: '$regex', label: 'matches regex' },
  { value: '$text', label: 'text search' },
];

// Type-specific operators
const getOperatorsForType = (type: string) => {
  switch (type) {
    case 'string':
      return ['$eq', '$ne', '$in', '$nin', '$exists', '$regex', '$text'];
    case 'number':
    case 'decimal':
    case 'date':
      return ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$exists'];
    case 'boolean':
      return ['$eq', '$ne', '$exists'];
    case 'pointer':
    case 'relation':
      return ['$eq', '$ne', '$in', '$nin', '$exists'];
    default:
      return ['$eq', '$ne', '$exists'];
  }
};

type FilterCriteria = {
  id: string;
  field: string;
  operator: string;
  value: string;
};

const FilterRow = ({
  criteria,
  fields,
  onUpdate,
  onRemove,
}: {
  criteria: FilterCriteria;
  fields: Record<string, any>;
  onUpdate: (updated: FilterCriteria) => void;
  onRemove: () => void;
}) => {
  const theme = useTheme();
  const fieldType = _typeOf(fields[criteria.field]);
  const availableOperators = getOperatorsForType(fieldType ?? '');

  return (
    <div style={{
      display: 'flex',
      gap: theme.spacing.sm,
      alignItems: 'center',
      padding: `${theme.spacing.sm}px 0`,
    }}>
      <select
        value={criteria.field}
        onChange={(e) => onUpdate({ ...criteria, field: e.currentTarget.value })}
        style={{
          flex: '0 0 200px',
          padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
          fontSize: theme.fontSize.sm,
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${theme.colors['primary-300']}`,
          backgroundColor: '#ffffff',
          color: theme.colorContrast('#ffffff'),
          '&:focus': {
            outline: 'none',
            borderColor: theme.colors.primary,
          },
        }}
      >
        <option value="">Select field...</option>
        {_.map(fields, (type, key) => (
          <option key={key} value={key}>
            {key} ({_.isString(type) ? type : type.type})
          </option>
        ))}
      </select>

      <select
        value={criteria.operator}
        onChange={(e) => onUpdate({ ...criteria, operator: e.currentTarget.value })}
        disabled={!criteria.field}
        style={{
          flex: '0 0 150px',
          padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
          fontSize: theme.fontSize.sm,
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${theme.colors['primary-300']}`,
          backgroundColor: '#ffffff',
          color: theme.colorContrast('#ffffff'),
          '&:focus': {
            outline: 'none',
            borderColor: theme.colors.primary,
          },
          '&:disabled': {
            opacity: 0.5,
            cursor: 'not-allowed',
          },
        }}
      >
        <option value="">Select operator...</option>
        {operators
          .filter(op => availableOperators.includes(op.value))
          .map(op => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
      </select>

      <input
        type="text"
        value={criteria.value}
        onChange={(e) => onUpdate({ ...criteria, value: e.currentTarget.value })}
        placeholder="Value..."
        disabled={!criteria.operator || criteria.operator === '$exists'}
        style={{
          flex: 1,
          padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
          fontSize: theme.fontSize.sm,
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${theme.colors['primary-300']}`,
          backgroundColor: '#ffffff',
          color: theme.colorContrast('#ffffff'),
          '&:focus': {
            outline: 'none',
            borderColor: theme.colors.primary,
          },
          '&:disabled': {
            opacity: 0.5,
            cursor: 'not-allowed',
          },
        }}
      />

      <Button
        variant="ghost"
        color="error"
        size="sm"
        onClick={onRemove}
        style={{
          flexShrink: 0,
        }}
      >
        ✕
      </Button>
    </div>
  );
};

export const BrowserPage = () => {
  const theme = useTheme();
  const alert = useAlert();
  const { schema: className } = useParams() as { schema: string; };
  const proto = useProto();
  const { [className]: schema } = useProtoSchema();

  const [searchCriteria, setSearchCriteria] = useState<FilterCriteria[]>([]);
  const [filter, setFilter] = useState<QueryFilter[]>([]);

  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<Record<string, 1 | -1>>({});

  const [columnWidth, setColumnWidth] = useState<Record<string, number>>({});

  const startActivity = useActivity();

  const {
    resource: {
      items = [],
      count = 0,
    } = {},
    setResource,
    refresh,
  } = useResource(async () => {
    const q = _.reduce(filter, (query, f) => query.filter(f), proto.Query(className));
    const count = await q.count();
    q.limit(limit);
    if (offset > 0) q.skip(offset);
    if (!_.isEmpty(sort)) q.sort(sort);
    return {
      count,
      items: await q.find({ master: true }),
    };
  }, [className, filter, limit, offset, sort]);

  const [editingValue, setEditingValue] = useState<any>();

  const readonlyKeys = [
    ...systemFields,
    ..._.keys(_.pickBy(schema?.fields, type => !_.isString(type) && type.type === 'relation' && !_.isNil(type.foreignField))),
  ];

  const {
    handleAddCriteria,
    handleUpdateCriteria,
    handleRemoveCriteria,
    handleApplyFilters,
    handleClearFilters,
  } = _useCallbacks({
    handleAddCriteria: () => {
      setSearchCriteria(prev => [
        ...prev,
        { id: `${Date.now()}-${Math.random()}`, field: '', operator: '', value: '' }
      ]);
    },
    handleUpdateCriteria: (updated: FilterCriteria) => {
      setSearchCriteria(prev => prev.map(c => c.id === updated.id ? updated : c));
    },
    handleRemoveCriteria: (id: string) => {
      setSearchCriteria(prev => prev.filter(c => c.id !== id));
    },
    handleApplyFilters: () => {
      const filters: QueryFilter[] = [];
      for (const criteria of searchCriteria) {
        if (!criteria.field || !criteria.operator) continue;

        const fieldType = _typeOf(schema?.fields[criteria.field]);
        let parsedValue: any = criteria.value;

        // Parse value based on field type and operator
        if (criteria.operator !== '$exists') {
          try {
            switch (fieldType) {
              case 'number':
                parsedValue = parseFloat(criteria.value);
                if (!_.isFinite(parsedValue)) continue;
                break;
              case 'decimal':
                parsedValue = new Decimal(criteria.value);
                if (!parsedValue.isFinite()) continue;
                break;
              case 'boolean':
                parsedValue = criteria.value.toLowerCase() === 'true';
                break;
              case 'date':
                parsedValue = new Date(criteria.value);
                if (!_.isFinite(parsedValue.valueOf())) continue;
                break;
              case 'array':
              case 'object':
              case 'string[]':
                if (criteria.operator === '$in' || criteria.operator === '$nin') {
                  parsedValue = criteria.value.split(',').map(v => v.trim());
                } else {
                  parsedValue = deserialize(criteria.value);
                }
                break;
              case 'pointer':
                if (criteria.operator === '$in' || criteria.operator === '$nin') {
                  parsedValue = criteria.value.split(',').map(v => v.trim());
                } else {
                  parsedValue = criteria.value;
                }
                break;
              default:
                if (criteria.operator === '$in' || criteria.operator === '$nin') {
                  parsedValue = criteria.value.split(',').map(v => v.trim());
                }
                break;
            }
          } catch (error) {
            console.error('Failed to parse filter value:', error);
            continue;
          }
        }

        // Create filter object
        if (criteria.operator === '$exists') {
          filters.push({ [criteria.field]: { $exists: true } });
        } else if (criteria.operator === '$eq') {
          filters.push({ [criteria.field]: parsedValue });
        } else {
          filters.push({ [criteria.field]: { [criteria.operator]: parsedValue } });
        }
      }
      setFilter(filters);
      setOffset(0); // Reset pagination when filters change
    },
    handleClearFilters: () => {
      setSearchCriteria([]);
      setFilter([]);
      setOffset(0);
    },
  });

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
          cloned.set(columnKey, value);
          await performSaves([cloned]);
          alert.showSuccess(`Object ${item.id} updated successfully`);
        } catch (error) {
          console.error('Failed to update item:', error);
          alert.showError(error instanceof Error ? error.message : 'Failed to update item');
        }
      });
    },
    handleDeleteItems: (items: TObject[]) => {
      startActivity(async () => {
        try {
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
          {filter.length > 0 && ` (${filter.length} ${filter.length === 1 ? 'filter' : 'filters'} applied)`}
        </div>
      </div>
      <div style={{
        padding: `${theme.spacing.md}px ${theme.spacing.xl}px`,
        borderBottom: `1px solid ${theme.colors['primary-200']}`,
        backgroundColor: '#ffffff',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: searchCriteria.length > 0 ? theme.spacing.md : 0,
        }}>
          <h3 style={{
            margin: 0,
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colorContrast('#ffffff'),
          }}>
            Search Criteria
          </h3>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <Button
              variant="outline"
              color="primary"
              size="sm"
              onClick={handleAddCriteria}
            >
              + Add Filter
            </Button>
            {(searchCriteria.length > 0 || filter.length > 0) && (
              <>
                <Button
                  variant="solid"
                  color="primary"
                  size="sm"
                  onClick={handleApplyFilters}
                  disabled={searchCriteria.length === 0}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="ghost"
                  color="error"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  Clear All
                </Button>
              </>
            )}
          </div>
        </div>
        {searchCriteria.length > 0 && schema && (
          <div style={{
            backgroundColor: theme.colors['primary-100'],
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
          }}>
            {searchCriteria.map((criteria) => (
              <FilterRow
                key={criteria.id}
                criteria={criteria}
                fields={schema.fields}
                onUpdate={handleUpdateCriteria}
                onRemove={() => handleRemoveCriteria(criteria.id)}
              />
            ))}
          </div>
        )}
        {filter.length > 0 && (
          <div style={{
            marginTop: theme.spacing.md,
            fontSize: theme.fontSize.sm,
            color: theme.colorContrast('#ffffff'),
            opacity: 0.7,
          }}>
            Active filters: {filter.length}
          </div>
        )}
      </div>
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
            columns={_.map(schema.fields, (v, k) => ({
              key: k,
              label: (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={(e) => {
                    setSort(sort => ({
                      ...e.shiftKey ? _.omit(sort, k) : {},
                      [k]: sort[k] === 1 ? -1 : 1,
                    }));
                  }}
                >
                  <span>{k}</span>
                  <span style={{
                    color: theme.colorContrast(theme.colors['primary-100']),
                    opacity: 0.5,
                    paddingLeft: theme.spacing.xs,
                  }}>({_.isString(v) ? v : v.type})</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    {sort[k] === 1 ? (
                      <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                        <path d="M6 3L9 7H3L6 3Z" fill="currentColor" />
                      </svg>
                    ) : sort[k] === -1 ? (
                      <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                        <path d="M6 9L3 5H9L6 9Z" fill="currentColor" />
                      </svg>
                    ) : null}
                  </span>
                </div>
              ),
            }))}
            showEmptyLastRow
            columnWidth={_.keys(schema.fields).map(key => columnWidth[key] || 150)}
            startRowNumber={offset + 1}
            allowEditForCell={(row, col) => {
              const columnKey = _.keys(schema.fields)[col];
              return !readonlyKeys.includes(columnKey);
            }}
            onColumnWidthChange={(col, width) => {
              const columnKey = _.keys(schema.fields)[col];
              setColumnWidth(prev => ({ ...prev, [columnKey]: width }));
            }}
            renderItem={({ item, columnKey, isEditing }) => (
              <TableCell
                item={item}
                column={columnKey}
                schema={schema}
                isEditing={isEditing}
                editingValue={editingValue}
                setEditingValue={setEditingValue}
              />
            )}
            encodeValue={(v, k) => encodeValue(v.get(k))}
            onStartEditing={(row, col) => {
              const columnKey = _.keys(schema.fields)[col];
              const currentValue = items[row]?.get(columnKey);
              setEditingValue(currentValue);
            }}
            onEndEditing={(row, col) => {
              const columnKey = _.keys(schema.fields)[col];
              const item = items[row] ?? proto.Object(className);
              const currentValue = item.get(columnKey);

              // Only save if value changed
              if (!_.isEqual(editingValue, currentValue)) {
                handleUpdateItem(item, columnKey, editingValue);
              }

              setEditingValue(undefined);
            }}
            onPasteRows={(rows, clipboard) => {
              startActivity(async () => {
                try {
                  const { type, data } = await decodeClipboardData(clipboard, true) ?? {};
                  if (_.isEmpty(data) || !_.isArray(data)) return;
                  const objs = _.compact(_.map(rows, row => items[row]));
                  const updates: TObject[] = [];
                  if (type === 'json') {
                    for (const [obj, values] of _.zip(objs, data)) {
                      const _obj = obj?.clone() ?? proto.Object(className);
                      for (const [column, value] of _.toPairs(values)) {
                        if (!_.includes(readonlyKeys, column)) {
                          await _obj.set(column, value);
                        }
                      }
                      updates.push(_obj);
                    }
                  } else if (type === 'raw') {
                    for (const [obj, values] of _.zip(objs, data)) {
                      const _obj = obj?.clone() ?? proto.Object(className);
                      for (const [column = '', value] of _.zip(_.keys(schema.fields), values)) {
                        if (!_.includes(readonlyKeys, column)) {
                          if (_.isNil(value)) {
                            if (_obj.id) _obj.set(column, null);
                          } else if (_.isString(value)) {
                            const _value = await decodeRawValue(_typeOf(schema.fields[column]) ?? '', value);
                            if (!_.isNil(_value)) _obj.set(column, _value as any);
                          } else {
                            throw Error(`Invalid value for column ${column}: ${value}`);
                          }
                        }
                      }
                      updates.push(_obj);
                    }
                  }
                  await performSaves(updates);
                  alert.showSuccess(`${updates.length} object(s) updated successfully`);
                } catch (error) {
                  console.error('Failed to paste data:', error);
                  alert.showError(error instanceof Error ? error.message : 'Failed to paste data');
                }
              });
            }}
            onPasteCells={(cells, clipboard) => {
              startActivity(async () => {
                try {
                  const _columns = _.keys(schema.fields);
                  const _rows = _.range(cells.start.row, cells.end.row + 1);
                  const _cols = _.range(cells.start.col, cells.end.col + 1).map(c => _columns[c]);
                  const { data } = await decodeClipboardData(clipboard, false) ?? {};
                  if (_.isEmpty(data) || !_.isArray(data)) return;
                  const objs = _.compact(_.map(_rows, row => items[row]));
                  const updates: TObject[] = [];
                  for (const [obj, values] of _.zip(objs, data)) {
                    const _obj = obj?.clone() ?? proto.Object(className);
                    for (const [column = '', value] of _.zip(_cols, values)) {
                      if (!_.includes(readonlyKeys, column)) {
                        if (_.isNil(value)) {
                          if (_obj.id) _obj.set(column, null);
                        } else if (_.isString(value)) {
                          const _value = await decodeRawValue(_typeOf(schema.fields[column]) ?? '', value);
                          if (!_.isNil(_value)) _obj.set(column, _value as any);
                        } else {
                          throw Error(`Invalid value for column ${column}: ${value}`);
                        }
                      }
                    }
                    updates.push(_obj);
                  }
                  await performSaves(updates);
                  alert.showSuccess(`${updates.length} object(s) updated successfully`);
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
              const _columns = _.keys(schema.fields);
              const _rows = _.range(cells.start.row, cells.end.row + 1);
              const _cols = _.range(cells.start.col, cells.end.col + 1).map(c => _columns[c]);

              // Filter out readonly columns
              const editableCols = _.filter(_cols, col => !_.includes(readonlyKeys, col));
              const selectedItems = _.compact(_.map(_rows, row => items[row]));

              if (!_.isEmpty(editableCols) && !_.isEmpty(selectedItems)) {
                handleDeleteKeys(selectedItems, editableCols);
              }
            }}
          />}
        </div>
      </div>
    </div>
  );
};
