//
//  bodyCell.tsx
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
import { PropsWithChildren, useMemo } from 'frosty';
import { useDatasheetContext } from '../context';
import { DataSheetCell } from './cell';
import { useTheme } from '../../theme';
import { useStyle } from '../../style';

type BodyCellProps = PropsWithChildren<{
  row: number;
  col: number;
  rowNumbers?: boolean;
  highlightColor: string;
  allowEditForCell?: boolean | ((row: number, col: number) => boolean);
}>;

export const BodyCell = ({
  row,
  col,
  rowNumbers,
  highlightColor,
  allowEditForCell,
  children,
}: BodyCellProps) => {
  const { state, setState, isRowSelected, isCellSelected, isCellEditing } = useDatasheetContext();
  const theme = useTheme();
  const style = useStyle();

  const borderColor = style.datasheet.borderColor;
  const selectedBorderColor = style.datasheet.selectedBorderColor;
  const evenRowBg = style.datasheet.evenRowBg;
  const oddRowBg = style.datasheet.oddRowBg;

  const cellStyle = useMemo(() => ({
    padding: 0,
    position: 'relative' as const,
    borderTop: 0,
    borderLeft: rowNumbers === true || col !== 0 ? 0 : 1,
    borderBottom: 1,
    borderRight: 1,
    borderStyle: 'solid',
    borderColor: borderColor,
    borderRightColor: isRowSelected(row) || isCellSelected(row, col) || isCellSelected(row, col + 1) ? selectedBorderColor : borderColor,
    borderBottomColor: isRowSelected(row) || isRowSelected(row + 1) || isCellSelected(row, col) || isCellSelected(row + 1, col) ? selectedBorderColor : borderColor,
    backgroundColor: row % 2 === 0 ? evenRowBg : oddRowBg,
    cursor: state.editing ? 'default' : 'cell',
  }), [state.editing, isRowSelected(row), isCellSelected(row, col), isCellSelected(row, col + 1), isCellSelected(row + 1, col), row, col, rowNumbers]);

  const selectedCellStyle = useMemo(() => ({
    padding: 0,
    position: 'relative' as const,
    borderTop: 0,
    borderLeft: rowNumbers === true || col !== 0 ? 0 : 1,
    borderBottom: 1,
    borderRight: 1,
    borderStyle: 'solid',
    borderColor: selectedBorderColor,
    backgroundColor: row % 2 === 0 ? evenRowBg : oddRowBg,
    cursor: state.editing ? 'default' : 'cell',
  }), [state.editing, row, col, rowNumbers]);

  const allowEdit = _.isFunction(allowEditForCell) ? allowEditForCell(row, col) : !!allowEditForCell;
  
  const handleDoubleClick = () => {
    if (allowEdit) {
      setState({ editing: { row, col } });
    }
  };

  return (
    <DataSheetCell
      isEditing={isCellEditing(row, col)}
      selected={isRowSelected(row) || isCellSelected(row, col)}
      highlightColor={highlightColor}
      data-row={row}
      data-col={col}
      style={cellStyle}
      onDoubleClick={handleDoubleClick}
      selectedStyle={selectedCellStyle}
    >
      {children}
    </DataSheetCell>
  );
};
