// ./src/index.js

//importing the dependencies
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { startDatabase } = require('./database/mongo');
const {
  insertToDo,
  getToDos,
  deleteToDo,
  updateToDo
} = require('./database/to-dos');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// defining the Express app
const app = express();

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests (not very secure)
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.OIDC_PROVIDER}/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: process.env.API_IDENTIFIER,
  issuer: `https://${process.env.OIDC_PROVIDER}/`,
  algorithms: ['RS256']
});

app.use(checkJwt);

function hasScope(scope) {
  return function(req, res, next) {
    console.log(req.user);
    const { scopes } = req.user;
    const scopeArray = scopes.split(' ');
    if (!scopeArray.includes(scope)) return res.status(403).send();
    next();
  };
}

// endpoint to return all to dos
app.get('/', hasScope('read:to-dos'), async (req, res) => {
  res.send(await getToDos());
});

app.post('/', hasScope('create:to-dos'), async (req, res) => {
  const newToDo = req.body;
  await insertToDo(newToDo);
  res.send({ message: 'New to-do item inserted.' });
});

// endpoint to delete a to-do
app.delete('/:id', hasScope('delete:to-dos'), async (req, res) => {
  await deleteToDo(req.params.id);
  res.send({ message: 'To-do item removed.' });
});

// endpoint to update a to-do item
app.put('/:id', hasScope('update:to-dos'), async (req, res) => {
  const updatedToDo = req.body;
  await updateToDo(req.params.id, updatedToDo);
  res.send({ message: 'To-do item updated.' });
});

// start the in-memory MongoDB instance
startDatabase().then(() => {
  // start the server
  app.listen(process.env.PORT || 3001, async () => {
    console.log(`listening on port ${process.env.PORT || '3001'}`);
  });
});
