//
//  cell.tsx
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
import { Decimal } from 'proto.io';
import { TObject, TSchema } from '../../proto';

type TableCellProps = {
  item: TObject;
  column: string;
  schema: TSchema;
  isEditing: boolean;
  editingValue?: any;
  setEditingValue?: (value: any) => void;
};

const encodeValue = (value: any, space = 2) => {
  const normalName = /^[a-z_][a-z\d_]\w*$/gi;
  const _encodeValue = (value: any, space: number, padding: number): string => {
    const newline = space ? '\n' : '';
    if (_.isNil(value)) return 'null';
    if (_.isBoolean(value)) return value ? 'true' : 'false';
    if (_.isNumber(value)) return value.toString();
    if (_.isString(value)) return JSON.stringify(value);
    if (_.isDate(value)) return `ISODate('${value.toISOString()}')`;
    if (value instanceof Decimal) return `Decimal('${value.toString()}')`;
    if (_.isArray(value)) return _.isEmpty(value) ? '[]' : `[${newline}${_.map(value, v => (
      `${_.padStart('', padding, ' ')}${_encodeValue(v, space, padding + space)}`
    )).join(`,${newline || ' '}`)}${newline}${_.padStart('', padding - space, ' ')}]`;
    return _.isEmpty(value) ? '{}' : `{${newline}${_.map(value as object, (v, k) => (
      `${_.padStart('', padding, ' ')}${k.match(normalName) ? k : `"${k.replace(/[\\"]/g, '\\$&')}"`}: ${_encodeValue(v, space, padding + space)}`
    )).join(`,${newline || ' '}`)}${newline}${_.padStart('', padding - space, ' ')}}`;
  };
  return _encodeValue(value, space, space);
};

export const TableCell = ({
  item, column, schema, isEditing, editingValue, setEditingValue,
}: TableCellProps) => {
  const field = schema.fields[column];
  const type = _.isString(field) ? field : field.type;

  const cellStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as const;

  const value = item.get(column);
  if (_.isNil(value)) {
    return <div style={cellStyle}>null</div>;
  } else {
    switch (type) {
      case 'string':
        return <div style={cellStyle}>{value}</div>;
      case 'number':
        return <div style={cellStyle}>{value}</div>;
      case 'decimal':
        return <div style={cellStyle}>{value?.toString()}</div>;
      case 'boolean':
        return <div style={cellStyle}>{value ? 'true' : 'false'}</div>;
      case 'date':
        return <div style={cellStyle}>{value?.toLocaleString()}</div>;
      case 'pointer':
        return <div style={cellStyle}>{value?.id}</div>;
      case 'relation':
        return <div style={cellStyle}>{_.map(value, (v: TObject) => v.id).join(', ')}</div>;
      default:
        return <div style={cellStyle}>{encodeValue(value, 0)}</div>;
    }
  }

};
