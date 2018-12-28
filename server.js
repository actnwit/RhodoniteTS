let express = require('express');
express.static.mime.define({'application/javascript': ['mjs']})
let app = express();
app.use(express.static('./'));

let port = 8082;
app.listen(port, ()=> {
  console.log('Express server is running');
});
