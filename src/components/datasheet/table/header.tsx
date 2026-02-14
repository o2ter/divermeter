//
//  header.tsx
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
import { Column } from '../types';
import { useDatasheetContext } from '../context';
import { useTheme } from '../../theme';
import { useStyle } from '../../style';
import { _useCallbacks, useEffect, useState } from 'frosty';
import { useDocument } from 'frosty/web';

type DataSheetHeaderProps<C extends Column> = {
  columns: C[];
  rowNumbers?: boolean;
  stickyHeader?: boolean;
  stickyRowNumbers?: boolean;
  columnWidth?: number[];
  columnMinWidth?: number;
  onColumnWidthChange?: (col: number, width: number) => void;
};

export const DataSheetHeader = <C extends Column>({
  columns,
  rowNumbers,
  stickyHeader,
  stickyRowNumbers,
  columnWidth,
  columnMinWidth = 64,
  onColumnWidthChange,
}: DataSheetHeaderProps<C>) => {
  const { state, isRowSelected, isCellSelected } = useDatasheetContext();
  const theme = useTheme();
  const style = useStyle();
  const doc = useDocument();

  const [resizing, setResizing] = useState<{ col: number; startX: number; startWidth: number } | null>(null);

  const headerBg = style.datasheet.headerBg;
  const borderColor = style.datasheet.borderColor;
  const selectedBorderColor = style.datasheet.selectedBorderColor;
  const resizeHandleHoverColor = style.datasheet.resizeHandleHoverColor;

  const {
    handleMouseMove,
    handleMouseUp,
  } = _useCallbacks({
    handleMouseMove: (e: MouseEvent) => {
      if (resizing && onColumnWidthChange) {
        const delta = e.clientX - resizing.startX;
        const newWidth = Math.max(columnMinWidth, resizing.startWidth + delta);
        onColumnWidthChange(resizing.col, newWidth);
      }
    },
    handleMouseUp: () => {
      setResizing(null);
    },
  });

  useEffect(() => {
    if (resizing) {
      doc.addEventListener('mousemove', handleMouseMove);
      doc.addEventListener('mouseup', handleMouseUp);
      return () => {
        doc.removeEventListener('mousemove', handleMouseMove);
        doc.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing]);

  const stickyHeaderStyle = stickyHeader ? {
    position: 'sticky' as const,
    top: 0,
    zIndex: 2,
  } : {};

  const stickyRowNumberStyle = stickyRowNumbers ? {
    position: 'sticky' as const,
    left: 0,
    zIndex: 3,
  } : {};

  return (
    <thead style={stickyHeaderStyle}>
      <tr style={{ backgroundColor: headerBg }}>
        {rowNumbers && (
          <th style={{
            ...stickyRowNumberStyle,
            border: `1px solid ${borderColor}`,
            backgroundColor: headerBg,
            borderBottomColor: isRowSelected(0) ? selectedBorderColor : borderColor,
            paddingLeft: theme.spacing.sm,
            paddingRight: theme.spacing.sm,
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.semibold,
            textAlign: 'center',
          }} />
        )}
        {_.map(columns, (column, col) => {
          const width = _.isArray(columnWidth) ? columnWidth[col] : undefined;
          return (
            <th
              key={col}
              style={{
                position: 'relative',
                border: `1px solid ${borderColor}`,
                borderLeft: rowNumbers || col !== 0 ? 0 : `1px solid ${borderColor}`,
                borderBottomColor: isRowSelected(0) || isCellSelected(0, col) ? selectedBorderColor : borderColor,
                backgroundColor: headerBg,
                minWidth: width ?? columnMinWidth,
                width: width,
                paddingLeft: theme.spacing.sm,
                paddingRight: theme.spacing.sm,
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.semibold,
                textAlign: 'left',
              }}
            >
              {_.isString(column) ? column : column.label}
              {onColumnWidthChange && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    cursor: 'col-resize',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: resizeHandleHoverColor,
                    },
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const currentWidth = _.isArray(columnWidth) ? columnWidth[col] : columnMinWidth;
                    setResizing({
                      col,
                      startX: e.clientX,
                      startWidth: currentWidth ?? columnMinWidth,
                    });
                  }}
                />
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};