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
import { Column, DatasheetProps } from '../types';
import { useDatasheetContext } from '../context';
import { useTheme } from '../../theme';
import { mixColor, shadeColor, tintColor } from '@o2ter/colors.js';

type DataSheetHeaderProps<T extends object, C extends Column> = {
  columns: C[];
  rowNumbers?: boolean;
  stickyHeader?: boolean;
  stickyRowNumbers?: boolean;
  columnWidth?: number[];
  columnMinWidth?: number;
};

export const DataSheetHeader = <T extends object, C extends Column>({
  columns,
  rowNumbers,
  stickyHeader,
  stickyRowNumbers,
  columnWidth,
  columnMinWidth = 64,
}: DataSheetHeaderProps<T, C>) => {
  const { state, isRowSelected, isCellSelected } = useDatasheetContext();
  const theme = useTheme();

  const headerBg = mixColor(theme.colors.primary, '#F6F8FF', 0.05);
  const borderColor = mixColor(theme.colors.primary, '#DDD', 0.1);
  const selectedBorderColor = theme.colors.primary;

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
            borderBottomStyle: isRowSelected(0) ? 'double' : 'solid',
            borderBottomColor: isRowSelected(0) ? selectedBorderColor : borderColor,
            minWidth: 50,
            width: 50,
            padding: theme.spacing.sm,
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
                borderLeft: 0,
                borderBottomStyle: isRowSelected(0) || isCellSelected(0, col) ? 'double' : 'solid',
                borderBottomColor: isRowSelected(0) || isCellSelected(0, col) ? selectedBorderColor : borderColor,
                backgroundColor: headerBg,
                minWidth: width ?? columnMinWidth,
                width: width,
                padding: theme.spacing.sm,
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.semibold,
                textAlign: 'left',
              }}
            >
              {_.isString(column) ? column : column.label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};