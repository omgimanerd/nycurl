/**
 * @fileoverview This is the server app script.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

const PROD_MODE = process.argv.includes('--prod');
const PORT = process.env.PORT || 5000;

const GITHUB_PAGE = 'https://github.com/omgimanerd/nycurl';
const LOG_FILE = 'logs/server.log';
const ANALYTICS_FILE = 'logs/analytics.log';

// Dependencies.
const colors = require('colors');
const express = require('express');
const expressWinston = require('express-winston');
const fs = require('fs');
const http = require('http');
const path = require('path');
const winston = require('winston');

const logFile = path.join(__dirname, LOG_FILE);
const analyticsFile = path.join(__dirname, ANALYTICS_FILE);

const Analytics = require('./server/Analytics');
const ApiAccessor = require('./server/ApiAccessor');
const DataFormatter = require('./server/DataFormatter')

var app = express();
var server = http.Server(app);

app.set('port', PORT);
app.set('view engine', 'pug');
app.disable('etag');

app.use('/dist', express.static(__dirname + '/dist'));
app.use('/favicon.ico', express.static(__dirname + '/client/favicon.ico'));
app.use('/robots.txt', express.static(__dirname + '/robots.txt'));

// Write analytics-worthy requests to the analytics log file.
if (PROD_MODE) {
  app.use(morgan((tokens, request, response) => {
    return JSON.stringify({
      date: new Date(),
      httpVersion: `${request.httpVersionMajor}.${request.httpVersionMinor}`,
      ip: request.headers['x-forwarded-for'] || request.headers.ip,
      method: request.method,
      referrer: request.headers.referer || request.headers.referrer,
      responseTime: parseFloat(tokens['response-time'](request, response)),
      status: response.statusCode,
      url: request.url || request.originalUrl,
      userAgent: tokens['user-agent'](request, response)
    });
  }, {
    skip: (request, response) => {
      return response.statusCode != 200;
    },
    stream: analyticsFileStream
  }));
}

// If the request is a curl request, we it as a param in the request object.
app.use((request, response, next) => {
  request.isCurl = (request.headers['user-agent'] || '').includes('curl');
  next();
});

app.get('/:section?', (request, response, next) => {
  var section = request.params.section || 'home';
  if (section === 'help') {
    response.status(201).send(
        DataFormatter.formatHelp(ApiAccessor.SECTIONS, false));
    return;
  }
  if (!ApiAccessor.isValidSection(section)) {
    return next();
  }
  if (!request.isCurl) {
    response.status(301).redirect(GITHUB_PAGE);
    return;
  }
  ApiAccessor.fetchArticles(section).then(articles => {
    response.send(DataFormatter.formatArticles(articles, request.query));
  }).catch(error => {
    console.error(error);
    response.status(500).send(
        'An error occurred. Please try again later. '.red +
        '(Most likely we hit our rate limit)\n'.red);
  });
});

app.get('/analytics', (request, response, next) => {
  if (request.isCurl) {
    next();
  } else {
    response.status(201).render('analytics');
  }
});

app.post('/analytics', (request, response) => {
  Analytics.getAnalytics().then(data => {
    response.status(201).send(data);
  }).catch(error => {
    response.status(500).send(error);
  });
});

app.use((request, response) => {
  if (request.isCurl) {
    response.status(400).send(
      DataFormatter.formatHelp(ApiAccessor.SECTIONS, true));
  } else {
    response.status(400).render('index', {
      header: 'Invalid query! Valid sections to query:',
      listSections: true,
      sections: ApiAccessor.SECTIONS
    });
  }
});

// Starts the server.
server.listen(PORT, () => {
  console.log('STARTING SERVER ON PORT ' + PORT);
  if (PROD_MODE) {
    console.log('RUNNING AS PROD!');
  } else {
    console.log('RUNNING AS DEV!');
  }
});
