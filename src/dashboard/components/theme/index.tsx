//
//  index.tsx
//
//  The MIT License
//  Copyright (c) 2021 - 2025 O2ter Limited. All rights reserved.
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
import { createContext, PropsWithChildren, useContext } from 'frosty';

const initialStyle = `
:root {
  --font-sans-serif: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-monospace: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

body {
  margin: 0;
  font-family: var(--font-sans-serif);
  background-color: white;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
}

h1 {
  font-weight: 500;
  font-size: 40px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

h2 {
  font-weight: 500;
  font-size: 32px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

h3 {
  font-weight: 500;
  font-size: 28px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

h4 {
  font-weight: 500;
  font-size: 24px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

h5 {
  font-weight: 500;
  font-size: 20px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

h6 {
  font-weight: 500;
  font-size: 16px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

table {
  width: 100%;
  color: #212529;
  vertical-align: top;
  border-collapse: collapse;
  margin-bottom: 16px;
  border-top-color: #dee2e6;
  border-bottom-color: #dee2e6;
  border-left-color: #dee2e6;
  border-right-color: #dee2e6;
}

th {
  text-align: inherit;
}

tbody, td, tfoot, th, thead, tr {
  border-style: solid;
  border-top-color: inherit;
  border-bottom-color: inherit;
  border-left-color: inherit;
  border-right-color: inherit;
  border-top-width: 0;
  border-bottom-width: 0;
  border-left-width: 0;
  border-right-width: 0;
}

table &gt;
thead &gt;
tr &gt;
* {
  border-bottom-color: currentColor;
}

table tr &gt;
* {
  background-color: transparent;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 8px;
  padding-right: 8px;
  border-bottom-width: 1px;
}

table &gt;
tbody {
  vertical-align: inherit;
}

table &gt;
thead {
  vertical-align: bottom;
}

.table-striped tr:nth-of-type(odd) &gt;
* {
  background-color: rgba(0, 0, 0, 0.05);
}

.absolute-fill {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.fixed-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1030;
}

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1030;
}

.sticky-top {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1020;
}

.h1 {
  font-weight: 500;
  font-size: 40px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

.h2 {
  font-weight: 500;
  font-size: 32px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

.h3 {
  font-weight: 500;
  font-size: 28px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

.h4 {
  font-weight: 500;
  font-size: 24px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

.h5 {
  font-weight: 500;
  font-size: 20px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}

.h6 {
  font-weight: 500;
  font-size: 16px;
  line-height: 1.2;
  margin-top: 0;
  margin-bottom: 8px;
}
`;

export type ThemeSettings = {
  primaryColor: string;
  secondaryColor: string;
};

const Context = createContext<ThemeSettings>({
  primaryColor: '#1890ff',
  secondaryColor: '#f0f0f0',
});

export const ThemeProvider = ({
  theme,
  children,
}: PropsWithChildren<{
  theme?: Partial<ThemeSettings>;
}>) => {
  const parent = useContext(Context);
  const value = _.merge({}, parent, theme);
  return (
    <Context value={value}>
      <head>
        <style>{initialStyle}</style>
      </head>
      {children}
    </Context>
  );
};

export const useTheme = () => {
  const theme = useContext(Context);
  return {
    ...theme,
  };
};
