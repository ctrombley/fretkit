const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const config = require('./webpack.config');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000,
  },
})
.listen(process.env.PORT, (err) => {
  if (err) {
    console.log(err);
  }

  console.log('Listening on port 3000.');
});
