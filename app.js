const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require('./db');
const path = require('path');
const jwt = require('jsonwebtoken');
const req = require('express/lib/request');

const requireToken = async function (req, res, next) {
  try {
    const user = await User.byToken(req.headers.authorization);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', requireToken, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

app.delete('/api/auth', async (req, res, next) => {
  try {
    res.send();
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

app.get('/api/auth/notes', requireToken, async (req, res, next) => {
  try {
    const user = req.user;
    const notes = await Note.findAll({
      where: {
        userId: user.id,
      },
    });
    res.send(notes);
  } catch (ex) {
    next(ex);
  }
});

module.exports = app;
