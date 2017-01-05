/**
 * @fileoverview This is the server app script.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

// Constants
const PORT = process.env.PORT || 5000;

// Dependencies.
var chalk = require('chalk');
var emailAlerts = require('email-alerts');
var express = require('express');
var fs = require('fs');
var morgan = require('morgan');
var path = require('path');
var http = require('http');

var logFile = path.join(__dirname, 'logs/server.log');
var ApiAccessor = require('./lib/ApiAccessor');
var DataFormatter = require('./lib/DataFormatter')

// Initialization.
var alert = emailAlerts({
  fromEmail: process.env.ALERT_SENDER_EMAIL,
  toEmail: process.env.ALERT_RECEIVER_EMAIL,
  apiKey: process.env.SENDGRID_API_KEY,
  subject: 'Error - nycurl'
});
var apiAccessor = ApiAccessor.create({
  nytimes_api_key: process.env.NYTIMES_API_KEY,
  url_shortener_api_key: process.env.URL_SHORTENER_API_KEY
});
var app = express();
var logWriteStream = fs.createWriteStream(logFile, { flags: 'a' });
/**
 * Custom token for logging.
 */
morgan.token('log', function(request, response) {
  // Taken from morgan source code.
  var responseTime = (response._startAt[0] - request._startAt[0]) * 1e3 +
    (response._startAt[1] - request._startAt[1]) * 1e-6;
  return JSON.stringify({
    date: (new Date()).toUTCString(),
    httpVersion: request.httpVersionMajor + '.' + request.httpVersionMinor,
    method: request.method,
    referrer: request.headers['referer'] || request.headers['referrer'],
    ip: request.headers['x-forwarded-for'] || request.headers['ip'],
    responseTime: responseTime,
    status: response.statusCode,
    url: request.url ||  request.originalUrl,
    userAgent: request.headers['user-agent']
  });
});
var server = http.Server(app);

app.set('port', PORT);
app.set('view engine', 'pug');

app.use('/public', express.static(__dirname + '/public'));
app.use('/robots.txt', express.static(__dirname + '/robots.txt'));
app.use('/favicon.ico',
  express.static(__dirname + '/public/images/favicon.ico'));
app.use(morgan('dev'));
app.use(morgan(':log', {
  stream: logWriteStream
}));
app.use(function(request, response, next) {
  request.userAgent = request.headers['user-agent'] || '';
  request.isCurl = request.userAgent.includes('curl');
  next();
});

app.get('/help', function(request, response) {
  if (request.isCurl) {
    response.send(chalk.green(
      'Valid queries:\n' + (
      ApiAccessor.SECTIONS.join('\n') + '\n')));
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
  apiAccessor.fetch(section, alert.errorHandler(function(error, results) {
    if (error) {
      if (request.isCurl) {
        response.status(500).send(chalk.red(
            'An error occurred. Please try again later. ' +
            '(Most likely we hit our rate limit)\n'));
      } else {
        response.status(500).render('index', {
          header: 'An error occurred. Please try again later. ' +
            '(Most likely we hit our rate limit)'
        });
      }
    } else {
      if (request.isCurl) {
        response.send(DataFormatter.CURL_HELP +
                      DataFormatter.format(results) +
                      DataFormatter.CURL_TWITTER_LINK +
                      DataFormatter.CURL_GITHUB_LINK);
      } else {
        response.render('index', {
          header: `nycurl.sytes.net/${section}`,
          listSections: false,
          data: results
        });
      }
    }
  }));
});

app.use(function(request, response) {
  if (request.isCurl) {
    response.send(chalk.red(
      'Invalid query! Valid queries:\n' + (
      ApiAccessor.SECTIONS.join('\n') + '\n')));
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
