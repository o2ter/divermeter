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
import { createContext, ElementNode, PropsWithChildren, SetStateAction, useContext, useEffect, useMemo, useState } from 'frosty';
import { useTheme } from '../theme';
import { normalizeColor, rgba, getRed, getGreen, getBlue, toHexString } from '@o2ter/colors.js';

const Context = createContext<(dispatch: SetStateAction<{ [x: string]: ElementNode; }>) => void>(() => { });

type ModalProps = PropsWithChildren<{
  show?: boolean;
}>;

export const Modal = ({
  show,
  children
}: ModalProps) => {

  const id = useMemo(() => _.uniqueId(), []);
  const setElements = useContext(Context);

  useEffect(() => {
    if (!show) return;
    setElements((prev) => ({ ...prev, [id]: children as ElementNode }));
    return () => setElements((prev) => _.omit(prev, id));
  }, [id, show]);

  return <></>
};

type ModalProviderProps = PropsWithChildren<{

}>;

export const ModalProvider = ({
  children
}: ModalProviderProps) => {

  const [elements, setElements] = useState<{ [x: string]: ElementNode }>({});
  const theme = useTheme();

  const hasModals = !_.isEmpty(elements);

  return (
    <Context value={setElements}>
      {children}
      {hasModals && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: theme.spacing.lg,
          }}
        >
          {_.map(elements, (element) => (
            <div
              style={{
                borderRadius: theme.borderRadius.lg,
                maxWidth: '90%',
                maxHeight: '90%',
                overflow: 'auto',
              }}
            >{element}
            </div>
          ))}
        </div>
      )}
    </Context>
  );
};
