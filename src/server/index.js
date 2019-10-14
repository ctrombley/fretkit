require('newrelic');
const handler = require('serve-handler');
const http = require('http');

const PORT = 5000;

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: 'build'
  });
})

server.listen(PORT, () => {
  console.log(`Running at http://localhost:${PORT}`);
});