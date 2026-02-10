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
import { useLocation } from 'frosty/web';
import { match } from 'path-to-regexp';
import { createContext, createPairs, ElementNode, PropsWithChildren, useContext, useMemo } from 'frosty';

const { Parent, Child } = createPairs();

const Context = createContext<{
  path: string;
  outlet?: ElementNode;
  params?: Partial<Record<string, string | string[]>>;
}>({
  path: '',
});

type RoutesProps = {

};

export const Routes = ({
  children,
}: PropsWithChildren<RoutesProps>) => {
  return (
    <Parent>{children}</Parent>
  );
};

type RouteProps = {
  path?: string;
  index?: boolean;
  element?: ElementNode;
};

export const Route = ({
  path,
  index,
  element,
  children,
}: PropsWithChildren<RouteProps>) => {
  const location = useLocation();
  const parent = useContext(Context);
  const currentPath = path ? `${_.trimEnd(parent.path, '/')}/${_.trimStart(path, '/')}` : parent.path;
  const matchedIndex = useMemo(() => index && match(parent.path)(location.pathname), [location.pathname, parent.path, index]);
  const matchedPath = useMemo(() => !!currentPath && match(currentPath)(location.pathname), [location.pathname, currentPath]);
  const matched = matchedIndex || matchedPath;
  const outlet = (
    <Parent>{children}</Parent>
  );
  return (
    <Child>
      <Context value={{
        path: currentPath,
        outlet,
        params: matched ? matched.params : undefined,
      }}>
        {!!matched && element}
        {outlet}
      </Context>
    </Child>
  );
};

export const Outlet = () => {
  const parent = useContext(Context);
  return (
    <Context value={{ path: parent.path }}>
      {parent.outlet}
    </Context>
  );
};

export const useParams = () => {
  const context = useContext(Context);
  return context.params ?? {};
};
