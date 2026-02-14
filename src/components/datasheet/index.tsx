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
import { useMemo, useState } from 'frosty';
import { DatasheetContext, DataSheetState } from './context';
import { DataSheetHeader } from './table/header';
import { DataSheetCell } from './table/cell';

export const DataSheet = <T extends object, C extends Column>({
  data,
  columns,
  rowNumbers,
  startRowNumber,
  renderItem,
}: DatasheetProps<T, C>) => {
  const [state, setState] = useState<DataSheetState>({});
  const value = useMemo(() => ({ state, setState }), [state]);
  return (
    <DatasheetContext value={value}>
      <table>
        <thead>
          {rowNumbers && <th></th>}
          {_.map(columns, (column, index) => (
            <DataSheetHeader key={index} column={column} />
          ))}
        </thead>
        <tbody>
          {_.map(data, (row, rowIndex) => (
            <tr key={rowIndex}>
              {rowNumbers && <td>{(startRowNumber || 1) + rowIndex}</td>}
              {_.map(columns, (column, columnIndex) => (
                <DataSheetCell
                  key={columnIndex}
                  data={row}
                  column={column}
                  rowIdx={rowIndex}
                  columnIdx={columnIndex}
                  renderItem={renderItem}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </DatasheetContext>
  )
};

