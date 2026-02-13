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
import { useProtoSchema } from '../../proto';
import { useLocation } from 'frosty/web';
import { match } from 'path-to-regexp';
import { useStyle } from '../style';
import { Page } from '../router';

const MenuItem = ({
  label,
  isActive,
  onClick
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  }) => {
  const style = useStyle();
  return (
    <div
      style={{
        padding: style.menuItem.padding,
        margin: style.menuItem.margin,
        cursor: 'pointer',
        fontSize: `${style.menuItem.fontSize}px`,
        fontWeight: isActive ? style.menuItem.activeFontWeight : style.menuItem.fontWeight,
        color: isActive ? style.menuItem.activeTextColor : style.menuItem.textColor,
        backgroundColor: isActive ? style.menuItem.activeBackground : 'transparent',
        borderRadius: `${style.menuItem.borderRadius}px`,
        boxShadow: isActive ? style.menuItem.activeShadow : 'none',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        ...(!isActive && {
          '&:hover': {
            backgroundColor: style.menuItem.hoverBackground,
            boxShadow: style.menuItem.hoverShadow,
            transform: 'translateX(2px)',
          },
        }),
      }}
      onClick={onClick}
    >
      {isActive && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '60%',
          backgroundColor: style.menuItem.accentBorder,
          borderRadius: '0 2px 2px 0',
        }} />
      )}
      <div style={{ paddingLeft: isActive ? `${style.spacing.sm}px` : '0', transition: 'padding 0.25s ease' }}>
        {label}
      </div>
    </div>
  );
};

const SchemaList = () => {
  const style = useStyle();
  const location = useLocation();
  const schema = useProtoSchema();
  const selected = match('/classes/:schema')(location.pathname) || undefined;

  return (
    <div>
      <div
        style={{
          padding: style.menuHeader.padding,
          fontSize: `${style.menuHeader.fontSize}px`,
          fontWeight: style.menuHeader.fontWeight,
          color: style.menuHeader.textColor,
          textTransform: 'uppercase',
          letterSpacing: style.menuHeader.letterSpacing,
        }}
      >
        Classes
      </div>
      <div style={{ marginTop: `${style.spacing.xs}px` }}>
        {_.map(_.keys(schema).sort(), (key) => {
          const isActive = selected?.params.schema === key;
          return (
            <div
              key={key}
              style={{
                padding: style.listItem.padding,
                margin: style.listItem.margin,
                cursor: 'pointer',
                fontSize: `${style.listItem.fontSize}px`,
                fontWeight: isActive ? style.menuItem.activeFontWeight : style.listItem.fontWeight,
                color: isActive ? style.listItem.activeTextColor : style.listItem.textColor,
                backgroundColor: isActive ? style.menuItem.activeBackground : 'transparent',
                borderRadius: `${style.listItem.borderRadius}px`,
                boxShadow: isActive ? style.listItem.activeShadow : 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                ...(!isActive && {
                  '&:hover': {
                    backgroundColor: style.listItem.hoverBackground,
                    color: style.menuItem.textColor,
                    transform: 'translateX(2px)',
                  },
                }),
              }}
              onClick={() => {
                location.pushState({}, `/classes/${key}`);
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '50%',
                  backgroundColor: style.menuItem.accentBorder,
                  borderRadius: '0 2px 2px 0',
                }} />
              )}
              <div style={{
                paddingLeft: isActive ? `${style.spacing.sm}px` : '0',
                transition: 'padding 0.25s ease',
              }}>
                {key}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type MenuProps = {
  pages?: Page[];
};

export const Menu = ({ pages }: MenuProps) => {
  const style = useStyle();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isConfig = location.pathname === '/config';

  const isPageActive = (page: Page, parentPath: string = ''): boolean => {
    if (!page.path && !page.index) return false;

    const currentPath = page.path
      ? `${_.trimEnd(parentPath, '/')}/${_.trimStart(page.path, '/')}`
      : parentPath;

    // Check if current page matches
    const matchedIndex = page.index && match(parentPath)(location.pathname);
    const matchedPath = !!currentPath && match(currentPath)(location.pathname);
    const isDirectMatch = !!(matchedIndex || matchedPath);

    // Check if any subpage matches
    const hasActiveChild = page.children?.some(child => isPageActive(child, currentPath)) ?? false;

    return isDirectMatch || hasActiveChild;
  };

  const renderPageItem = (page: Page, index: number, parentPath: string = '', depth: number = 0) => {
    if (!page.path || page.index) return null;

    const currentPath = `${_.trimEnd(parentPath, '/')}/${_.trimStart(page.path, '/')}`;
    const isActive = !!match(currentPath)(location.pathname);
    const hasActiveDescendant = page.children?.some(child => isPageActive(child, currentPath)) ?? false;
    const pageLabel = typeof page.title === 'string' ? page.title : page.path;
    const hasChildren = page.children && page.children.length > 0;

    return (
      <div key={`page-${index}-${depth}`}>
        <div style={{ paddingLeft: `${depth * style.spacing.md}px` }}>
          <MenuItem
            label={pageLabel}
            isActive={isActive}
            onClick={() => location.pushState({}, currentPath)}
          />
        </div>
        {hasChildren && (isActive || hasActiveDescendant) && (
          <div>
            {_.map(page.children, (child, childIndex) =>
              renderPageItem(child, childIndex, currentPath, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: style.menu.background,
      borderRight: `1px solid ${style.menu.borderColor}`,
      boxShadow: style.menu.shadow,
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingTop: `${style.spacing.md}px`,
        paddingBottom: `${style.spacing.xl}px`,
      }}>
        <MenuItem
          label="Dashboard"
          isActive={isHome}
          onClick={() => location.pushState({}, '/')}
        />

        <div style={{
          margin: style.divider.margin,
          height: `${style.divider.height}px`,
          background: style.divider.background,
        }} />

        <SchemaList />

        <div style={{
          margin: style.divider.margin,
          height: `${style.divider.height}px`,
          background: style.divider.background,
        }} />

        <MenuItem
          label="Config"
          isActive={isConfig}
          onClick={() => location.pushState({}, '/config')}
        />

        {pages && pages.length > 0 && (
          <>
            <div style={{
              margin: style.divider.margin,
              height: `${style.divider.height}px`,
              background: style.divider.background,
            }} />
            {_.map(pages, (page, index) => renderPageItem(page, index))}
          </>
        )}
      </div>
    </div>
  );
};
