//
//  filter.tsx
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
import { _useCallbacks, useState } from 'frosty';
import { QueryFilter, TSchema } from '../../proto';
import { useTheme } from '../../components/theme';
import { useAlert } from '../../components/alert';
import { Button } from '../../components/button';
import { Modal } from '../../components/modal';
import { Icon } from '../../components/icon';
import { Decimal } from 'proto.io';
import { _typeOf, encodeValue, decodeValue, verifyValue } from './utils';
import { JSCode } from '../../components/jscode';

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

        <div style={{
          flex: 1,
          minHeight: '80px',
          border: `1px solid ${theme.colors['primary-300']}`,
          borderRadius: theme.borderRadius.sm,
          overflow: 'auto',
          '&:focus-within': {
            borderColor: theme.colors.primary,
          },
        }}>
          <JSCode
            initialValue={custom.value}
            onChangeValue={(text) => onUpdate({ ...custom, value: text })}
          />
        </div>

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
  const fieldType = _typeOf(fields[field.field]);

  // Render type-aware value input
  const renderValueInput = () => {
    const disabled = !field.operator || field.operator === '$exists';

    const baseStyle = {
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
    };

    if (disabled) {
      return (
        <input
          type="text"
          value=""
          disabled
          placeholder="N/A"
          style={baseStyle}
        />
      );
    }

    // For $in and $nin operators, always use comma-separated text input
    if (field.operator === '$in' || field.operator === '$nin') {
      return (
        <input
          type="text"
          value={field.value}
          onChange={(e) => onUpdate({ ...field, value: e.currentTarget.value })}
          placeholder="value1, value2, value3"
          style={baseStyle}
        />
      );
    }

    // Type-specific inputs
    switch (fieldType) {
      case 'boolean':
        return (
          <select
            value={field.value}
            onChange={(e) => onUpdate({ ...field, value: e.currentTarget.value })}
            style={baseStyle}
          >
            <option value="">Select...</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );

      case 'number':
      case 'decimal':
        return (
          <input
            type="number"
            value={field.value}
            onChange={(e) => onUpdate({ ...field, value: e.currentTarget.value })}
            placeholder="Enter number"
            style={baseStyle}
          />
        );

      case 'date':
        return (
          <input
            type="datetime-local"
            value={field.value}
            onChange={(e) => onUpdate({ ...field, value: e.currentTarget.value })}
            style={baseStyle}
          />
        );

      case 'array':
      case 'object':
      case 'string[]':
        return (
          <div style={{
            flex: 1,
            minHeight: '60px',
            border: `1px solid ${theme.colors['primary-300']}`,
            borderRadius: theme.borderRadius.sm,
            overflow: 'auto',
            '&:focus-within': {
              borderColor: theme.colors.primary,
            },
          }}>
            <JSCode
              initialValue={field.value}
              onChangeValue={(text) => onUpdate({ ...field, value: text })}
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={field.value}
            onChange={(e) => onUpdate({ ...field, value: e.currentTarget.value })}
            placeholder="Enter Value"
            style={baseStyle}
          />
        );
    }
  };

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
          {operators.filter(op => op.value !== '$filter').map(op => (
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

      {renderValueInput()}

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

export type FilterModalProps = {
  show: boolean;
  schema: TSchema | null;
  onApply: (filters: QueryFilter[]) => void;
  onCancel: () => void;
};

export const FilterModal = ({ show, schema, onApply, onCancel }: FilterModalProps) => {
  const theme = useTheme();
  const alert = useAlert();

  const [rootGroup, setRootGroup] = useState<GroupFilterCriteria>({
    id: 'root',
    operator: '$and',
    children: [],
  });

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
        const parsed = decodeValue(custom.value);
        verifyValue(parsed);
        return parsed as QueryFilter;
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
              const parsed = decodeValue(field.value);
              verifyValue(parsed);
              parsedValue = parsed;
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

  const { handleApplyFilters, handleClearFilters } = _useCallbacks({
    handleApplyFilters: () => {
      try {
        const queryFilter = convertToQueryFilter(rootGroup);
        const filters = queryFilter ? [queryFilter] : [];
        onApply(filters);
      } catch (error) {
        // Error already shown by alert in convertToQueryFilter
      }
    },
    handleClearFilters: () => {
      setRootGroup({
        id: 'root',
        operator: '$and',
        children: [],
      });
      onApply([]);
    },
  });

  return (
    <Modal show={show}>
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
  );
};
