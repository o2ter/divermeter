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
import { useLocation } from 'frosty/web';
import { match, ParamData } from 'path-to-regexp';
import { ComponentProps, createContext, createPairs, ElementNode, PropsWithChildren, useContext, useMemo } from 'frosty';

const { Parent, Child } = createPairs();

const Context = createContext<{
  path?: string;
  params?: ParamData;
  outlet?: ElementNode;
}>({});

type RoutesProps = PropsWithChildren<{
  path?: string;
}>;

export const Routes = ({
  path,
  children,
}: RoutesProps) => {
  return (
    <Context value={{ path }}>
      <Parent>{children}</Parent>
    </Context>
  );
};

type RouteProps = PropsWithChildren<{
  title?: string | ((params?: ParamData) => string);
  path?: string;
  index?: boolean;
  element?: ElementNode;
}>;

export const Route = ({
  title,
  path,
  index,
  element,
  children,
}: RouteProps) => {
  const location = useLocation();
  const parent = useContext(Context);
  const currentPath = parent.path ? `${_.trimEnd(parent.path, '/')}/${_.trimStart(path, '/')}` : path;
  const [matchedIndex, matchedPath] = useMemo(() => [
    !!index && !!parent.path && match(parent.path)(location.pathname),
    !!currentPath && match(currentPath)(location.pathname),
  ], [index, location.pathname, parent.path, currentPath]);
  const matched = matchedIndex || matchedPath || undefined;
  const outlet = (
    <Context value={{ path: currentPath }}>
      <Parent>{children}</Parent>
    </Context>
  );
  return (
    <Child>
      <Context value={{ path: currentPath, params: matched?.params, outlet }}>
        {matched && (
          <>
            {title && <head><title>{_.isFunction(title) ? title(matched?.params) : title}</title></head>}
            {element}
          </>
        )}
        {!element && outlet}
      </Context>
    </Child>
  );
};

export const Outlet = () => useContext(Context).outlet;
export const useParams = () => useContext(Context).params ?? {};

export type Page = Omit<ComponentProps<typeof Route>, 'children'> & {
  children?: Page[];
};

export const createPages = (pages: Page[]) => _.map(pages, ({ children, ...props }) => (
  <Route {...props}>
    {children && createPages(children)}
  </Route>
));
