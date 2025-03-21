//
//  type.tsx
//
//  The MIT License
//  Copyright (c) 2021 - 2025 O2ter Limited. All rights reserved.
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
import { TDataType, TSchema } from './proto';

export const _typeOf = (x?: TDataType) => _.isString(x) ? x : x?.type;
export const typeOf = (x?: TDataType) => _.isString(x) ? x : x?.type === 'pointer' && x.target === 'File' ? 'file' : x?.type;

export const typeStr = (x?: TDataType) => {
  if (_.isString(x)) return x;
  if (x?.type === 'pointer' && x.target === 'File') return 'file';
  if (x?.type === 'pointer') return `Pointer<${x.target}>`;
  if (x?.type === 'relation') return `Relation<${x.target}>`;
  return x?.type;
};

export const flatternShape = (fields: TSchema[string]['fields']) => {
  const result: TSchema[string]['fields'] = {};
  for (const [key, field] of _.entries(fields)) {
    if (_.isString(field) || field.type !== 'shape') {
      result[key] = field;
    } else {
      for (const [x, type] of _.entries(flatternShape(field.shape))) {
        result[`${key}.${x}`] = type;
      }
    }
  }
  return result;
};
