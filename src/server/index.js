require('newrelic');

const express = require('express');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static('dist'));
app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  }

  console.log(`Listening on port ${PORT}.`);
});
