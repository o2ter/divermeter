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
import React from 'react';
import { View, Text } from '@o2ter/react-ui';
import { Row } from '@o2ter/wireframe';
import { TSchema } from '../../proto';
import { LayoutRectangle, StyleSheet } from 'react-native';
import { flatternShape, typeStr } from '../../utils';

export const Schema: React.FC<{ schema: TSchema; }> = ({ schema }) => {
  const [layout, setLayout] = React.useState<LayoutRectangle>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nodes = _.map(schema, ({ fields }, name) => ({
      name,
      fields: _.map({
        ...flatternShape(fields),
        ...name === 'User' ? { password: 'string' } : {},
      } as ReturnType<typeof flatternShape>, (type, key) => ({
        key,
        type: typeStr(type) ?? '',
      })),
    })).map(x => ({
      ...x,
      maxLength: Math.max(
        x.name.length,
        ..._.map(x.fields, ({ key, type }) => key.length + type.length + 4)
      )
    }));

    for (const node of nodes) {
      const posX = 100;
      const posY = 100;
      const maxWidth = node.maxLength * 8 + 16;
      const maxHeight = node.fields.length * 18 + 40;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.roundRect(posX, posY, maxWidth, maxHeight, [8]);
      ctx.fill();
      ctx.stroke();
      ctx.font = '24px font-monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'black';
      ctx.fillText(node.name, posX + maxWidth * 0.5, posY + 32);
      ctx.font = '18px font-monospace';
      for (const [i, field] of node.fields.entries()) {
        ctx.textAlign = 'start';
        ctx.fillStyle = 'black';
        ctx.fillText(field.key, posX + 8, posY + 50 + i * 18);
        ctx.textAlign = 'end';
        ctx.fillStyle = 'gray';
        ctx.fillText(field.type, posX + maxWidth - 8, posY + 50 + i * 18);
      }
    }

  }, [schema, layout]);
  return (
    <>
      <Row classes='py-3 px-4 justify-content-between bg-secondary-600 text-secondary-200 font-monospace'>
        <View>
          <Text style={{ fontSize: 10 }}>SYSTEM</Text>
          <Text classes='h5 text-white'>Schema</Text>
        </View>
      </Row>
      <View classes='flex-fill bg-secondary-100'>
        <View style={StyleSheet.absoluteFill} onLayout={(e) => setLayout(e.nativeEvent.layout)}>
          <div className='flex-fill overflow-auto'>
            <canvas ref={canvasRef} width={layout?.width} height={layout?.height} />
          </div>
        </View>
      </View>
    </>
  );
}