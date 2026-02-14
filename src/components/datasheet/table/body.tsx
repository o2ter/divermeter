//
//  body.tsx
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
import { Column, DatasheetProps } from '../types';
import { useDatasheetContext, selectionKeys } from '../context';
import { useTheme } from '../../theme';
import { RowNumberCell } from './rowNumberCell';
import { BodyCell } from './bodyCell';

type DataSheetBodyProps<T extends object, C extends Column> = {
  data: T[];
  columns: C[];
  rowNumbers?: boolean;
  startRowNumber?: number;
  renderItem: DatasheetProps<T, C>['renderItem'];
  allowSelection?: boolean;
  allowEditForCell?: boolean | ((row: number, col: number) => boolean);
  stickyRowNumbers?: boolean;
  showEmptyLastRow?: boolean;
  highlightColor?: string;
};

export const DataSheetBody = <T extends object, C extends Column>({
  data,
  columns,
  rowNumbers,
  startRowNumber = 1,
  renderItem,
  allowSelection,
  allowEditForCell,
  stickyRowNumbers,
  showEmptyLastRow,
  highlightColor = 'rgba(33, 133, 208, 0.15)',
}: DataSheetBodyProps<T, C>) => {
  const { state, setState, isCellEditing } = useDatasheetContext();
  const theme = useTheme();

  const handleMouseDown = (e: MouseEvent) => {
    const element = e.target as HTMLElement;
    const cell = element.closest('td');
    if (_.isNil(cell)) return;

    const row = cell.dataset.row ?? '';
    const col = cell.dataset.col ?? '';

    if (_.isEmpty(col)) {
      setState(state => ({
        ..._.omit(state, '_selectStart', '_selectEnd'),
        _selectRows: { start: Number(row), end: Number(row) },
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
      }))
    } else {
      setState(state => ({
        ..._.omit(state, '_selectRows'),
        _selectStart: { row: Number(row), col: Number(col) },
        _selectEnd: { row: Number(row), col: Number(col) },
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
      }));
    }
  }

  const handleMouseOver = (e: MouseEvent) => {
    const element = e.target as HTMLElement;
    const cell = element.closest('td');
    if (_.isNil(cell)) return;

    const row = cell.dataset.row ?? '';
    const col = cell.dataset.col ?? '';

    if (_.isEmpty(col)) {
      if (state._selectRows) {
        setState(state => ({
          ..._.omit(state, '_selectStart', '_selectEnd'),
          ...{ _selectRows: { start: state._selectRows!.start, end: Number(row) } },
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
        }));
      }
    } else {
      if (state._selectStart) {
        setState(state => ({
          ..._.omit(state, '_selectRows'),
          ...{ _selectEnd: { row: Number(row), col: Number(col) } },
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
        }));
      }
    }
  }

  return (
    <tbody
      style={{ backgroundColor: 'white' }}
      onMouseDown={allowSelection && !state.editing ? handleMouseDown : undefined}
      onMouseOver={allowSelection && !state.editing ? handleMouseOver : undefined}
    >
      {_.map(data, (items, row) => (
        <tr key={row}>
          {rowNumbers === true && (
            <RowNumberCell
              row={row}
              highlightColor={highlightColor}
              stickyRowNumbers={stickyRowNumbers}
            >
              <span style={{ fontFamily: 'monospace' }}>{row + startRowNumber}</span>
            </RowNumberCell>
          )}
          {_.map(columns, (column, col) => {
            const key = _.isString(column) ? column : column.key;
            const item = items[key as keyof T];
            return (
              <BodyCell
                key={col}
                row={row}
                col={col}
                highlightColor={highlightColor}
                allowEditForCell={allowEditForCell}
                rowNumbers={rowNumbers}
              >
                <span style={{ fontFamily: 'monospace' }}>{' '}</span>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: isCellEditing(row, col) ? 0 : theme.spacing.xs,
                  }}
                >
                  {renderItem({
                    item,
                    row: items,
                    column,
                    columnKey: key,
                    rowIdx: row,
                    columnIdx: col,
                    isEditing: isCellEditing(row, col),
                  })}
                </div>
              </BodyCell>
            );
          })}
        </tr>
      ))}
      {showEmptyLastRow === true && (
        <tr>
          {rowNumbers === true && (
            <RowNumberCell
              row={data.length}
              highlightColor={highlightColor}
              stickyRowNumbers={stickyRowNumbers}
            />
          )}
          {_.map(columns, (column, col) => (
            <BodyCell
              key={col}
              row={data.length}
              col={col}
              highlightColor={highlightColor}
              allowEditForCell={false}
              rowNumbers={rowNumbers}
            >
              <span style={{ fontFamily: 'monospace' }}>{' '}</span>
            </BodyCell>
          ))}
        </tr>
      )}
    </tbody>
  );
};
