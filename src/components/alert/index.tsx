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
import { useStyle } from '../style';

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
  style: alertStyle,
  onShow,
  onDismiss,
  formatter,
}: AlertBodyProps) => {
  const theme = useTheme();
  const style = useStyle();
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

  // Determine color and background based on alert style
  const { color, backgroundColor, textColor, icon } = useMemo(() => {
    if (_.isString(alertStyle)) {
      // Use pre-calculated styles for semantic alert types
      return {
        color: style.alert.colors[alertStyle],
        backgroundColor: style.alert.backgrounds[alertStyle],
        textColor: style.alert.textColors[alertStyle],
        icon: style.alert.icons[alertStyle],
      };
    } else {
      // For custom colors, calculate on the fly
      const customColor = alertStyle.color;
      const customBg = style.withOpacity(customColor, 0.9);
      const customText = theme.colorContrast(customColor);
      return {
        color: customColor,
        backgroundColor: customBg,
        textColor: customText,
        icon: alertStyle.icon ?? undefined,
      };
    }
  }, [alertStyle, style, theme]);

  // Format message
  const displayMessage = (() => {
    if (_.isString(message)) return message;
    if (message instanceof Error) {
      return formatter ? formatter(message) : message.message;
    }
    return String(message);
  })();

  return (
    <div style={{
      backgroundColor,
      color: textColor,
      padding: `${style.spacing.md}px ${style.spacing.lg}px`,
      marginBottom: style.spacing.sm,
      borderRadius: style.borderRadius.md,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: style.spacing.sm,
      minWidth: '300px',
      maxWidth: '500px',
      opacity: isExiting ? 0 : isVisible ? 1 : 0,
      transform: isExiting ? 'translateY(20px)' : isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
      <div style={{
        flex: 1,
        fontSize: style.fontSize.sm,
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
          padding: style.spacing.xs,
          fontSize: style.fontSize.lg,
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

  const [elements, setElements] = useState<{ [x: string]: ElementNode }>({});
  const style = useStyle();

  const showMessage = useCallback((
    message: any,
    alertStyle: AlertType | Omit<AlertOptions, 'timeout'>,
    timeout?: number,
  ) => {
    if (_.isNil(message)) return;
    if (!_.isString(message) && _.isArrayLike(message)) {
      _.forEach(message, x => showMessage(x, alertStyle, timeout));
      return;
    }
    const id = _.uniqueId();
    setElements(elements => ({
      ...elements,
      [id]: (
        <AlertBody
          key={id}
          message={message}
          style={alertStyle}
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
        bottom: style.spacing.lg,
        right: style.spacing.lg,
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