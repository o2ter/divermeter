//
//  filter.tsx
//
//  The MIT License
//  Copyright (c) 2021 - 2023 O2ter Limited. All rights reserved.
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
import React from 'react';
import { MenuButton } from './base';
import { Button, View } from '@o2ter/react-ui';
import { Row } from '@o2ter/wireframe';

const comparisonKeys = [
  '$eq',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$ne',
] as const;

const conditionalKeys = [
  '$and',
  '$nor',
  '$or',
] as const;

export type FilterType = {
  op: typeof conditionalKeys[number];
  exprs: FilterType[];
} | {
  op: typeof comparisonKeys[number];
  field: string;
  value: any;
};

export const encodeFilter = (filter: any): any => {
  if (_.includes(conditionalKeys, filter.op)) {
    return { [filter.op]: _.map(filter.exprs, v => encodeFilter(v)) };
  }
  if (_.includes(comparisonKeys, filter.op)) {
    return { [filter.field]: { [filter.op]: filter.value } };
  }
  throw Error();
}

type FilterButtonProps = {
  filter: FilterType[];
  setFilter: React.Dispatch<React.SetStateAction<FilterType[]>>;
};

export const FilterButton: React.FC<FilterButtonProps> = ({
  filter,
  setFilter,
}) => {

  const [store, setStore] = React.useState(filter);

  return (
    <MenuButton
      title='Filter'
      menu={({ hide }) => (
        <View classes='text-white'>

          <Row>
            <Button title='Cancel' outline variant='danger' onPress={() => {
              hide();
            }} />
            <Button title='Submit' onPress={() => {
              setFilter(store);
              hide();
            }} />
          </Row>
        </View>
      )}
    />
  );
}