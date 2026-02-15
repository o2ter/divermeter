//
//  utils.ts
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
import { TSchema } from '../../proto';

export const _typeOf = (x?: TSchema['fields'][string]) => _.isString(x) ? x : x?.type;
export const typeOf = (x?: TSchema['fields'][string]) => _.isString(x) ? x : x?.type === 'pointer' && x.target === 'File' ? 'file' : x?.type;

export const encodeValue = (value: any, space = 2) => {
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

export const decodeValue = (text: string): any => {
  // Parser for encoded value format
  let pos = 0;

  const skipWhitespace = () => {
    while (pos < text.length && /\s/.test(text[pos])) pos++;
  };

  const parseValue = (): any => {
    skipWhitespace();

    // null
    if (text.substr(pos, 4) === 'null') {
      pos += 4;
      return null;
    }

    // boolean
    if (text.substr(pos, 4) === 'true') {
      pos += 4;
      return true;
    }
    if (text.substr(pos, 5) === 'false') {
      pos += 5;
      return false;
    }

    // ISODate
    if (text.substr(pos, 8) === 'ISODate(') {
      pos += 8;
      skipWhitespace();
      const str = parseString();
      skipWhitespace();
      if (text[pos] !== ')') throw new Error(`Expected ')' at position ${pos}`);
      pos++;
      return new Date(str);
    }

    // Decimal
    if (text.substr(pos, 8) === 'Decimal(') {
      pos += 8;
      skipWhitespace();
      const str = parseString();
      skipWhitespace();
      if (text[pos] !== ')') throw new Error(`Expected ')' at position ${pos}`);
      pos++;
      return new Decimal(str);
    }

    // string
    if (text[pos] === '"' || text[pos] === "'") {
      return parseString();
    }

    // number
    if (text[pos] === '-' || (text[pos] >= '0' && text[pos] <= '9')) {
      return parseNumber();
    }

    // array
    if (text[pos] === '[') {
      return parseArray();
    }

    // object
    if (text[pos] === '{') {
      return parseObject();
    }

    throw new Error(`Unexpected character '${text[pos]}' at position ${pos}`);
  };

  const parseString = (): string => {
    const quote = text[pos];
    if (quote !== '"' && quote !== "'") throw new Error(`Expected string at position ${pos}`);
    pos++;

    let str = '';
    while (pos < text.length && text[pos] !== quote) {
      if (text[pos] === '\\') {
        pos++;
        if (pos >= text.length) throw new Error('Unexpected end of string');
        switch (text[pos]) {
          case 'n': str += '\n'; break;
          case 't': str += '\t'; break;
          case 'r': str += '\r'; break;
          case '\\': str += '\\'; break;
          case '"': str += '"'; break;
          case "'": str += "'"; break;
          default: str += text[pos];
        }
      } else {
        str += text[pos];
      }
      pos++;
    }

    if (text[pos] !== quote) throw new Error(`Unterminated string at position ${pos}`);
    pos++;
    return str;
  };

  const parseNumber = (): number => {
    const start = pos;
    if (text[pos] === '-') pos++;
    while (pos < text.length && text[pos] >= '0' && text[pos] <= '9') pos++;
    if (text[pos] === '.') {
      pos++;
      while (pos < text.length && text[pos] >= '0' && text[pos] <= '9') pos++;
    }
    if (text[pos] === 'e' || text[pos] === 'E') {
      pos++;
      if (text[pos] === '+' || text[pos] === '-') pos++;
      while (pos < text.length && text[pos] >= '0' && text[pos] <= '9') pos++;
    }
    return parseFloat(text.substring(start, pos));
  };

  const parseArray = (): any[] => {
    if (text[pos] !== '[') throw new Error(`Expected '[' at position ${pos}`);
    pos++;
    skipWhitespace();

    const arr: any[] = [];

    if (text[pos] === ']') {
      pos++;
      return arr;
    }

    while (true) {
      arr.push(parseValue());
      skipWhitespace();

      if (text[pos] === ']') {
        pos++;
        break;
      }

      if (text[pos] === ',') {
        pos++;
        skipWhitespace();
        if (text[pos] === ']') {
          pos++;
          break;
        }
        continue;
      }

      throw new Error(`Expected ',' or ']' at position ${pos}`);
    }

    return arr;
  };

  const parseObject = (): Record<string, any> => {
    if (text[pos] !== '{') throw new Error(`Expected '{' at position ${pos}`);
    pos++;
    skipWhitespace();

    const obj: Record<string, any> = {};

    if (text[pos] === '}') {
      pos++;
      return obj;
    }

    while (true) {
      skipWhitespace();

      // Parse key (can be identifier or string)
      let key: string;
      if (text[pos] === '"' || text[pos] === "'") {
        key = parseString();
      } else {
        // Parse identifier
        const start = pos;
        while (pos < text.length && /[a-zA-Z0-9_$]/.test(text[pos])) pos++;
        key = text.substring(start, pos);
        if (!key) throw new Error(`Expected property name at position ${pos}`);
      }

      skipWhitespace();
      if (text[pos] !== ':') throw new Error(`Expected ':' at position ${pos}`);
      pos++;

      obj[key] = parseValue();
      skipWhitespace();

      if (text[pos] === '}') {
        pos++;
        break;
      }

      if (text[pos] === ',') {
        pos++;
        skipWhitespace();
        if (text[pos] === '}') {
          pos++;
          break;
        }
        continue;
      }

      throw new Error(`Expected ',' or '}' at position ${pos}`);
    }

    return obj;
  };

  const result = parseValue();
  skipWhitespace();

  if (pos < text.length) {
    throw new Error(`Unexpected content after value at position ${pos}`);
  }

  return result;
};

export const verifyValue = (value: any) => {
  if (_.isNil(value) || _.isBoolean(value) || _.isNumber(value) || _.isString(value) || _.isDate(value)) return;
  if (value instanceof Decimal) return;
  if (_.isArray(value)) {
    for (const item of value) {
      verifyValue(item);
    }
    return;
  }
  if (_.isPlainObject(value)) {
    for (const v of _.values(value)) {
      verifyValue(v);
    }
    return;
  }
  throw Error('Invalid value');
};
