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
import { DataSheet } from '../../components/datasheet';
import { _typeOf, typeOf } from './utils';
import { TableCell } from './cell';
import { useTheme } from '../../components/theme';
import { useAlert } from '../../components/alert';
import { useActivity } from '../../components/activity';
import { Decimal, deserialize, serialize } from 'proto.io';
import { Button } from '../../components/button';
import { Modal } from '../../components/modal';
import { Icon } from '../../components/icon';

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
  { value: '$filter', label: 'custom filter' },
];

// Type-specific operators
const getOperatorsForType = (type: string) => {
  switch (type) {
    case 'string':
      return ['$eq', '$ne', '$in', '$nin', '$exists', '$regex', '$text', '$filter'];
    case 'number':
    case 'decimal':
    case 'date':
      return ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$exists', '$filter'];
    case 'boolean':
      return ['$eq', '$ne', '$exists', '$filter'];
    case 'pointer':
    case 'relation':
      return ['$eq', '$ne', '$in', '$nin', '$exists', '$filter'];
    default:
      return ['$eq', '$ne', '$exists', '$filter'];
  }
};

type GroupFilterCriteria = {
  id: string;
  operator: '$and' | '$or';
  children: FilterCriteria[];
};

type CustomFilterCriteria = {
  id: string;
  operator: '$filter';
  value: string;
};

type FieldFilterCriteria = {
  id: string;
  operator: string; // $eq, $ne, $gt, etc.
  field: string;
  value: string;
};

type FilterCriteria = GroupFilterCriteria | CustomFilterCriteria | FieldFilterCriteria;

