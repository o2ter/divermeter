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
import { ComponentType } from 'frosty';
import { ProtoProvider } from './proto';
import { ThemeProvider, ThemeSettings } from './components/theme';
import type { ProtoClient } from 'proto.io';
import { StyleProvider } from './components/style';
import { Menu } from './components/menu';
import { createPages, Page, Route, Routes } from './components/router';
import { HomePage } from './pages/home';
import { BrowserPage } from './pages/browser';
import { ConfigPage } from './pages/config';

export { useTheme } from './components/theme';
export { useParams, Outlet } from './components/router';
export { useProto, useProtoSchema } from './proto';

export const Dashboard: ComponentType<{
  proto: ProtoClient;
  theme?: ThemeSettings;
  pages?: Page[];
}> = ({ proto, theme, pages }) => (
  <ThemeProvider theme={theme}>
    <ProtoProvider proto={proto}>
      <StyleProvider>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
        }}>
          <div style={{ width: 240 }}>
            <Menu pages={pages} />
          </div>
          <div style={{ flex: 1 }}>
            <Routes>
              <Route title='Dashboard' index element={<HomePage />} />
              <Route title={({ schema } = {}) => `${schema}`} path="/classes/:schema" element={<BrowserPage />} />
              <Route title='Config' path="/config" element={<ConfigPage />} />
              {pages && createPages(pages)}
            </Routes>
          </div>
        </div>
      </StyleProvider>
    </ProtoProvider>
  </ThemeProvider>
);

export default Dashboard;
