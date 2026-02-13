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
import { Button } from '../../src/components/button';

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
      <Button>Click me</Button>

      <Button variant="subtle" color="primary">Subtle</Button>
      <Button variant="outline" color="primary">Outline</Button>
      <Button variant="ghost" color="success">Ghost</Button>
      <Button variant="link" color="info">Link</Button>
      <Button variant="unstyled" color="primary">Unstyled</Button>

      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>

      <Button disabled>Disabled</Button>
    </>
  );
}

const SubPage1 = () => {
  return (
    <div style={{ padding: 20 }}>
      <h2>Subpage 1</h2>
      <p>This is the first subpage of the custom page.</p>
    </div>
  );
};

const SubPage2 = () => {
  return (
    <div style={{ padding: 20 }}>
      <h2>Subpage 2</h2>
      <p>This is the second subpage of the custom page.</p>
    </div>
  );
};

const NestedSubPage = () => {
  return (
    <div style={{ padding: 20 }}>
      <h2>Nested Subpage</h2>
      <p>This is a deeply nested subpage (3 levels deep).</p>
    </div>
  );
};

const AnotherPage = () => {
  return (
    <div style={{ padding: 20 }}>
      <h2>Another Page</h2>
      <p>This is another top-level page with its own subpages.</p>
    </div>
  );
};

const AnotherSubPage = () => {
  return (
    <div style={{ padding: 20 }}>
      <h2>Another Subpage</h2>
      <p>This is a subpage under "Another Page".</p>
    </div>
  );
};

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
            children: [
              {
                title: 'Subpage 1',
                path: '/sub1',
                element: <SubPage1 />,
              },
              {
                title: 'Subpage 2',
                path: '/sub2',
                element: <SubPage2 />,
                children: [
                  {
                    title: 'Nested Subpage',
                    path: '/nested',
                    element: <NestedSubPage />,
                  }
                ],
              },
            ],
          },
          {
            title: 'Another Page',
            path: '/another',
            children: [
              {
                index: true,
                element: <AnotherPage />,
              },
              {
                title: 'Another Subpage',
                path: '/sub',
                element: <AnotherSubPage />,
              },
            ],
          },
        ]}
      />
    </div>
  );
};
