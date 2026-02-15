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
import { createActivity, useActivity as _useActivity, PropsWithChildren } from 'frosty';
import { Spinner } from '../spinner';
import { useTheme } from '../theme';

const Activity = createActivity();

export const useActivity = () => _useActivity(Activity);

type ActivityProviderProps = PropsWithChildren<{
  defaultDelay?: number;
}>;

export const ActivityProvider = ({
  defaultDelay,
  children,
}: ActivityProviderProps) => {
  const theme = useTheme();

  return (
    <Activity defaultDelay={defaultDelay}>
      {(tasks) => (
        <>
          {children}
          {tasks > 0 && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}>
              <div style={{
                width: '48px',
                height: '48px',
              }}>
                <Spinner color={theme.colors.primary} thickness={3} speed={0.8} />
              </div>
            </div>
          )}
        </>
      )}
    </Activity>
  );
};