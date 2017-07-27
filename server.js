/**
 * @fileoverview This is the server app script.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

const PROD_MODE = process.argv.includes('--prod');
const PORT = process.env.PORT || 5000;
const GITHUB_PAGE = 'https://github.com/omgimanerd/nycurl';

// Dependencies.
const colors = require('colors');
const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');

const analyticsFile = path.join(__dirname, 'logs/analytics.log');
const errorFile = path.join(__dirname, 'logs/error.log');

const analytics = require('./server/analytics');
const api = require('./server/api');
const formatter = require('./server/formatter');
const loggers = require('./server/loggers')({
  PROD_MODE: PROD_MODE,
  analyticsFile: analyticsFile,
  errorFile: errorFile
});
const Strings = require('./server/Strings');

const logError = loggers.errorLogger.error;

// Server initialization
const app = express();

app.set('port', PORT);
app.set('view engine', 'pug');
app.disable('etag');

app.use('/dist', express.static(__dirname + '/dist'));
app.use('/favicon.ico', express.static(__dirname + '/client/favicon.ico'));
app.use('/robots.txt', express.static(__dirname + '/robots.txt'));

// Dev output
app.use(loggers.devLogger);

// Write analytics-worthy requests to the analytics log file.
app.use(loggers.analyticsLogger);

// If the request is a curl request, we it as a param in the request object.
app.use((request, response, next) => {
  request.isCurl = (request.headers['user-agent'] || '').includes('curl');
  next();
});

app.get('/analytics', (request, response, next) => {
  if (request.isCurl) {
    next();
  } else {
    response.status(201).render('analytics');
  }
});

app.post('/analytics', (request, response) => {
  analytics.get(analyticsFile).then(data => {
    response.status(201).send(data);
  }).catch(error => {
    logError(error);
    response.status(500).send(error);
  });
});

app.get('/:section?', (request, response, next) => {
  if (!request.isCurl) {
    response.status(301).redirect(GITHUB_PAGE);
    return;
  }

  const section = request.params.section || 'home';
  if (section === 'help') {
    response.send(formatter.formatHelp(false));
    return;
  }
  if (!api.isValidSection(section)) {
    next();
    return;
  }
  api.fetchArticles(section).then(articles => {
    response.send(formatter.formatArticles(articles, request.query));
  }).catch(error => {
    logError(error);
    response.status(500).send(Strings.ERROR);
  });
});

app.use((request, response) => {
  response.status(400).send(formatter.formatHelp(true));
});

app.use((error, request, response, next) => {
  logError(error);
  response.status(500).send(Strings.ERROR);
});

// Starts the server.
http.Server(app).listen(PORT, () => {
  if (PROD_MODE) {
    console.log('STARTING PRODUCTION SERVER ON PORT ' + PORT);
  } else {
    console.log('STARTING DEV SERVER ON PORT ' + PORT);
  }
});
