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
import { useParams } from '../../components/router';
import { QueryFilter, TObject, useProto, useProtoSchema } from '../../proto';
import { _useCallbacks, useResource, useState } from 'frosty';
import { DataSheet } from '../../components/datasheet';
import { TableCell } from './cell';
import { useTheme } from '../../components/theme';
import { useAlert } from '../../components/alert';

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

  const {
    handleUpdateItem,
  } = _useCallbacks({
    handleUpdateItem: async (item: TObject, columnKey: string, value: any) => {
      try {
        const cloned = item.clone();
        cloned.set(columnKey, value);
        await cloned.save({ master: true });
        setResource((prev) => _.map(prev, i => i === item ? cloned : i));
      } catch (error) {
        console.error('Failed to update item:', error);
        alert.showError(error instanceof Error ? error.message : 'Failed to update item');
      }
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
              // System fields that cannot be edited
              const systemFields = ['_id', '_created_at', '_updated_at', '__v', '__i'];
              return !systemFields.includes(columnKey);
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
            }}
            onPasteCells={(cells, clipboard) => {
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
