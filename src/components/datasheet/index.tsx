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
import { Column, DataSheetProps } from './types';
import { useEffect, useRef, _useCallbacks, useRefHandle } from 'frosty';
import { useDocument } from 'frosty/web';
import { DataSheetStateProvider, useDataSheetContext, selectionKeys } from './context';
import { DataSheetHeader } from './table/header';
import { DataSheetBody } from './table/body';
import { useTheme } from '../theme';
import { useStyle } from '../style';
import { defaultEncoders } from './encoders';

const isChildNode = (parent?: Node | null, node?: Node | EventTarget | null, doc?: Document) => {
  if (!parent || !doc) return false;
  while (node !== doc) {
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
  ref,
  data,
  columns,
  encoders,
  encodeValue,
  allowSelection = true,
  allowEditForCell = true,
  columnWidth,
  columnMinWidth = 64,
  startRowNumber,
  stickyHeader = true,
  stickyRowNumbers = true,
  showEmptyLastRow,
  highlightColor,
  renderItem,
  onColumnWidthChange,
  onSelectionChanged,
  onDeleteRows,
  onDeleteCells,
  onCopyRows,
  onCopyCells,
  onPasteRows,
  onPasteCells,
  onStartEditing,
  onEndEditing,
}: DataSheetProps<T, C>) => {
  const { state, setState, clearSelection, endEditing } = useDataSheetContext();
  const tableRef = useRef<HTMLTableElement>();
  const theme = useTheme();
  const style = useStyle();
  const doc = useDocument();

  const effectiveHighlightColor = highlightColor ?? style.datasheet.highlightColor;

  useRefHandle(ref, () => ({
    get editing() { return !_.isNil(state.editing) },
    get selectedRows() { return _.isEmpty(state.selectedCells) ? state.selectedRows ?? [] : [] },
    get selectedCells() { return state.selectedCells; },
    clearSelection,
    endEditing,
  }), [state]);

  const {
    handleMouseDown,
    handleMouseUp,
    handleCopy,
    handlePaste,
    handleKeyDown,
  } = _useCallbacks({
    handleMouseDown: (e: MouseEvent) => {
      // Use functional setState to always get latest state
      setState(currentState => {
        if (!_.isNil(currentState.editing)) {
          // If we're editing and click is outside the editing cell, end editing
          const cell = (e.target as HTMLElement).closest('td');

          // Check if we clicked outside the table or if we clicked a different cell
          if (!cell || !isChildNode(tableRef.current, e.target, doc)) {
            // Clicked completely outside the table
            if (_.isFunction(onEndEditing)) {
              onEndEditing(currentState.editing.row, currentState.editing.col);
            }
            return _.omit(currentState, 'editing');
          } else {
            // Clicked within the table - check if it's a different cell
            const clickedRow = cell.getAttribute('data-row');
            const clickedCol = cell.getAttribute('data-col');

            if (clickedRow !== null && clickedCol !== null) {
              const row = parseInt(clickedRow, 10);
              const col = parseInt(clickedCol, 10);

              // If clicking a different cell, end editing
              if (row !== currentState.editing.row || col !== currentState.editing.col) {
                if (_.isFunction(onEndEditing)) {
                  onEndEditing(currentState.editing.row, currentState.editing.col);
                }
                return _.omit(currentState, 'editing');
              }
            }
          }
        }
        if (!_.isEmpty((currentState as any).selectingRows) || !_.isEmpty((currentState as any).selectingCells)) {
          if (!isChildNode(tableRef.current, e.target, doc)) {
            return _.omit(currentState, ...selectionKeys, 'editing');
          }
        }
        return currentState;
      });
    },
    handleMouseUp: (e: MouseEvent) => {
      setState(currentState => {
        let hasSelectionChanged = false;
        let newState = currentState;

        if (!_.isEmpty((currentState as any).selectingRows)) {
          hasSelectionChanged = true;
          newState = {
            ..._.omit(currentState, ...selectionKeys, 'editing'),
            selectedRows: (currentState as any).selectingRows,
          };
        } else if (!_.isEmpty((currentState as any)._selectingCells)) {
          hasSelectionChanged = true;
          newState = {
            ..._.omit(currentState, ...selectionKeys, 'editing'),
            selectedCells: (currentState as any)._selectingCells,
          };
        }

        if (hasSelectionChanged && _.isFunction(onSelectionChanged)) {
          // Call after state update in next tick
          setTimeout(() => onSelectionChanged(), 0);
        }

        return newState;
      });
    },
    handleCopy: (e: ClipboardEvent) => {
      if (!allowSelection) return;
      const selectedRows = state.selectedRows?.sort().filter(x => x < data.length) ?? [];
      const columnKeys = _.map(columns, col => _.isString(col) ? col : col.key);

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
      };

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
    },
    handlePaste: (e: ClipboardEvent) => {
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
    },
    handleKeyDown: (e: KeyboardEvent) => {
      if (!allowSelection) return;

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
      };

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
    },
  });

  // Register all event listeners
  useEffect(() => {
    doc.addEventListener('mousedown', handleMouseDown);
    doc.addEventListener('mouseup', handleMouseUp);
    doc.addEventListener('copy', handleCopy);
    doc.addEventListener('paste', handlePaste);
    doc.addEventListener('keydown', handleKeyDown);
    return () => {
      doc.removeEventListener('mousedown', handleMouseDown);
      doc.removeEventListener('mouseup', handleMouseUp);
      doc.removeEventListener('copy', handleCopy);
      doc.removeEventListener('paste', handlePaste);
      doc.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <table
      ref={tableRef}
      style={{
        borderCollapse: 'separate',
        borderSpacing: 0,
        fontSize: theme.fontSize.sm,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        userSelect: 'none',
        msUserSelect: 'none',
        MozUserSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <DataSheetHeader
        columns={columns}
        rowNumbers={!_.isNil(startRowNumber)}
        stickyHeader={stickyHeader}
        stickyRowNumbers={stickyRowNumbers}
        columnWidth={columnWidth}
        columnMinWidth={columnMinWidth}
        onColumnWidthChange={onColumnWidthChange}
      />
      <DataSheetBody
        data={data}
        columns={columns}
        startRowNumber={startRowNumber}
        renderItem={renderItem}
        allowSelection={allowSelection}
        allowEditForCell={allowEditForCell}
        stickyRowNumbers={stickyRowNumbers}
        showEmptyLastRow={showEmptyLastRow}
        highlightColor={effectiveHighlightColor}
      />
    </table>
  );
};

export const DataSheet = <T extends object, C extends Column>(props: DataSheetProps<T, C>) => {
  return (
    <DataSheetStateProvider>
      <DataSheetTable {...props} />
    </DataSheetStateProvider>
  );
};

