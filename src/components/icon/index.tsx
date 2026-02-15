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

import { ComponentType } from 'frosty';

export type IconName =
  | 'close'
  | 'closeFilled'
  | 'search'
  | 'sortAsc'
  | 'sortDesc'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronDoubleLeft'
  | 'chevronDoubleRight'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'link'
  | 'upload'
  | 'download'
  | 'plus'
  | 'trash';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg';

export type IconProps = {
  name: IconName;
  size?: IconSize | number;
  style?: any;
};

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
};

const iconPaths: Record<IconName, { viewBox: string; paths: string[] }> = {
  close: {
    viewBox: '0 0 12 12',
    paths: ['M9.5 2.5L2.5 9.5M2.5 2.5L9.5 9.5'],
  },
  closeFilled: {
    viewBox: '0 0 20 20',
    paths: [
      'M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z',
    ],
  },
  search: {
    viewBox: '0 0 16 16',
    paths: ['M7 12a5 5 0 100-10 5 5 0 000 10z', 'M11 11l3 3'],
  },
  sortAsc: {
    viewBox: '0 0 12 12',
    paths: ['M6 3L9 7H3L6 3Z'],
  },
  sortDesc: {
    viewBox: '0 0 12 12',
    paths: ['M6 9L3 5H9L6 9Z'],
  },
  chevronLeft: {
    viewBox: '0 0 12 12',
    paths: ['M7 10L3 6L7 2'],
  },
  chevronRight: {
    viewBox: '0 0 12 12',
    paths: ['M5 2L9 6L5 10'],
  },
  chevronDoubleLeft: {
    viewBox: '0 0 12 12',
    paths: ['M8 10L4 6L8 2', 'M5 10L1 6L5 2'],
  },
  chevronDoubleRight: {
    viewBox: '0 0 12 12',
    paths: ['M4 2L8 6L4 10', 'M7 2L11 6L7 10'],
  },
  success: {
    viewBox: '0 0 20 20',
    paths: [
      'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
    ],
  },
  info: {
    viewBox: '0 0 20 20',
    paths: [
      'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
    ],
  },
  warning: {
    viewBox: '0 0 20 20',
    paths: [
      'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
    ],
  },
  error: {
    viewBox: '0 0 20 20',
    paths: [
      'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
    ],
  },
  link: {
    viewBox: '0 0 16 16',
    paths: ['M10.5 2.5L13.5 5.5M13.5 5.5L10.5 8.5M13.5 5.5H6.5C4.5 5.5 3 7 3 9C3 11 4.5 12.5 6.5 12.5H8'],
  },
  upload: {
    viewBox: '0 0 16 16',
    paths: ['M8 11V3M8 3L5 6M8 3L11 6', 'M2 11V13C2 13.5 2.5 14 3 14H13C13.5 14 14 13.5 14 13V11'],
  },
  download: {
    viewBox: '0 0 16 16',
    paths: ['M8 3V11M8 11L5 8M8 11L11 8', 'M2 11V13C2 13.5 2.5 14 3 14H13C13.5 14 14 13.5 14 13V11'],
  },
  plus: {
    viewBox: '0 0 16 16',
    paths: ['M8 3V13', 'M3 8H13'],
  },
  trash: {
    viewBox: '0 0 16 16',
    paths: ['M3 4H13', 'M5 4V3C5 2.5 5.5 2 6 2H10C10.5 2 11 2.5 11 3V4', 'M6 7V11', 'M10 7V11', 'M4 4L4.5 13C4.5 13.5 5 14 5.5 14H10.5C11 14 11.5 13.5 11.5 13L12 4'],
  },
};

const isStrokeIcon = (name: IconName): boolean => {
  return [
    'close',
    'search',
    'chevronLeft',
    'chevronRight',
    'chevronDoubleLeft',
    'chevronDoubleRight',
    'link',
    'upload',
    'download',
    'plus',
    'trash',
  ].includes(name);
};

const isFillIcon = (name: IconName): boolean => {
  return [
    'sortAsc',
    'sortDesc',
    'closeFilled',
    'success',
    'info',
    'warning',
    'error',
  ].includes(name);
};

export const Icon: ComponentType<IconProps> = ({ name, size = 'md', style }) => {
  const iconDef = iconPaths[name];
  if (!iconDef) return null;

  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  const isStroke = isStrokeIcon(name);
  const isFill = isFillIcon(name);

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox={iconDef.viewBox}
      fill={isFill ? 'currentColor' : 'none'}
      style={style}
    >
      {iconDef.paths.map((pathData, index) => (
        <path
          key={index}
          d={pathData}
          stroke={isStroke ? 'currentColor' : undefined}
          strokeWidth={isStroke ? '1.5' : undefined}
          strokeLinecap={isStroke ? 'round' : undefined}
          strokeLinejoin={isStroke && name.includes('chevron') ? 'round' : undefined}
          fill={isFill ? 'currentColor' : undefined}
          fillRule={isFill && name !== 'sortAsc' && name !== 'sortDesc' ? 'evenodd' : undefined}
          clipRule={isFill && name !== 'sortAsc' && name !== 'sortDesc' ? 'evenodd' : undefined}
        />
      ))}
    </svg>
  );
};
