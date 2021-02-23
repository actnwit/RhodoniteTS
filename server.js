const express = require('express');
express.static.mime.define({'application/javascript': ['mjs']});
const app = express();
app.use(express.static('./'));

const port = 8082;
app.listen(port, () => {
  console.log('Express server is running at http://localhost:' + port);
});
