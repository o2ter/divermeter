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

  // Get default icon based on alert type
  const getDefaultIcon = (type: AlertType): ElementNode => {
    const iconSize = 20;
    const iconProps = {
      width: iconSize,
      height: iconSize,
      viewBox: '0 0 20 20',
      fill: 'currentColor',
    };

    switch (type) {
      case 'success':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg {...iconProps}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null as any;
    }
  };

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

  const icon = _.isString(style) ? getDefaultIcon(style) : (style.icon ?? undefined);

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
      transform: isExiting ? 'translateY(20px)' : isVisible ? 'translateY(0)' : 'translateY(20px)',
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
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
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
        bottom: theme.spacing.lg,
        right: theme.spacing.lg,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          {_.values(elements)}
        </div>
      </div>}
    </Context>
  );
}