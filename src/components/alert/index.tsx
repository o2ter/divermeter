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
import { createContext, ElementNode, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'frosty';
import { useTheme } from '../theme';
import { normalizeColor, getRed, getGreen, getBlue, rgba, toHexString } from '@o2ter/colors.js';

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
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);

    // Register dismiss callback
    onShow({
      dismiss: () => {
        setIsExiting(true);
        setTimeout(onDismiss, 300); // Wait for exit animation
      },
    });
  }, [onShow, onDismiss]);

  // Determine color based on style
  const getColor = () => {
    if (_.isString(style)) {
      switch (style) {
        case 'success': return theme.colors.success;
        case 'info': return theme.colors.info;
        case 'warning': return theme.colors.warning;
        case 'error': return theme.colors.error;
        default: return theme.colors.info;
      }
    }
    return style.color;
  };

  const color = getColor();
  const textColor = theme.colorContrast(color);

  // Create background with opacity
  const backgroundColor = (() => {
    const normalized = normalizeColor(color);
    if (!normalized) return color;
    return toHexString(rgba(
      getRed(normalized),
      getGreen(normalized),
      getBlue(normalized),
      Math.round(255 * 0.9)
    ), true);
  })();

  // Format message
  const displayMessage = (() => {
    if (_.isString(message)) return message;
    if (message instanceof Error) {
      return formatter ? formatter(message) : message.message;
    }
    return String(message);
  })();

  const icon = !_.isString(style) ? style.icon : undefined;

  return (
    <div style={{
      backgroundColor,
      color: textColor,
      padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      minWidth: '300px',
      maxWidth: '500px',
      opacity: isExiting ? 0 : isVisible ? 1 : 0,
      transform: isExiting ? 'translateY(-20px)' : isVisible ? 'translateY(0)' : 'translateY(-20px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
      <div style={{
        flex: 1,
        fontSize: theme.fontSize.sm,
        lineHeight: 1.5,
      }}>
        {displayMessage}
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onDismiss, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: textColor,
          cursor: 'pointer',
          padding: theme.spacing.xs,
          fontSize: theme.fontSize.lg,
          lineHeight: 1,
          opacity: 0.7,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
      >
        ×
      </button>
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
        position: 'fixed',
        top: theme.spacing.lg,
        right: theme.spacing.lg,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          {_.values(elements)}
        </div>
      </div>}
    </Context>
  );
}