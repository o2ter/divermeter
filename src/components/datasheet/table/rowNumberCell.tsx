//
//  rowNumberCell.tsx
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

import { PropsWithChildren, useMemo } from 'frosty';
import { useDatasheetContext } from '../context';
import { DataSheetCell } from './cell';
import { useTheme } from '../../theme';
import { useStyle } from '../../style';

type RowNumberCellProps = PropsWithChildren<{
  row: number;
  highlightColor: string;
  stickyRowNumbers?: boolean;
}>;

export const RowNumberCell = ({
  row,
  highlightColor,
  stickyRowNumbers,
  children,
}: RowNumberCellProps) => {
  const { state, isRowSelected, isCellSelected } = useDatasheetContext();
  const theme = useTheme();
  const style = useStyle();

  const borderColor = style.datasheet.borderColor;
  const selectedBorderColor = style.datasheet.selectedBorderColor;
  const headerBg = style.datasheet.headerBg;

  const stickyStyle = stickyRowNumbers ? {
    position: 'sticky' as const,
    left: 0,
    zIndex: 1,
  } : {};

  const cellStyle = useMemo(() => ({
    ...stickyStyle,
    border: `1px solid ${borderColor}`,
    borderTop: 0,
    backgroundColor: headerBg,
    borderRightColor: isRowSelected(row) || isCellSelected(row, 0) ? selectedBorderColor : borderColor,
    borderBottomColor: isRowSelected(row) || isRowSelected(row + 1) ? selectedBorderColor : borderColor,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center' as const,
    cursor: state.editing ? 'default' : 'pointer',
    userSelect: 'none' as const,
  }), [row, isRowSelected(row), isRowSelected(row + 1), isCellSelected(row, 0), state.editing, stickyStyle]);

  const selectedCellStyle = useMemo(() => ({
    ...stickyStyle,
    border: `1px double ${selectedBorderColor}`,
    borderTop: 0,
    backgroundColor: headerBg,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center' as const,
    cursor: state.editing ? 'default' : 'pointer',
    userSelect: 'none' as const,
  }), [row, state.editing, stickyStyle]);

  return (
    <DataSheetCell
      selected={isRowSelected(row)}
      highlightColor={highlightColor}
      data-row={row}
      style={cellStyle}
      selectedStyle={selectedCellStyle}
    >
      {children}
    </DataSheetCell>
  );
};
