//
//  index.js
//
//  The MIT License
//  Copyright (c) 2021 - 2024 O2ter Limited. All rights reserved.
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
import ProtoRoute, { Decimal, ProtoService, schema } from 'proto.io';
import { DatabaseFileStorage } from 'proto.io/dist/adapters/file/database';
import { PostgresStorage } from 'proto.io/dist/adapters/storage/progres';

const db_host = process.env['POSTGRES_HOST'] ?? "localhost";
const db_user = process.env['POSTGRES_USERNAME'];
const db_pass = process.env['POSTGRES_PASSWORD'];
const db = `/${process.env['POSTGRES_DATABASE'] ?? ''}`;
const db_ssl = process.env['POSTGRES_SSLMODE'];

const uri = _.compact([
  'postgres://',
  db_user && db_pass && `${db_user}:${db_pass}@`,
  db_host, db,
  db_ssl && `?ssl=true&sslmode=${db_ssl}`
]).join('');

const database = new PostgresStorage(uri);
const masterUsers = [{
  user: 'admin',
  pass: 'password'
}];

const Proto = new ProtoService({
  endpoint: 'http://localhost:8080/proto',
  masterUsers: masterUsers,
  jwtToken: 'test token',
  storage: database,
  fileStorage: new DatabaseFileStorage(),
  schema: {
    'User': {
      fields: {
        name: 'string',
      }
    },
    'Test': {
      fields: {
        boolean: 'boolean',
        number: 'number',
        decimal: 'decimal',
        string: 'string',
        date: 'date',
        object: 'object',
        array: 'array',
        file: { type: 'pointer', target: 'File' },
        pointer: { type: 'pointer', target: 'Test' },
        relation: { type: 'relation', target: 'Test' },
        relation2: { type: 'relation', target: 'Test', foreignField: 'pointer' },
        relation3: { type: 'relation', target: 'Test', foreignField: 'relation' },
        shape: schema.shape({
          boolean: 'boolean',
          number: 'number',
          decimal: 'decimal',
          string: 'string',
          date: 'date',
          object: 'object',
          array: 'array',
          file: { type: 'pointer', target: 'File' },
          pointer: { type: 'pointer', target: 'Test' },
          relation: { type: 'relation', target: 'Test' },
          relation2: { type: 'relation', target: 'Test', foreignField: 'pointer' },
          relation3: { type: 'relation', target: 'Test', foreignField: 'relation' },
          shape: schema.shape({
            boolean: 'boolean',
            number: 'number',
            decimal: 'decimal',
            string: 'string',
            date: 'date',
            object: 'object',
            array: 'array',
          }),
        }),
      },
    }
  },
});

/* eslint-disable no-param-reassign */
/**
 * @param {import('@o2ter/server-js').Server}[app]
 * @param {Record<string, any>}[env]
 */
export default async (app, env) => {

  env.PROTO_ENDPOINT = 'http://localhost:8080/proto';

  app.express().use('/proto', await ProtoRoute({
    proto: Proto,
  }));

  const date = new Date();

  await Proto.Query('Test').insert({
    boolean: true,
    number: 42,
    decimal: new Decimal('0.001'),
    string: 'hello',
    date: date,
    object: {
      boolean: true,
      number: 42,
      decimal: new Decimal('0.001'),
      string: 'hello',
      date: date,
      array: [1, 2, 3, date, new Decimal('0.001')],
    },
    array: [1, 2, 3, date, new Decimal('0.001')],
  });
}
