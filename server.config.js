
const path = require('path');

module.exports = (env, argv) => ({
  output: path.join(__dirname, 'test/dist'),
  client: {
    main: {
      entry: './test/app.tsx',
      uri: '/',
    },
  },
  serverEntry: './test/server.ts'
})