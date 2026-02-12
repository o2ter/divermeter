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
import { createContext, ElementNode, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'frosty';
import { useTheme } from '../theme';

type AlertType = 'success' | 'info' | 'warning' | 'error';
type AlertOptions = {
  color: string;
  icon?: ElementNode;
  timeout?: number;
};

const Context = createContext<(
  message: any,
  style: AlertType | Omit<AlertOptions, 'timeout'>,
  timeout?: number
) => void>(() => { });

type AlertProviderProps = PropsWithChildren<{
  defaultTimeout?: number;
}>;

export const useAlert = () => {
  const showMessage = useContext(Context);
  return useMemo(() => ({
    showError(message: any, timeout?: number) { showMessage(message, 'error', timeout); },
    showWarning(message: any, timeout?: number) { showMessage(message, 'warning', timeout); },
    showInfo(message: any, timeout?: number) { showMessage(message, 'info', timeout); },
    showSuccess(message: any, timeout?: number) { showMessage(message, 'success', timeout); },
    showAlert(message: any, options: AlertOptions) { showMessage(message, options, options.timeout); },
  }), [showMessage]);
};

type AlertBodyProps = {
  message: any;
  style: AlertType | Omit<AlertOptions, 'timeout'>;
  onShow: (x: { dismiss: VoidFunction }) => void;
  onDismiss: VoidFunction;
  formatter?: (error: Error) => string;
};

const AlertBody = ({
  message,
  style,
  onShow,
  onDismiss,
  formatter,
}: AlertBodyProps) => {

  return (
    <div style={{
    }}>
    </div>
  );
};

export const AlertProvider = ({
  defaultTimeout = 5000,
  children,
}: AlertProviderProps) => {

  const [elements, setElements] = useState({});
  const theme = useTheme();

  const showMessage = useCallback((
    message: any,
    style: AlertType | Omit<AlertOptions, 'timeout'>,
    timeout?: number,
  ) => {
    if (_.isNil(message)) return;
    if (!_.isString(message) && _.isArrayLike(message)) {
      _.forEach(message, x => showMessage(x, style, timeout));
      return;
    }
    const id = _.uniqueId();
    setElements(elements => ({
      ...elements,
      [id]: (
        <AlertBody
          key={id}
          message={message}
          style={style}
          onShow={({ dismiss }) => setTimeout(dismiss, timeout ?? defaultTimeout)}
          onDismiss={() => setElements(elements => _.pickBy(elements, (_val, key) => key != id))}
        />
      ),
    }));
  }, []);

  return (
    <Context value={showMessage}>
      {children}
      {!_.isEmpty(elements) && <div style={{
      }}>{_.values(elements)}</div>}
    </Context>
  );
}