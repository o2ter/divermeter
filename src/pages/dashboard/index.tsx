//
//  index.js
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
import { Navigator, Route, useAlert } from '@o2ter/react-ui';

import { useAsyncResource } from 'sugax';
import { useProto } from '../../proto';
import { SideMenu } from '../../components/sidemenu';
import { Browser } from '../browser';
import { Config } from '../config';
import NotFound from '../NotFound';
import { Row, Col } from '@o2ter/wireframe';
import { Schema } from '../schema';

export const Dashboard = () => {
  const proto = useProto();
  const { showError } = useAlert();
  const { resource: schema } = useAsyncResource(async () => {
    try {
      return await proto.schema({ master: true });
    } catch (e: any) {
      console.error(e);
      showError(e);
    }
  });
  return (
    <Row classes='flex-fill'>
      <Col classes='col-auto bg-primary-900 sticky-top dvh-100'>
        <SideMenu schema={schema} />
      </Col>
      <Col classes='min-h-100'>
        <Navigator>
          <Route path='/browser/:class' component={Browser} props={{ schema }} />
          <Route path='/config' component={Config} />
          <Route path='/schema' component={Schema} props={{ schema }} />
          <Route path='*' title='404 Not Found' statusCode={404} component={NotFound} />
        </Navigator>
      </Col>
    </Row>
  );
};

export default Dashboard;