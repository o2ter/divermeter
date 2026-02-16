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
import { ComponentProps, createContext, ElementNode, PropsWithChildren, useContext, useMemo } from 'frosty';

type RouteProps = PropsWithChildren<{
  title?: string | ((params?: ParamData) => string);
  path?: string;
  index?: boolean;
  element?: ElementNode;
}>;

type _Route = Omit<RouteProps, 'children'> & {
  children?: _Route[];
};

const collectRoutes = (element: ElementNode): _Route[] => {
  if (!element || _.isString(element) || _.isNumber(element) || _.isBoolean(element)) return [];
  if (typeof element === 'bigint') return [];
  if (Symbol.iterator in element) {
    return _.flatMap([...element], x => collectRoutes(x));
  }
  if (_.isObject(element) && element.type === Route) {
    const { children, ...props } = element.props as RouteProps;
    return [{
      ...props,
      children: collectRoutes(children),
    }];
  }
  return [];
};

type MatchResult = {
  path?: string;
  params?: ParamData;
};

const Context = createContext<MatchResult & {
  outlet?: ElementNode;
}>({});

type RoutesProps = PropsWithChildren<{
  path?: string;
}>;

const matchRoute = (
  parentPath: string | undefined,
  routeProps: Pick<_Route, 'index' | 'path'>,
  location: string,
) => {
  const currentPath = `${_.trimEnd(parentPath, '/')}/${_.trimStart(routeProps.path, '/')}`;
  const matchedIndex = !!routeProps.index && !!parentPath && match(parentPath)(location);
  const matchedPath = !!currentPath && match(currentPath)(location);
  return matchedIndex || matchedPath || undefined;
};

export const Routes = ({
  path,
  children,
}: RoutesProps) => {
  const routes = collectRoutes(children);
  const location = useLocation();
  const parent = useContext(Context);

  const resolve = (routes: _Route[], parentPath?: string): (_Route & { matched?: MatchResult; })[] => {
    for (const route of routes) {
      const matched = matchRoute(parentPath, route, location.pathname);
      if (route.children) {
        const found = resolve(route.children, `${_.trimEnd(parentPath, '/')}/${_.trimStart(route.path, '/')}`);
        if (found.length) return [...found, { ...route, matched }];
      }
      if (matched) {
        return [{ ...route, matched }];
      }
    }
    return [];
  };

  const stacks = resolve(routes, parent.path);
  const title = stacks.find(x => x.title)?.title;
  const matched = stacks.find(x => x.matched)?.matched;

  return (
    <>
      {!!title && (
        <head><title>{_.isFunction(title) ? title(matched?.params) : title}</title></head>
      )}
      {_.reduce(stacks, (outlet, { element, matched = {} }) => (
        <Context value={{ ...matched, outlet }}>
          {element || outlet}
        </Context>
      ), <></>)}
    </>
  );
};

export const Route = ({ }: RouteProps) => (
  <></>
);

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
