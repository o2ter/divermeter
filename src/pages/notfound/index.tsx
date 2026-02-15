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

import { useTheme } from '../../components/theme';
import { useLocation } from 'frosty/web';
import { normalizeColor, getRed, getGreen, getBlue, rgba, toHexString } from '@o2ter/colors.js';

export const NotFoundPage = () => {
  const theme = useTheme();
  const location = useLocation();

  // Get text color that contrasts with white background
  const textColor = theme.colorContrast('#ffffff');
  
  // Create secondary text color with opacity
  const textSecondary = () => {
    const normalized = normalizeColor(textColor);
    if (!normalized) return textColor;
    return toHexString(rgba(
      getRed(normalized),
      getGreen(normalized),
      getBlue(normalized),
      Math.round(255 * 0.6)
    ), true);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      padding: theme.spacing.xl,
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 72,
        fontWeight: theme.fontWeight.semibold,
        color: textSecondary(),
        marginBottom: theme.spacing.md,
      }}>
        404
      </div>
      <div style={{
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.medium,
        color: textColor,
        marginBottom: theme.spacing.sm,
      }}>
        Page Not Found
      </div>
      <div style={{
        fontSize: theme.fontSize.sm,
        color: textSecondary(),
        marginBottom: theme.spacing.lg,
      }}>
        The page you're looking for doesn't exist.
      </div>
      <button
        onClick={() => location.pushState({}, '/')}
        style={{
          padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
          fontSize: theme.fontSize.md,
          fontWeight: theme.fontWeight.medium,
          color: theme.colors.primary,
          backgroundColor: 'transparent',
          border: `1px solid ${theme.colors.primary}`,
          borderRadius: theme.borderRadius.md,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: theme.colors.primary,
            color: theme.colorContrast(theme.colors.primary),
          },
        }}
      >
        Go to Dashboard
      </button>
    </div>
  );
};
