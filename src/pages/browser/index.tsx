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
import { Decimal, deserialize } from 'proto.io';

// System fields that cannot be edited
const systemFields = ['_id', '_created_at', '_updated_at', '__v', '__i'];

export const BrowserPage = () => {
  const theme = useTheme();
  const alert = useAlert();
  const { schema: className } = useParams() as { schema: string; };
  const proto = useProto();
  const { [className]: schema } = useProtoSchema();

  const [filter, setFilter] = useState<QueryFilter[]>([]);

  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<Record<string, 1 | -1>>({});

  const [columnWidth, setColumnWidth] = useState<Record<string, number>>({});

  const startActivity = useActivity();

  const {
    resource = [],
    setResource,
    refresh,
  } = useResource(async () => {
    const q = _.reduce(filter, (query, f) => query.filter(f), proto.Query(className));
    q.limit(limit);
    if (offset > 0) q.skip(offset);
    if (!_.isEmpty(sort)) q.sort(sort);
    return await q.find({ master: true });
  }, [className, filter, limit, offset, sort]);

  const [editingValue, setEditingValue] = useState<any>();

  const readonlyKeys = [
    ...systemFields,
    ..._.keys(_.pickBy(schema?.fields, type => !_.isString(type) && type.type === 'relation' && !_.isNil(type.foreignField))),
  ];

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

  const {
    handleUpdateItem,
  } = _useCallbacks({
    handleUpdateItem: (item: TObject, columnKey: string, value: any) => {
      startActivity(async () => {
        try {
          const cloned = item.clone();
          cloned.set(columnKey, value);
          await cloned.save({ master: true });
          setResource((prev) => _.map(prev, i => i === item ? cloned : i));
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
          setResource((prev) => _.filter(prev, i => !items.includes(i)));
          alert.showSuccess(`${items.length} object(s) deleted successfully`);
        } catch (error) {
          console.error('Failed to delete items:', error);
          alert.showError(error instanceof Error ? error.message : 'Failed to delete items');
        }
      });
    },
    handleDeleteKeys: (item: TObject, keys: string[]) => {
      startActivity(async () => {
        try {
          const cloned = item.clone();
          keys.forEach(key => cloned.set(key, null));
          await cloned.save({ master: true });
          setResource((prev) => _.map(prev, i => i === item ? cloned : i));
          alert.showSuccess(`Fields ${keys.join(', ')} deleted successfully`);
        } catch (error) {
          console.error('Failed to delete fields:', error);
          alert.showError(error instanceof Error ? error.message : 'Failed to delete fields');
        }
      });
    },
  });

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
          {resource.length} {resource.length === 1 ? 'record' : 'records'}
        </div>
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
            data={resource}
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
            renderItem={({ row, columnKey, isEditing }) => (
              <TableCell
                item={row}
                column={columnKey}
                schema={schema}
                isEditing={isEditing}
                editingValue={editingValue}
                setEditingValue={setEditingValue}
              />
            )}
            onStartEditing={(row, col) => {
              const columnKey = _.keys(schema.fields)[col];
              const currentValue = resource[row].get(columnKey);
              setEditingValue(currentValue);
            }}
            onEndEditing={(row, col) => {
              const columnKey = _.keys(schema.fields)[col];
              const item = resource[row];
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
                  const objs = _.compact(_.map(rows, row => data?.[row]));
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
                  const objs = _.compact(_.map(_rows, row => data[row]));
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
                } catch (error) {
                  console.error('Failed to paste data:', error);
                  alert.showError(error instanceof Error ? error.message : 'Failed to paste data');
                }
              });
            }}
            onDeleteRows={(rows) => {
            }}
            onDeleteCells={(cells) => {
            }}
          />}
        </div>
      </div>
    </div>
  );
};
