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
import Dashboard, { Modal, useAlert } from '../../src';
import { ProtoClient } from 'proto.io';
import { useMemo, useState } from 'frosty';
import { useLocation } from 'frosty/web';

const CustomPage = () => {
  const {
    showSuccess,
    showInfo,
    showWarning,
    showError,
  } = useAlert();
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div style={{ padding: 20 }}>This is a custom page added through the Dashboard's pages prop.</div>
      <button onClick={() => showSuccess('This is a success message!')}>Show Success Alert</button>
      <button onClick={() => showInfo('This is an info message!')}>Show Info Alert</button>
      <button onClick={() => showWarning('This is a warning message!')}>Show Warning Alert</button>
      <button onClick={() => showError('This is an error message!')}>Show Error Alert</button>
      <button onClick={() => setShowModal(true)}>Show Modal</button>
      <Modal show={showModal}>
        <div style={{ backgroundColor: 'white', padding: 20, borderRadius: 4 }}>
          <h1>Custom Modal</h1>
          <p>This is a custom modal content.</p>
          <button onClick={() => setShowModal(false)}>Close Modal</button>
        </div>
      </Modal>
    </>
  );
}

export const Main = () => {
  const location = useLocation();
  const proto = useMemo(() => new ProtoClient({
    endpoint: `${location.protocol}//${location.host}/proto`,
    masterUser: {
      user: 'admin',
      pass: 'password',
    },
  }), []);
  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <Dashboard
        proto={proto}
        pages={[
          {
            title: 'Custom Page',
            path: '/custom',
            element: <CustomPage />,
          }
        ]}
      />
    </div>
  );
};
