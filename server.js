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

const Analytics = require('./server/Analytics');
const ApiAccessor = require('./server/ApiAccessor');
const DataFormatter = require('./server/DataFormatter')
const loggers = require('./server/loggers')({
  PROD_MODE: PROD_MODE,
  analyticsFile: analyticsFile,
  errorFile: errorFile
});

const logError = loggers.errorLogger.error;

// Server initialization
var app = express();

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
  Analytics.getAnalytics(analyticsFile).then(data => {
    response.status(201).send(data);
  }).catch(error => {
    logError(error);
    response.status(500).send(error);
  });
});

app.get('/:section?', (request, response, next) => {
  const section = request.params.section || 'home';
  if (!request.isCurl) {
    response.status(301).redirect(GITHUB_PAGE);
    return;
  }
  if (section === 'help') {
    response.send(DataFormatter.formatHelp(ApiAccessor.SECTIONS, false));
    return;
  }
  if (!ApiAccessor.isValidSection(section)) {
    next();
    return;
  }
  ApiAccessor.fetchArticles(section).then(articles => {
    response.send(DataFormatter.formatArticles(articles, request.query));
  }).catch(error => {
    logError(error);
    response.status(500).send(DataFormatter.ERROR);
  });
});

app.use((request, response) => {
  response.status(400).send(
      DataFormatter.formatHelp(ApiAccessor.SECTIONS, true));
});

app.use((error, request, response, next) => {
  logError(error);
  response.status(500).send(DataFormatter.ERROR);
});

// Starts the server.
http.Server(app).listen(PORT, () => {
  console.log(`STARTING SERVER ON PORT ${PORT}`);
  if (PROD_MODE) {
    console.log('RUNNING AS PROD!');
  } else {
    console.log('RUNNING AS DEV!');
  }
});
