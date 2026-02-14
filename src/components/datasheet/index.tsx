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
import { Column, DatasheetProps } from './types';
import { useMemo, useState, useEffect, useRef } from 'frosty';
import { DatasheetStateProvider, useDatasheetContext, selectionKeys } from './context';
import { DataSheetHeader } from './table/header';
import { DataSheetBody } from './table/body';
import { useTheme } from '../theme';
import { defaultEncoders } from './encoders';

const isChildNode = (parent?: Node | null, node?: Node | EventTarget | null) => {
  if (!parent) return false;
  while (node !== document) {
    if (node === parent) {
      return true;
    }
    const parentNode = node && 'parentNode' in node ? node.parentNode : null;
    if (!parentNode) return false;
    node = parentNode;
  }
  return false;
}

const DataSheetTable = <T extends object, C extends Column>({
  data,
  columns,
  encoders,
  encodeValue,
  allowSelection = true,
  allowEditForCell = true,
  columnWidth,
  columnMinWidth = 64,
  rowNumbers = true,
  startRowNumber = 1,
  stickyHeader = true,
  stickyRowNumbers = true,
  showEmptyLastRow,
  highlightColor = 'rgba(33, 133, 208, 0.15)',
  renderItem,
  onColumnWidthChange,
  onSelectionChanged,
  onDeleteRows,
  onDeleteCells,
  onCopyRows,
  onCopyCells,
  onPasteRows,
  onPasteCells,
  onEndEditing,
}: DatasheetProps<T, C>) => {
  const { state, setState, clearSelection, endEditing } = useDatasheetContext();
  const tableRef = useRef<HTMLTableElement>();
  const theme = useTheme();

  // Handle clicks outside the table to clear selection
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!_.isNil(state.editing)) {
        // If we're editing and click is outside the editing cell, end editing
        const cell = (e.target as HTMLElement).closest('td');
        if (!cell || !isChildNode(tableRef.current, e.target)) {
          if (_.isFunction(onEndEditing)) {
            onEndEditing(state.editing.row, state.editing.col);
          }
          endEditing();
        }
      }
      if (!_.isEmpty((state as any).selectingRows) || !_.isEmpty((state as any).selectingCells)) {
        if (!isChildNode(tableRef.current, e.target)) {
          setState(state => _.omit(state, ...selectionKeys, 'editing'));
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!_.isEmpty((state as any).selectingRows)) {
        setState(state => ({
          ..._.omit(state, ...selectionKeys, 'editing'),
          selectedRows: (state as any).selectingRows,
        }));
      } else if (!_.isEmpty((state as any)._selectingCells)) {
        setState(state => ({
          ..._.omit(state, ...selectionKeys, 'editing'),
          selectedCells: (state as any)._selectingCells,
        }));
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [state, setState, endEditing, onEndEditing]);

  // Clipboard and keyboard handling
  useEffect(() => {
    const encodeClipboard = (e: ClipboardEvent | KeyboardEvent, clipboardData: any[][]) => {
      const _encoders = {
        ...defaultEncoders,
        ...encoders ?? {},
      };
      if ('clipboardData' in e && e.clipboardData) {
        for (const [format, encoder] of _.toPairs(_encoders)) {
          const result = encoder(clipboardData);
          if (typeof result === 'string') {
            e.clipboardData.setData(format, result);
          }
        }
      } else if (navigator.clipboard && navigator.clipboard.write) {
        const items: Record<string, Blob> = {};
        for (const [format, encoder] of _.toPairs(_encoders)) {
          const result = encoder(clipboardData);
          if (typeof result === 'string') {
            items[format] = new Blob([result], { type: format });
          } else if (result && typeof result === 'object' && 'size' in result) {
            items[format] = result as Blob;
          }
        }
        navigator.clipboard.write([new ClipboardItem(items)]);
      }
    }

    const handleCopy = (e: ClipboardEvent) => {
      if (!allowSelection) return;
      const selectedRows = state.selectedRows?.sort().filter(x => x < data.length) ?? [];
      const columnKeys = _.map(columns, col => _.isString(col) ? col : col.key);

      if (!_.isEmpty(selectedRows)) {
        e.preventDefault();
        if (_.isFunction(onCopyRows)) {
          const _data = _.map(selectedRows, row => _.pick(data[row], columnKeys as any));
          onCopyRows(selectedRows, _data);
        } else {
          const _encodeValue = encodeValue ?? ((v: any) => v);
          const _data = _.map(selectedRows, row => _.map(columnKeys, col => _encodeValue(data[row]?.[col as keyof T])));
          encodeClipboard(e, _data);
        }
      }
      if (!_.isEmpty(state.selectedCells)) {
        e.preventDefault();
        const selectedCells = state.selectedCells;
        const _rows = _.range(selectedCells.start.row, selectedCells.end.row + 1);
        const _cols = _.range(selectedCells.start.col, selectedCells.end.col + 1);
        if (_.isFunction(onCopyCells)) {
          const _data = _.map(_rows, row => _.pick(data[row], _.map(_cols, col => columnKeys[col]) as any));
          onCopyCells(selectedCells, _data);
        } else {
          const _encodeValue = encodeValue ?? ((v: any) => v);
          const _data = _.map(_rows, row => _.map(_cols, col => _encodeValue(data[row]?.[columnKeys[col] as keyof T])));
          encodeClipboard(e, _data);
        }
      }
    }

    const handlePaste = (e: ClipboardEvent) => {
      if (!allowSelection) return;
      const selectedRows = state.selectedRows?.sort() ?? [];
      const clipboard = e.clipboardData && !_.isEmpty(e.clipboardData.types) ? e.clipboardData : navigator.clipboard;

      if (!_.isEmpty(selectedRows)) {
        e.preventDefault();
        if (_.isFunction(onPasteRows)) onPasteRows(selectedRows, clipboard);
      }
      if (!_.isEmpty(state.selectedCells)) {
        e.preventDefault();
        if (_.isFunction(onPasteCells)) onPasteCells(state.selectedCells, clipboard);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!allowSelection) return;

      // Handle copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selectedRows = state.selectedRows?.sort().filter(x => x < data.length) ?? [];
        const columnKeys = _.map(columns, col => _.isString(col) ? col : col.key);

        if (!_.isEmpty(selectedRows)) {
          e.preventDefault();
          if (_.isFunction(onCopyRows)) {
            const _data = _.map(selectedRows, row => _.pick(data[row], columnKeys as any));
            onCopyRows(selectedRows, _data);
          } else {
            const _encodeValue = encodeValue ?? ((v: any) => v);
            const _data = _.map(selectedRows, row => _.map(columnKeys, col => _encodeValue(data[row]?.[col as keyof T])));
            encodeClipboard(e, _data);
          }
        }
        if (!_.isEmpty(state.selectedCells)) {
          e.preventDefault();
          const selectedCells = state.selectedCells;
          const _rows = _.range(selectedCells.start.row, selectedCells.end.row + 1);
          const _cols = _.range(selectedCells.start.col, selectedCells.end.col + 1);
          if (_.isFunction(onCopyCells)) {
            const _data = _.map(_rows, row => _.pick(data[row], _.map(_cols, col => columnKeys[col]) as any));
            onCopyCells(selectedCells, _data);
          } else {
            const _encodeValue = encodeValue ?? ((v: any) => v);
            const _data = _.map(_rows, row => _.map(_cols, col => _encodeValue(data[row]?.[columnKeys[col] as keyof T])));
            encodeClipboard(e, _data);
          }
        }
      }

      // Handle paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const selectedRows = state.selectedRows?.sort() ?? [];
        const clipboard = navigator.clipboard;

        if (!_.isEmpty(selectedRows)) {
          e.preventDefault();
          if (_.isFunction(onPasteRows)) onPasteRows(selectedRows, clipboard);
        }
        if (!_.isEmpty(state.selectedCells)) {
          e.preventDefault();
          if (_.isFunction(onPasteCells)) onPasteCells(state.selectedCells, clipboard);
        }
      }

      // Handle delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const selectedRows = state.selectedRows?.sort().filter(x => x < data.length) ?? [];
        if (!_.isEmpty(selectedRows)) {
          e.preventDefault();
          if (_.isFunction(onDeleteRows)) onDeleteRows(selectedRows);
        }
        if (!_.isEmpty(state.selectedCells)) {
          e.preventDefault();
          if (_.isFunction(onDeleteCells)) onDeleteCells(state.selectedCells);
        }
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state, data, columns, allowSelection, encodeValue, encoders, onCopyRows, onCopyCells, onPasteRows, onPasteCells, onDeleteRows, onDeleteCells]);

  return (
    <table
      ref={tableRef}
      style={{
        borderCollapse: 'separate',
        borderSpacing: 0,
        userSelect: 'none',
        fontSize: theme.fontSize.sm,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <DataSheetHeader
        columns={columns}
        rowNumbers={rowNumbers}
        stickyHeader={stickyHeader}
        stickyRowNumbers={stickyRowNumbers}
        columnWidth={columnWidth}
        columnMinWidth={columnMinWidth}
      />
      <DataSheetBody
        data={data}
        columns={columns}
        rowNumbers={rowNumbers}
        startRowNumber={startRowNumber}
        renderItem={renderItem}
        allowSelection={allowSelection}
        allowEditForCell={allowEditForCell}
        stickyRowNumbers={stickyRowNumbers}
        showEmptyLastRow={showEmptyLastRow}
        highlightColor={highlightColor}
      />
    </table>
  );
};

export const DataSheet = <T extends object, C extends Column>(props: DatasheetProps<T, C>) => {
  return (
    <DatasheetStateProvider>
      <DataSheetTable {...props} />
    </DatasheetStateProvider>
  );
};

