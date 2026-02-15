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

import { ElementNode, Ref } from 'frosty';

export type Position = { row: number; col: number; };
export type Range<T> = { start: T; end: T; };

export type Column = string | { key: string; label: ElementNode; };

export type DataSheetRef = {
  readonly editing: boolean;
  readonly selectedRows: number[];
  readonly selectedCells: Range<Position> | undefined;
  clearSelection: () => void;
  endEditing: () => void;
};

export type RanderItemParams<T extends object, C extends Column> = {
  item: T[keyof T];
  row: T;
  column: C;
  columnKey: string;
  rowIdx: number;
  columnIdx: number;
  isEditing: boolean;
};

export type DataSheetProps<T extends object, C extends Column> = {
  ref?: Ref<DataSheetRef>;
  data: T[];
  columns: C[];
  encoders?: Record<string, (data: any[][]) => string | Blob | PromiseLike<string | Blob>>;
  encodeValue?: (item: T, key: string) => any;
  allowSelection?: boolean;
  allowEditForCell?: boolean | ((row: number, col: number) => boolean);
  columnWidth?: number[];
  columnMinWidth?: number;
  startRowNumber?: number;
  stickyHeader?: boolean;
  stickyRowNumbers?: boolean;
  showEmptyLastRow?: boolean;
  highlightColor?: string;
  renderItem: (x: RanderItemParams<T, C>, ref: DataSheetRef) => ElementNode;
  onColumnWidthChange?: (col: number, width: number, ref: DataSheetRef) => void;
  onSelectionChanged?: VoidFunction;
  onDeleteRows?: (rows: number[], ref: DataSheetRef) => void;
  onDeleteCells?: (cells: Range<Position>, ref: DataSheetRef) => void;
  onCopyRows?: (rows: number[], data: Pick<T, keyof T>[], ref: DataSheetRef) => void;
  onCopyCells?: (cells: Range<Position>, data: Pick<T, keyof T>[], ref: DataSheetRef) => void;
  onPasteRows?: (rows: number[], clipboard: DataTransfer | Clipboard, ref: DataSheetRef) => void;
  onPasteCells?: (cells: Range<Position>, clipboard: DataTransfer | Clipboard, ref: DataSheetRef) => void;
  onStartEditing?: (row: number, col: number, ref: DataSheetRef) => void;
  onEndEditing?: (row: number, col: number, ref: DataSheetRef) => void;
};