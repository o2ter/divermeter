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
import { useDatasheetContext } from '../context';
import { useTheme } from '../../theme';
import { useStyle } from '../../style';
import { RowNumberCell } from './rowNumberCell';
import { BodyCell } from './bodyCell';
import { useCallback } from 'frosty';

type DataSheetBodyProps<T extends object, C extends Column> = {
  data: T[];
  columns: C[];
  startRowNumber?: number;
  renderItem: DatasheetProps<T, C>['renderItem'];
  allowSelection?: boolean;
  allowEditForCell?: boolean | ((row: number, col: number) => boolean);
  stickyRowNumbers?: boolean;
  showEmptyLastRow?: boolean;
  highlightColor: string;
};

export const DataSheetBody = <T extends object, C extends Column>({
  data,
  columns,
  startRowNumber,
  renderItem,
  allowSelection,
  allowEditForCell,
  stickyRowNumbers,
  showEmptyLastRow,
  highlightColor,
}: DataSheetBodyProps<T, C>) => {
  const { state, setState, isCellEditing } = useDatasheetContext();
  const theme = useTheme();
  const style = useStyle();

  const handleMouseDown = useCallback((e: MouseEvent) => {
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
  }, [setState]);

  const handleMouseOver = useCallback((e: MouseEvent) => {
    // Only continue selection if the primary mouse button is pressed
    if (e.buttons !== 1) return;

    const element = e.target as HTMLElement;
    const cell = element.closest('td');
    if (_.isNil(cell)) return;

    const row = cell.dataset.row ?? '';
    const col = cell.dataset.col ?? '';

    setState(currentState => {
      if (_.isEmpty(col)) {
        if (currentState._selectRows) {
          return {
            ..._.omit(currentState, '_selectStart', '_selectEnd'),
            ...{ _selectRows: { start: currentState._selectRows.start, end: Number(row) } },
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
          };
        }
      } else {
        if (currentState._selectStart) {
          return {
            ..._.omit(currentState, '_selectRows'),
            ...{ _selectEnd: { row: Number(row), col: Number(col) } },
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
          };
        }
      }
      return currentState;
    });
  }, [setState]);

  return (
    <tbody
      style={{ backgroundColor: style.datasheet.bodyBg }}
      onMouseDown={allowSelection && !state.editing ? handleMouseDown : undefined}
      onMouseOver={allowSelection && !state.editing ? handleMouseOver : undefined}
    >
      {_.map(data, (items, row) => (
        <tr key={row}>
          {!_.isNil(startRowNumber) && (
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
                rowNumbers={!_.isNil(startRowNumber)}
              >
                <span style={{
                  fontFamily: 'monospace',
                  display: 'inline-block',
                  minHeight: theme.fontSize.md,
                  lineHeight: `${theme.fontSize.md}px`,
                }}>{' '}</span>
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
          {!_.isNil(startRowNumber) && (
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
              rowNumbers={!_.isNil(startRowNumber)}
            >
              <span style={{
                fontFamily: 'monospace',
                display: 'inline-block',
                minHeight: theme.fontSize.md,
                lineHeight: `${theme.fontSize.md}px`,
              }}>{' '}</span>
            </BodyCell>
          ))}
        </tr>
      )}
    </tbody>
  );
};
