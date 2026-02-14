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
import { useParams } from '../../components/router';
import { QueryFilter, TObject, TSchema, useProto, useProtoSchema } from '../../proto';
import { useMemo, useResource, useState } from 'frosty';
import { DataSheet } from '../../components/datasheet';

const TableCell = ({
  item,
  column,
  schema,
  isEditing,
}: {
  item: TObject;
  column: string;
  schema: TSchema;
  isEditing: boolean;
  }) => {
  const field = schema.fields[column];
  const type = _.isString(field) ? field : field.type;
  switch (type) {
    case 'string':
      return <div>{item.get(column)}</div>;
    case 'number':
      return <div>{item.get(column)}</div>;
    case 'boolean':
      return <div>{item.get(column) ? 'true' : 'false'}</div>;
    default:
      return <div>{JSON.stringify(item.get(column))}</div>;
  }
};

export const BrowserPage = () => {
  const { schema: className } = useParams() as { schema: string; };
  const proto = useProto();
  const { [className]: schema } = useProtoSchema();

  const [filter, setFilter] = useState<QueryFilter[]>([]);

  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<{ field: string; order: 'asc' | 'desc'; }[]>([]);

  const [columnWidth, setColumnWidth] = useState<Record<string, number>>({});

  const {
    resource = [],
  } = useResource(async () => {
    const q = _.reduce(filter, (query, f) => query.filter(f), proto.Query(className));
    q.limit(limit);
    if (offset > 0) q.skip(offset);
    if (!_.isEmpty(sort)) q.sort(_.reduce(sort, (s, { field, order }) => ({ ...s, [field]: order === 'asc' ? 1 : -1 }), {}));
    return await q.find({ master: true });
  }, [className, filter, limit, offset, sort]);

  return (
    <div>
      <div>Classes {className}</div>
      <div>
        {schema && <DataSheet
          data={resource}
          columns={_.keys(schema.fields)}
          columnWidth={_.keys(schema.fields).map(key => columnWidth[key] || 150)}
          rowNumbers
          startRowNumber={offset + 1}
          onColumnWidthChange={(col, width) => {
            const columnKey = _.keys(schema.fields)[col];
            setColumnWidth(prev => ({ ...prev, [columnKey]: width }));
          }}
          renderItem={({ row, columnKey, isEditing }) => (
            <TableCell
              item={row}
              column={columnKey}
              schema={schema}
              isEditing={isEditing}
            />
          )}
        />}
      </div>
    </div>
  );
};
