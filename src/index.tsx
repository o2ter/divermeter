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
import { ComponentType, ErrorBoundary } from 'frosty';
import { ProtoProvider } from './proto';
import { ThemeProvider, ThemeSettings } from './components/theme';
import type { ProtoClient } from 'proto.io';
import { StyleProvider } from './components/style';
import { Menu } from './components/menu';
import { createPages, Page, Route, Routes } from './components/router';
import { HomePage } from './pages/home';
import { BrowserPage } from './pages/browser';
import { ConfigPage } from './pages/config';
import { NotFoundPage } from './pages/notfound';
import { AlertProvider, useAlert } from './components/alert';
import { ModalProvider } from './components/modal';
import { ActivityProvider } from './components/activity';

export { useTheme } from './components/theme';
export { useParams, Outlet } from './components/router';
export { useProto, useProtoSchema } from './proto';
export { useAlert } from './components/alert';
export { Modal } from './components/modal';
export { Spinner } from './components/spinner';
export { Button } from './components/button';
export { Icon } from './components/icon';
export type { SpinnerProps } from './components/spinner';
export type { ButtonProps } from './components/button';
export type { IconProps, IconName, IconSize } from './components/icon';

const Main = ({ pages }: { pages?: Page[]; }) => {
  const { showError } = useAlert();
  return (
    <ErrorBoundary onError={error => showError(error.message)}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
      }}>
        <div style={{ width: 240 }}>
          <Menu pages={pages} />
        </div>
        <div style={{
          flex: 1
        }}>
          <Routes>
            <Route title='Dashboard' index element={<HomePage />} />
            <Route title={({ schema } = {}) => `${schema}`} path="/classes/:schema" element={<BrowserPage />} />
            <Route title='Config' path="/config" element={<ConfigPage />} />
            {pages && createPages(pages)}
            <Route path='*path' element={<NotFoundPage />} />
          </Routes>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export const Dashboard: ComponentType<{
  proto: ProtoClient;
  theme?: ThemeSettings;
  pages?: Page[];
}> = ({ proto, theme, pages }) => (
  <ThemeProvider theme={theme}>
    <StyleProvider>
      <AlertProvider>
        <ModalProvider>
          <ActivityProvider>
            <ProtoProvider proto={proto}>
              <Main pages={pages} />
            </ProtoProvider>
          </ActivityProvider>
        </ModalProvider>
      </AlertProvider>
    </StyleProvider>
  </ThemeProvider>
);

export default Dashboard;
