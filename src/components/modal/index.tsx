//
//  index.tsx
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
import React from 'react';
import { View, Text, Button, TextInput } from '@o2ter/react-ui';
import { Row } from '@o2ter/wireframe';

type ModalProps = React.PropsWithChildren<{
  title: string;
  color?: string;
  confirmed?: boolean;
  onCancel: VoidFunction;
  onSubmit?: VoidFunction;
  onConfirm?: VoidFunction;
}>;

export const Modal: React.FC<ModalProps> = ({
  title,
  color = 'primary',
  confirmed = true,
  onCancel,
  onSubmit,
  onConfirm,
  children,
}) => (
  <View classes='rounded-2 overflow-hidden w-50'>
    <View classes={`bg-${color}-600 p-3 text-white`}>
      <Text classes='h2'>{title}</Text>
    </View>
    {children}
    <Row classes='bg-body  gap-2 p-3 border-top justify-content-end'>
      <Button
        variant={color === 'danger' ? 'solid' : 'outline'}
        title='Cancel'
        color={color}
        onPress={onCancel}
      />
      {onSubmit && <Button
        title='Submit'
        color={color}
        onPress={onSubmit}
      />}
      {onConfirm && <Button
        title='Confirm'
        variant={color !== 'danger' ? 'solid' : 'outline'}
        disabled={!confirmed}
        color={color}
        onPress={onConfirm}
      />}
    </Row>
  </View>
);

type ConfirmModalProps = {
  title: string;
  color?: string;
  comfirmMessage: string;
  comfirmAnswer: string;
  onCancel: VoidFunction;
  onConfirm: VoidFunction;
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  color = 'danger',
  comfirmMessage,
  comfirmAnswer,
  ...props
}) => {
  const [value, setValue] = React.useState('');
  return (
    <Modal
      color={color}
      confirmed={value === comfirmAnswer}
      {...props}
    >
      <View classes='bg-body p-3'>
        <Text>{comfirmMessage}</Text>
        <TextInput value={value} onChangeText={setValue} />
      </View>
    </Modal>
  );
}