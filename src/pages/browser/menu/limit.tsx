//
//  limit.tsx
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
import React from 'react';
import { Text, TextInput } from '@o2ter/react-ui';
import { MenuButton } from './base';
import { Row } from '@o2ter/wireframe';

type LimitButtonProps = {
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
};

export const LimitButton: React.FC<LimitButtonProps> = ({
  limit,
  setLimit,
}) => {

  const [text, setText] = React.useState<string | null>(null);

  function submit() {
    const number = text ? parseInt(text, 10) : limit;
    if (_.isSafeInteger(number)) setLimit(number);
    setText(null);
  }

  return (
    <MenuButton
      title='Limit'
      menu={(
        <Row classes='text-white  gap-2 align-items-center'>
          <Text>Limit</Text>
          <TextInput
            classes='border-0 bg-primary-800'
            style={{
              outline: 'none',
              color: 'white',
            } as any}
            value={text ?? `${limit ?? ''}`}
            onFocus={() => setText(`${limit ?? ''}`)}
            onChangeText={setText}
            onBlur={() => submit()}
            onSubmitEditing={() => submit()}
          />
        </Row>
      )}
    />
  )
};