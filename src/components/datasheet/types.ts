//
//  types.ts
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
import { ElementNode, ExtendedCSSProperties } from 'frosty';

export type Position = { row: number; col: number; };
export type Range<T> = { start: T; end: T; };

export type Column = string | { key: string; label: ElementNode; };

export type DatasheetProps<T extends object, C extends Column> = {
  data: T[];
  columns: C[];
  encoders?: Record<string, (data: any[][]) => string | Blob | PromiseLike<string | Blob>>;
  encodeValue?: (data: T[keyof T]) => any;
  allowSelection?: boolean;
  allowEditForCell?: boolean | ((row: number, col: number) => boolean);
  columnWidth?: number[];
  columnMinWidth?: number;
  rowNumbers?: boolean;
  startRowNumber?: number;
  stickyHeader?: boolean;
  stickyRowNumbers?: boolean;
  showEmptyLastRow?: boolean;
  highlightColor?: string;
  renderItem: (x: {
    item: T[keyof T];
    row: T;
    column: C;
    columnKey: string;
    rowIdx: number;
    columnIdx: number;
    isEditing: boolean;
  }) => ElementNode;
  onColumnWidthChange?: (col: number, width: number) => void;
  onSelectionChanged?: VoidFunction;
  onDeleteRows?: (rows: number[]) => void;
  onDeleteCells?: (cells: Range<Position>) => void;
  onCopyRows?: (rows: number[], data: Pick<T, keyof T>[]) => void;
  onCopyCells?: (cells: Range<Position>, data: Pick<T, keyof T>[]) => void;
  onPasteRows?: (rows: number[], clipboard: DataTransfer | Clipboard) => void;
  onPasteCells?: (cells: Range<Position>, clipboard: DataTransfer | Clipboard) => void;
  onEndEditing?: (row: number, col: number) => void;
};