/**
 * @fileoverview This is the server app script.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

// Constants
const PORT = process.env.PORT || 5000;

// Dependencies.
const colors = require('colors');
const express = require('express');
const fs = require('fs');
const http = require('http');
const morgan = require('morgan');
const path = require('path');
const responseTime = require('response-time');

const logFile = path.join(__dirname, 'logs/server.log');
const analyticsFile = path.join(__dirname, 'logs/analytics.log');
const Analytics = require('./lib/Analytics');
const ApiAccessor = require('./lib/ApiAccessor');
const DataFormatter = require('./lib/DataFormatter')

var analytics = Analytics.create(analyticsFile);
var apiAccessor = ApiAccessor.create({
  nytimes_api_key: process.env.NYTIMES_API_KEY,
  url_shortener_api_key: process.env.URL_SHORTENER_API_KEY
});
var app = express();
var server = http.Server(app);

app.set('port', PORT);
app.set('view engine', 'pug');

app.use('/public', express.static(__dirname + '/public'));
app.use('/robots.txt', express.static(__dirname + '/robots.txt'));
app.use('/favicon.ico',
  express.static(__dirname + '/public/images/favicon.ico'));
app.use(morgan('dev'));
app.use(morgan('combined', {
  stream: fs.createWriteStream(logFile, { flags: 'a' })
}));
app.use(responseTime({ digits: 2, header: 'response-time' }));
app.use(function(request, response, next) {
  request['userAgent'] = request.headers['user-agent'] || '';
  request['isCurl'] = request.userAgent.includes('curl');
  request['httpVersion'] = request['httpVersionMajor'] + '.' +
      request['httpVersionMinor'];
  next();
});

app.get('/help', function(request, response) {
  if (request.isCurl) {
    response.send('Valid queries:\n'.red +
        ApiAccessor.SECTIONS.join('\n') + '\n');
  } else {
    response.render('index', {
      header: 'Valid sections to query:',
      listSections: true,
      sections: ApiAccessor.SECTIONS
    });
  }
});

app.get('/:section?', function(request, response, next) {
  var section = request.params.section || 'home';
  if (!ApiAccessor.isValidSection(section)) {
    return next();
  }
  apiAccessor.fetch(section, function(error, results) {
    if (error) {
      if (request.isCurl) {
        response.status(500).send(
            'An error occurred. Please try again later. '.red +
            '(Most likely we hit our rate limit)\n'.red);
      } else {
        response.status(500).render('index', {
          header: 'An error occurred. Please try again later. ' +
            '(Most likely we hit our rate limit)'
        });
      }
    } else {
      if (request.isCurl) {
        response.send(DataFormatter.format(results) +
                      DataFormatter.TWITTER_LINK +
                      DataFormatter.GITHUB_LINK);
      } else {
        response.render('index', {
          header: `nycurl.sytes.net/${section}`,
          listSections: false,
          data: results
        });
      }
    }
  });
  analytics.log(request, response);
});

app.get('/analytics', function(request, response) {
  response.render('analytics');
});

app.post('/analytics', function(request, response) {
  analytics.getAnalytics(function(error, data) {
    response.send(data);
  });
});

app.use(function(request, response) {
  if (request.isCurl) {
    response.send('Invalid query! Valid queries:\n'.red +
        ApiAccessor.SECTIONS.join('\n') + '\n');
  } else {
    response.render('index', {
      header: 'Invalid query! Valid sections to query:',
      listSections: true,
      sections: ApiAccessor.SECTIONS
    });
  }
});

// Starts the server.
server.listen(PORT, function() {
  console.log('STARTING SERVER ON PORT ' + PORT);
  if (!process.env.NYTIMES_API_KEY) {
    throw new Error('No NYTimes API key specified.');
  }
  if (!process.env.URL_SHORTENER_API_KEY) {
    throw new Error('No URL shortener API key specified.');
  }
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('No SendGrid API key specified!');
  }
});
