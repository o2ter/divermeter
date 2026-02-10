//
//  colorUtils.ts
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

export interface ColorValue {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * Parses a color string into RGB values
 * @param color - Color string (hex, rgb, rgba)
 * @returns ColorValue object with r, g, b, and optional a
 */
export const parseColor = (color: string): ColorValue => {
  // Handle hex colors (#fff, #ffffff)
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return { r, g, b, a };
    }
  }

  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : undefined;
    return { r, g, b, a };
  }

  throw new Error(`Unable to parse color: ${color}`);
};

/**
 * Converts a ColorValue to a hex string
 * @param color - ColorValue object
 * @returns Hex string representation
 */
export const colorToHex = (color: ColorValue): string => {
  const toHex = (value: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, value))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  
  if (color.a !== undefined && color.a < 1) {
    return hex + toHex(color.a * 255);
  }
  
  return hex;
};

/**
 * Mixes two colors together by a given weight
 * @param color1 - First color (string or ColorValue)
 * @param color2 - Second color (string or ColorValue)
 * @param weight - Mix ratio (0-1, where 0 = color2, 1 = color1)
 * @returns Hex string of the mixed color
 */
export const mixColor = (
  color1: string | ColorValue,
  color2: string | ColorValue,
  weight: number
): string => {
  const c1 = typeof color1 === 'string' ? parseColor(color1) : color1;
  const c2 = typeof color2 === 'string' ? parseColor(color2) : color2;

  const w = Math.max(0, Math.min(1, weight));

  const mixed: ColorValue = {
    r: c1.r * w + c2.r * (1 - w),
    g: c1.g * w + c2.g * (1 - w),
    b: c1.b * w + c2.b * (1 - w),
  };

  if (c1.a !== undefined || c2.a !== undefined) {
    const a1 = c1.a ?? 1;
    const a2 = c2.a ?? 1;
    mixed.a = a1 * w + a2 * (1 - w);
  }

  return colorToHex(mixed);
};

/**
 * Tints a color by mixing it with white
 * @param color - Color to tint (string or ColorValue)
 * @param weight - Amount of tinting (0-1, where 0 = no change, 1 = white)
 * @returns Hex string of the tinted color
 */
export const tintColor = (color: string | ColorValue, weight: number): string =>
  mixColor('#ffffff', color, weight);

/**
 * Shades a color by mixing it with black
 * @param color - Color to shade (string or ColorValue)
 * @param weight - Amount of shading (0-1, where 0 = no change, 1 = black)
 * @returns Hex string of the shaded color
 */
export const shadeColor = (color: string | ColorValue, weight: number): string =>
  mixColor('#000000', color, weight);

/**
 * Shifts a color lighter or darker based on weight
 * @param color - Color to shift (string or ColorValue)
 * @param weight - Shift amount (-1 to 1, negative = tint, positive = shade)
 * @returns Hex string of the shifted color
 */
export const shiftColor = (color: string | ColorValue, weight: number): string =>
  weight > 0 ? shadeColor(color, weight) : tintColor(color, -weight);
