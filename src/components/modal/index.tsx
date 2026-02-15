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
import { useStyle } from '../style';

const Context = createContext<(dispatch: SetStateAction<{ [x: string]: ElementNode; }>) => void>(() => { });

type ModalProps = PropsWithChildren<{
  show?: boolean;
}>;

export const Modal = ({
  show,
  children
}: ModalProps) => {

  const setElements = useContext(Context);

  useEffect(() => {
    if (!show) return;
    const id = _.uniqueId();
    setElements((prev) => ({ ...prev, [id]: children as ElementNode }));
    return () => setElements((prev) => _.omit(prev, id));
  }, [show, children]);

  return <></>
};

type ModalProviderProps = PropsWithChildren<{

}>;

export const ModalProvider = ({
  children
}: ModalProviderProps) => {

  const [elements, setElements] = useState<{ [x: string]: ElementNode }>({});
  const style = useStyle();

  const hasModals = !_.isEmpty(elements);

  return (
    <Context value={setElements}>
      {children}
      {hasModals && (
        <div style={style.modal.backdrop}>
          {_.map(elements, (element) => (
            <div style={style.modal.content}>
              {element}
            </div>
          ))}
        </div>
      )}
    </Context>
  );
};
