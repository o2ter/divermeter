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
import { createContext, createPairs, ElementNode, PropsWithChildren, useContext, useMemo } from 'frosty';

const { Parent, Child } = createPairs();

const Context = createContext<{
  path: string;
  params?: ParamData;
  outlet?: ElementNode;
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
  title?: string | ((params?: ParamData) => string);
  path?: string;
  index?: boolean;
  element?: ElementNode;
};

export const Route = ({
  title,
  path,
  index,
  element,
  children,
}: PropsWithChildren<RouteProps>) => {
  const location = useLocation();
  const parent = useContext(Context);
  const currentPath = path ? `${_.trimEnd(parent.path, '/')}/${_.trimStart(path, '/')}` : parent.path;
  const [matchedIndex, matchedPath] = useMemo(() => [
    index && match(parent.path)(location.pathname),
    !!currentPath && match(currentPath)(location.pathname),
  ], [index, location.pathname, parent.path, currentPath]);
  const matched = matchedIndex || matchedPath || undefined;
  const outlet = (
    <Parent>{children}</Parent>
  );
  return (
    <Child>
      {title && <head><title>{_.isFunction(title) ? title(matched?.params) : title}</title></head>}
      <Context value={{ path: currentPath, params: matched?.params, outlet }}>
        {matched && element}
        {!element && outlet}
      </Context>
    </Child>
  );
};

export const Outlet = () => {
  const { outlet, ...parent } = useContext(Context);
  return (
    <Context value={parent}>
      {outlet}
    </Context>
  );
};

export const useParams = () => {
  const { params = {} } = useContext(Context);
  return params;
};
