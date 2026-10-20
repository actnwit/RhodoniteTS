import express from 'express';

const app = express();

// Express 5 dropped the `express.static.mime` helper that was used to register the
// `mjs` extension. Serving ES modules therefore relies on the content type that
// `serve-static` detects out of the box.
app.use(express.static('./'));

const port = 8082;
app.listen(port, () => {
  console.log('Express server is running at http://localhost:' + port);
});