const FilterItem = ({
  criteria,
  fields,
  onUpdate,
  onRemove,
  depth = 0,
}: {
    criteria: FilterCriteria;
  fields: Record<string, any>;
    onUpdate: (updated: FilterCriteria) => void;
  onRemove: () => void;
  depth?: number;
}) => {
  const theme = useTheme();

  // Group operators ($and, $or)
  if (criteria.operator === '$and' || criteria.operator === '$or') {
    const group = criteria as GroupFilterCriteria;

    const addFilter = () => {
      onUpdate({
        ...group,
        children: [
          ...group.children,
          { id: `${Date.now()}-${Math.random()}`, operator: '', field: '', value: '' } as FieldFilterCriteria,
        ],
      });
    };

    const updateChild = (index: number, updated: FilterCriteria) => {
      const newChildren = [...group.children];
      newChildren[index] = updated;
      onUpdate({ ...group, children: newChildren });
    };

    const removeChild = (index: number) => {
      onUpdate({ ...group, children: group.children.filter((_, i) => i !== index) });
    };

    return (
      <div style={{
        marginLeft: depth > 0 ? `${theme.spacing.md}px` : 0,
        padding: theme.spacing.xs,
        border: `1px solid ${group.operator === '$and' ? theme.colors['primary-300'] : theme.colors['tint-300']}`,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: group.operator === '$and' ? theme.colors['primary-100'] : theme.colors['tint-100'],
        marginBottom: theme.spacing.xs,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          marginBottom: group.children.length > 0 ? theme.spacing.xs : 0,
        }}>
          {depth > 0 ? (
            <select
              value={group.operator}
              onChange={(e) => {
                const newOp = e.currentTarget.value;
                if (newOp === '$and' || newOp === '$or') {
                  onUpdate({ ...group, operator: newOp });
                } else if (newOp === '$filter') {
                  onUpdate({ id: group.id, operator: '$filter', value: '' } as CustomFilterCriteria);
                } else {
                  // Convert to field filter
                  onUpdate({ id: group.id, operator: newOp, field: '', value: '' } as FieldFilterCriteria);
                }
              }}
              style={{
                padding: `2px ${theme.spacing.xs}px`,
                fontSize: theme.fontSize.xs,
                fontWeight: theme.fontWeight.semibold,
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors['primary-400']}`,
                backgroundColor: '#ffffff',
                color: theme.colorContrast('#ffffff'),
                '&:focus': {
                  outline: 'none',
                  borderColor: theme.colors.primary,
                },
              }}
            >
              <option value="$and">AND</option>
              <option value="$or">OR</option>
              <option value="$filter">custom filter</option>
              <optgroup label="Field Operators">
                {operators.filter(op => op.value !== '$filter').map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </optgroup>
            </select>
          ) : null}
          <span style={{
            fontSize: theme.fontSize.xs,
            color: theme.colorContrast(group.operator === '$and' ? theme.colors['primary-100'] : theme.colors['tint-100']),
            opacity: 0.6,
          }}>
            ({group.children.length})
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
            <button
              onClick={addFilter}
              title="Add filter"
              style={{
                padding: `2px ${theme.spacing.xs}px`,
                fontSize: theme.fontSize.xs,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: theme.colors.primary,
                opacity: 0.7,
                '&:hover': { opacity: 1 },
              }}
            >
              + Filter
            </button>
            {depth > 0 && (
              <button
                onClick={onRemove}
                title="Remove"
                style={{
                  padding: `2px ${theme.spacing.xs}px`,
                  fontSize: theme.fontSize.xs,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: theme.colors.error,
                  opacity: 0.7,
                  '&:hover': { opacity: 1 },
                }}
              >
                <Icon name="close" size="xs" />
              </button>
            )}
          </div>
        </div>
        {group.children.map((child, index) => (
          <FilterItem
            key={child.id}
            criteria={child}
            fields={fields}
            onUpdate={(updated) => updateChild(index, updated)}
            onRemove={() => removeChild(index)}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  // Custom filter ($filter)
  if (criteria.operator === '$filter') {
    const custom = criteria as CustomFilterCriteria;
    return (
      <div style={{
        display: 'flex',
        gap: theme.spacing.xs,
        alignItems: 'flex-start',
        padding: `${theme.spacing.xs}px 0`,
      }}>
        <select
          value={custom.operator}
          onChange={(e) => {
            const newOp = e.currentTarget.value;
            if (newOp === '$and' || newOp === '$or') {
              onUpdate({ id: custom.id, operator: newOp, children: [] } as GroupFilterCriteria);
            } else if (newOp === '$filter') {
              // Keep as is
            } else {
              // Convert to field filter
              onUpdate({ id: custom.id, operator: newOp, field: '', value: '' } as FieldFilterCriteria);
            }
          }}
          style={{
            flex: '0 0 140px',
            padding: `2px ${theme.spacing.xs}px`,
            fontSize: theme.fontSize.xs,
            borderRadius: theme.borderRadius.sm,
            border: `1px solid ${theme.colors['primary-300']}`,
            backgroundColor: '#ffffff',
            color: theme.colorContrast('#ffffff'),
            '&:focus': {
              outline: 'none',
              borderColor: theme.colors.primary,
            },
          }}
        >
          <option value="$and">AND</option>
          <option value="$or">OR</option>
          <option value="$filter">custom filter</option>
          <optgroup label="Field Operators">
            {operators.filter(op => op.value !== '$filter').map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </optgroup>
        </select>

        <textarea
          value={custom.value}
          onChange={(e) => onUpdate({ ...custom, value: e.currentTarget.value })}
          placeholder={'e.g. {"field": {"$gt": 10, "$lt": 100}}'}
          rows={2}
          style={{
            flex: 1,
            padding: `2px ${theme.spacing.xs}px`,
            fontSize: theme.fontSize.xs,
            borderRadius: theme.borderRadius.sm,
            border: `1px solid ${theme.colors['primary-300']}`,
            backgroundColor: '#ffffff',
            color: theme.colorContrast('#ffffff'),
            fontFamily: 'monospace',
            resize: 'vertical' as const,
            '&:focus': {
              outline: 'none',
              borderColor: theme.colors.primary,
            },
          }}
        />

        <button
          onClick={onRemove}
          title="Remove"
          style={{
            padding: `2px ${theme.spacing.xs}px`,
            fontSize: theme.fontSize.xs,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: theme.colors.error,
            opacity: 0.7,
            flexShrink: 0,
            '&:hover': { opacity: 1 },
          }}
        >
          <Icon name="close" size="xs" />
        </button>
      </div>
    );
  }

  // Field filter (regular operators like $eq, $ne, etc.)
  const field = criteria as FieldFilterCriteria;
  const fieldType = field.field ? _typeOf(fields[field.field]) : '';
  const availableOperators = getOperatorsForType(fieldType ?? '');

  return (
    <div style={{
      display: 'flex',
      gap: theme.spacing.xs,
      alignItems: 'flex-start',
      padding: `${theme.spacing.xs}px 0`,
    }}>
      <select
        value={field.operator}
        onChange={(e) => {
          const newOp = e.currentTarget.value;
          if (newOp === '$and' || newOp === '$or') {
            onUpdate({ id: field.id, operator: newOp, children: [] } as GroupFilterCriteria);
          } else if (newOp === '$filter') {
            onUpdate({ id: field.id, operator: '$filter', value: '' } as CustomFilterCriteria);
          } else {
            onUpdate({ ...field, operator: newOp });
          }
        }}
        style={{
          flex: '0 0 140px',
          padding: `2px ${theme.spacing.xs}px`,
          fontSize: theme.fontSize.xs,
          borderRadius: theme.borderRadius.sm,
          border: `1px solid ${theme.colors['primary-300']}`,
          backgroundColor: '#ffffff',
          color: theme.colorContrast('#ffffff'),
          '&:focus': {
            outline: 'none',
            borderColor: theme.colors.primary,
          },
        }}
      >
        <option value="">Select Operator</option>
        <option value="$and">AND</option>
        <option value="$or">OR</option>
        <option value="$filter">custom filter</option>
        <optgroup label="Field Operators">
          {operators.filter(op => op.value !== '$filter' && availableOperators.includes(op.value)).map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </optgroup>
      </select>

      <select
        value={field.field}
        onChange={(e) => onUpdate({ ...field, field: e.currentTarget.value })}
        disabled={!field.operator || field.operator === '$and' || field.operator === '$or' || field.operator === '$filter'}
        style={{
          flex: '0 0 160px',
          padding: `2px ${theme.spacing.xs}px`,
          fontSize: theme.fontSize.xs,
          borderRadius: theme.borderRadius.sm,
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
        <option value="">Select Field</option>
        {_.map(fields, (type, key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={field.value}
        onChange={(e) => onUpdate({ ...field, value: e.currentTarget.value })}
        placeholder="Enter Value"
        disabled={!field.operator || field.operator === '$exists'}
        style={{
          flex: 1,
          padding: `2px ${theme.spacing.xs}px`,
          fontSize: theme.fontSize.xs,
          borderRadius: theme.borderRadius.sm,
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

      <button
        onClick={onRemove}
        title="Remove"
        style={{
          padding: `2px ${theme.spacing.xs}px`,
          fontSize: theme.fontSize.xs,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: theme.colors.error,
          opacity: 0.7,
          flexShrink: 0,
          '&:hover': { opacity: 1 },
        }}
      >
        <Icon name="close" size="xs" />
      </button>
    </div>
  );
};

// Helper: Expand schema fields into columns (flatten object types but not arrays)
const expandColumns = (fields: TSchema['fields']) => {
  const columns: Array<{
    key: string;
    baseField: string;
    fieldType: any;
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
  const { [className]: schema } = useProtoSchema();

  const [rootGroup, setRootGroup] = useState<GroupFilterCriteria>({
    id: 'root',
    operator: '$and',
    children: [],
  });
  const [filter, setFilter] = useState<QueryFilter[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<Record<string, 1 | -1>>({});

  const [columnWidth, setColumnWidth] = useState<Record<string, number>>({});

  const startActivity = useActivity();

  // Expand columns from schema  
  const expandedColumns = useMemo(() => schema ? expandColumns(schema.fields) : [], [schema]);

  const {
    resource: {
      items = [],
      count = 0,
    } = {},
    setResource,
    refresh,
  } = useResource(async () => {
    const q = _.reduce(filter, (query, f) => query.filter(f), proto.Query(className));
    const count = await q.count({ master: true });
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
    handleApplyFilters,
    handleClearFilters,
  } = _useCallbacks({
    handleApplyFilters: () => {
      try {
        // Recursive function to convert FilterCriteria tree to QueryFilter
        const convertToQueryFilter = (criteria: FilterCriteria): QueryFilter | null => {
          // Group operators ($and, $or)
          if (criteria.operator === '$and' || criteria.operator === '$or') {
            const group = criteria as GroupFilterCriteria;
            const childFilters = group.children
              .map(convertToQueryFilter)
              .filter((f): f is QueryFilter => f !== null);

            if (childFilters.length === 0) return null;
            if (childFilters.length === 1) return childFilters[0];

            return { [group.operator]: childFilters };
          }

          // Custom filter ($filter)
          if (criteria.operator === '$filter') {
            const custom = criteria as CustomFilterCriteria;
            if (!custom.value) return null;
            try {
              return deserialize(custom.value) as QueryFilter;
            } catch (error) {
              alert.showError(`Failed to parse custom filter: ${error}`);
              throw error;
            }
          }

          // Field filter
          const field = criteria as FieldFilterCriteria;
          if (!field.field || !field.operator) return null;

          const fieldType = _typeOf(schema?.fields[field.field]);
          let parsedValue: any = field.value;

          // Parse value based on field type and operator
          if (field.operator !== '$exists') {
            try {
              switch (fieldType) {
                case 'number':
                  parsedValue = parseFloat(field.value);
                  if (!_.isFinite(parsedValue)) return null;
                  break;
                case 'decimal':
                  parsedValue = new Decimal(field.value);
                  if (!parsedValue.isFinite()) return null;
                  break;
                case 'boolean':
                  parsedValue = field.value.toLowerCase() === 'true';
                  break;
                case 'date':
                  parsedValue = new Date(field.value);
                  if (!_.isFinite(parsedValue.valueOf())) return null;
                  break;
                case 'array':
                case 'object':
                case 'string[]':
                  if (field.operator === '$in' || field.operator === '$nin') {
                    parsedValue = field.value.split(',').map(v => v.trim());
                  } else {
                    parsedValue = deserialize(field.value);
                  }
                  break;
                case 'pointer':
                  if (field.operator === '$in' || field.operator === '$nin') {
                    parsedValue = field.value.split(',').map(v => v.trim());
                  } else {
                    parsedValue = field.value;
                  }
                  break;
                default:
                  if (field.operator === '$in' || field.operator === '$nin') {
                    parsedValue = field.value.split(',').map(v => v.trim());
                  }
                  break;
              }
            } catch (error) {
              alert.showError(`Failed to parse filter value for ${field.field}: ${error}`);
              throw error;
            }
          }

          // Create filter object
          if (field.operator === '$exists') {
            return { [field.field]: { $exists: true } };
          } else if (field.operator === '$eq') {
            return { [field.field]: parsedValue };
          } else {
            return { [field.field]: { [field.operator]: parsedValue } };
          }
        };

        const queryFilter = convertToQueryFilter(rootGroup);
        const filters = queryFilter ? [queryFilter] : [];

        setFilter(filters);
        setOffset(0);
        setShowFilterModal(false);
      } catch (error) {
        alert.showError(`Failed to apply filters: ${error}`);
      }
    },
    handleClearFilters: () => {
      setRootGroup({
        id: 'root',
        operator: '$and',
        children: [],
      });
      setFilter([]);
      setOffset(0);
      setShowFilterModal(false);
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
              {filter.length > 0 && ` • ${filter.length} ${filter.length === 1 ? 'filter' : 'filters'} active`}
            </div>
          </div>
          <Button
            variant={filter.length > 0 ? 'solid' : 'outline'}
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
      <Modal show={showFilterModal}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          minWidth: '500px',
          maxWidth: '700px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}>
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
              Filters
            </h3>
            <button
              onClick={() => setShowFilterModal(false)}
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
          {schema && (
            <>
              <FilterItem
                criteria={rootGroup}
                fields={schema.fields}
                onUpdate={(updated) => {
                  // Root must always be a group
                  if (updated.operator === '$and' || updated.operator === '$or') {
                    setRootGroup(updated as GroupFilterCriteria);
                  }
                }}
                onRemove={() => { }}
                depth={0}
              />

              <div style={{
                display: 'flex',
                gap: theme.spacing.xs,
                marginTop: theme.spacing.sm,
                justifyContent: 'flex-end',
              }}>
                {rootGroup.children.length > 0 && (
                  <Button
                    variant="ghost"
                    color="error"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant="solid"
                  color="primary"
                  size="sm"
                  onClick={handleApplyFilters}
                >
                  Apply
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
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
            showEmptyLastRow
            columnWidth={expandedColumns.map(col => columnWidth[col.key] || 150)}
            startRowNumber={offset + 1}
            allowEditForCell={(row, col) => {
              const column = expandedColumns[col];
              if (!column) return false;
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
                  const objs = _.compact(_.map(rows, row => items[row]));
                  const updates: TObject[] = [];
                  if (type === 'json') {
                    for (const [obj, values] of _.zip(objs, data)) {
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
                    for (const [obj, values] of _.zip(objs, data)) {
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
                  const _rows = _.range(cells.start.row, cells.end.row + 1);
                  const _cols = _.range(cells.start.col, cells.end.col + 1).map(c => expandedColumns[c]).filter(Boolean);
                  const { data } = await decodeClipboardData(clipboard, false) ?? {};
                  if (_.isEmpty(data) || !_.isArray(data)) return;
                  const objs = _.compact(_.map(_rows, row => items[row]));
                  const updates: TObject[] = [];
                  for (const [obj, values] of _.zip(objs, data)) {
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
